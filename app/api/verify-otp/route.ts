
import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { SignJWT } from "jose";
import { prisma } from "@/lib/prisma";

function hashOtp(otp: string, userId: string) {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not configured.");
  }

  return createHmac("sha256", secret)
    .update(`${userId}:${otp}`)
    .digest("hex");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const otp = typeof body.otp === "string" ? body.otp.trim() : "";

    if (!email || !/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { message: "Enter your email and the 6-digit OTP." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid or expired OTP." },
        { status: 400 }
      );
    }

    const record = await prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!record || record.attempts >= 5) {
      return NextResponse.json(
        { message: "Invalid or expired OTP. Request a new one." },
        { status: 400 }
      );
    }

    const submittedHash = hashOtp(otp, user.id);

    if (submittedHash !== record.tokenHash) {
      await prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });

      return NextResponse.json(
        { message: "Invalid or expired OTP." },
        { status: 400 }
      );
    }

    const secret = process.env.AUTH_SECRET;

    if (!secret) {
      throw new Error("AUTH_SECRET is not configured.");
    }

    const key = new TextEncoder().encode(secret);

    const resetToken = await new SignJWT({
      purpose: "password-reset",
      tokenId: record.id,
      userId: user.id,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("10m")
      .sign(key);

    const response = NextResponse.json({
      message: "OTP verified successfully.",
    });

    response.cookies.set("homzy_password_reset", resetToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60,
    });

    return response;
  } catch (error) {
    console.error("OTP verification error:", error);

    return NextResponse.json(
      { message: "Unable to verify OTP. Please try again." },
      { status: 500 }
    );
  }
}
