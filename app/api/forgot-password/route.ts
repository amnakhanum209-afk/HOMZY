
import { NextResponse } from "next/server";
import { randomInt, createHmac } from "crypto";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const resend = new Resend(process.env.RESEND_API_KEY);

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

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { message: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const testEmail = process.env.RESEND_TEST_EMAIL?.trim().toLowerCase();
    const fromEmail = process.env.RESEND_FROM_EMAIL;

    if (!testEmail || !fromEmail || !process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { message: "Email service is not configured." },
        { status: 500 }
      );
    }

    // Test mode: only send to the email registered with Resend.
    if (process.env.NODE_ENV !== "production" && email !== testEmail) {
      return NextResponse.json({
        message:
          "For testing, use the email address registered with the Resend account.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    // Do not reveal whether an account exists.
    if (!user) {
      return NextResponse.json({
        message:
          "If an account exists with this email, an OTP will be sent.",
      });
    }

    const otp = randomInt(100000, 1000000).toString();
    const tokenHash = hashOtp(otp, user.id);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
        attempts: 0,
      },
    });

    const { error } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: "Your HOMZY password reset OTP",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;color:#17233f">
          <h2 style="color:#17233f">HOMZY Password Reset</h2>
          <p>Use this one-time password to reset your HOMZY account password:</p>
          <div style="font-size:32px;font-weight:bold;letter-spacing:8px;padding:18px;background:#f5f0e6;text-align:center;color:#b18a42">
            ${otp}
          </div>
          <p>This OTP expires in 10 minutes. Do not share it with anyone.</p>
          <p>If you did not request this, you can ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id, tokenHash },
      });

      console.error("Resend email error:", error);

      return NextResponse.json(
        { message: "Unable to send the OTP. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "If an account exists with this email, an OTP will be sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return NextResponse.json(
      { message: "Unable to process your request. Please try again." },
      { status: 500 }
    );
  }
}
