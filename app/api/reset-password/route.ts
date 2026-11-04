
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newPassword =
      typeof body.newPassword === "string" ? body.newPassword : "";
    const confirmPassword =
      typeof body.confirmPassword === "string" ? body.confirmPassword : "";

    if (!newPassword || !confirmPassword) {
      return NextResponse.json(
        { message: "Both password fields are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { message: "Password must contain at least 8 characters." },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { message: "Passwords do not match." },
        { status: 400 }
      );
    }

    const resetToken = request.cookies.get("homzy_password_reset")?.value;

    if (!resetToken) {
      return NextResponse.json(
        { message: "Please verify your OTP first." },
        { status: 401 }
      );
    }

    const secret = process.env.AUTH_SECRET;

    if (!secret) {
      throw new Error("AUTH_SECRET is not configured.");
    }

    const key = new TextEncoder().encode(secret);

    const { payload } = await jwtVerify(resetToken, key, {
      algorithms: ["HS256"],
    });

    if (
      payload.purpose !== "password-reset" ||
      typeof payload.tokenId !== "string" ||
      typeof payload.userId !== "string"
    ) {
      return NextResponse.json(
        { message: "Invalid password reset session." },
        { status: 401 }
      );
    }

    const record = await prisma.passwordResetToken.findFirst({
      where: {
        id: payload.tokenId,
        userId: payload.userId,
        usedAt: null,
        expiresAt: { gt: new Date() },
        attempts: { lt: 5 },
      },
    });

    if (!record) {
      const response = NextResponse.json(
        { message: "This password reset session has expired. Request a new OTP." },
        { status: 400 }
      );
      response.cookies.delete("homzy_password_reset");
      return response;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: payload.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    const response = NextResponse.json({
      message: "Password reset successfully. You can now log in.",
    });

    response.cookies.delete("homzy_password_reset");

    return response;
  } catch (error) {
    console.error("Password reset error:", error);

    return NextResponse.json(
      { message: "Unable to reset password. Please request a new OTP." },
      { status: 400 }
    );
  }
}
