
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

type Step = "email" | "otp" | "password";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resetComplete, setResetComplete] = useState(false);

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#B28A45] focus:ring-2 focus:ring-[#B28A45]/20";

  async function sendOtp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!email.trim()) {
      setError("Please enter your registered email address.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to send OTP.");
      }

      setMessage(data.message || "If an account exists, an OTP will be sent.");
      setStep("otp");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to process your request."
      );
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!/^\d{6}$/.test(otp.trim())) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "OTP verification failed.");
      }

      setMessage("OTP verified successfully.");
      setStep("password");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to verify OTP."
      );
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setError("");

    if (newPassword.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to reset password.");
      }

      setMessage(data.message || "Password reset successfully.");
      setResetComplete(true);
      setNewPassword("");
      setConfirmPassword("");
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to reset password."
      );
    } finally {
      setLoading(false);
    }
  }

  const steps: Step[] = ["email", "otp", "password"];

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8F6F1] px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">

        {/* HOMZY Branding */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-wide text-[#172B4D]">
            HOMZY
          </h1>
          <p className="mt-2 text-sm text-[#B28A45]">
            Find a place to call home
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {steps.map((item, index) => {
            const currentIndex = steps.indexOf(step);
            const isCompleted = index < currentIndex;
            const isCurrent = item === step;

            return (
              <div key={item} className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                    isCurrent
                      ? "bg-[#172B4D] text-white"
                      : isCompleted
                      ? "bg-[#B28A45] text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {index + 1}
                </div>

                {index < 2 && (
                  <div className="h-0.5 w-8 bg-gray-200" />
                )}
              </div>
            );
          })}
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-semibold text-[#172B4D]">
          {step === "email"
            ? "Forgot Password?"
            : step === "otp"
            ? "Verify OTP"
            : "Create New Password"}
        </h2>

        <p className="mt-3 text-sm leading-6 text-gray-600">
          {step === "email"
            ? "Enter your registered email address. We'll send you a 6-digit OTP."
            : step === "otp"
            ? `Enter the 6-digit OTP sent to ${email}. It expires in 10 minutes.`
            : "Your OTP is verified. Enter your new password below."}
        </p>

        {/* Step 1: Email */}
        {step === "email" && (
          <form onSubmit={sendOtp} className="mt-7 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your registered email"
                required
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#172B4D] px-4 py-3 font-medium text-white transition hover:bg-[#243D65] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        )}

        {/* Step 2: OTP */}
        {step === "otp" && (
          <form onSubmit={verifyOtp} className="mt-7 space-y-5">
            <div>
              <label
                htmlFor="otp"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                6-Digit OTP
              </label>

              <input
                id="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, ""))
                }
                placeholder="Enter your OTP"
                required
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#172B4D] px-4 py-3 font-medium text-white transition hover:bg-[#243D65] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("email");
                setOtp("");
                setError("");
                setMessage("");
              }}
              className="w-full text-sm font-medium text-[#B28A45] hover:underline"
            >
              Change email address
            </button>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === "password" && (
          <form onSubmit={resetPassword} className="mt-7 space-y-5">

            {/* New Password */}
            <div>
              <label
                htmlFor="newPassword"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                New Password
              </label>

              <div className="relative">
                <input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  minLength={8}
                  required
                  className={`${inputClass} pr-12`}
                />

                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B28A45] hover:text-[#172B4D]"
                  aria-label={
                    showNewPassword ? "Hide new password" : "Show new password"
                  }
                >
                  {showNewPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Confirm New Password
              </label>

              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  minLength={8}
                  required
                  className={`${inputClass} pr-12`}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword((prev) => !prev)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B28A45] hover:text-[#172B4D]"
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || resetComplete}
              className="w-full rounded-lg bg-[#172B4D] px-4 py-3 font-medium text-white transition hover:bg-[#243D65] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Updating..." : "Reset Password"}
            </button>
          </form>
        )}

        {/* Error Message */}
        {error && (
          <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {/* Success Message */}
        {message && (
          <p className="mt-5 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            {message}
          </p>
        )}

        {/* Login Link */}
        <div className="mt-6 text-center">
          {resetComplete ? (
            <Link
              href="/login"
              className="text-sm font-semibold text-[#B28A45] hover:underline"
            >
              Go to Login
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium text-[#B28A45] hover:underline"
            >
              Back to Login
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
