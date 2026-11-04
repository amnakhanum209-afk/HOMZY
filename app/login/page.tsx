
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, House, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to log in. Please try again.");
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F5F0] px-4 py-10">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[#10243A] hover:text-[#B88A3B]"
        >
          <ArrowLeft size={17} />
          Back to home
        </Link>

        <section className="overflow-hidden rounded-2xl border border-[#D4AF6A]/40 bg-white shadow-xl">
          <div className="bg-gradient-to-br from-[#08182B] via-[#10243A] to-[#24486A] px-8 py-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#D4AF6A] bg-white/10">
              <House size={30} className="text-[#D4AF6A]" />
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">
              Welcome Back
            </h1>

            <p className="mt-2 text-sm text-[#F7F5F0]">
              Find your place. Feel at home.
            </p>

            <div className="mx-auto mt-4 h-1 w-14 rounded-full bg-[#D4AF6A]" />
          </div>

          <div className="p-7 sm:p-8">
            <h2 className="text-xl font-semibold text-[#10243A]">
              Log in to HOMZY
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Enter your account details to continue.
            </p>

            <form
              onSubmit={handleSubmit}
              autoComplete="off"
              className="mt-6 flex flex-col gap-5"
            >
              <div>
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-[#10243A]"
                >
                  Email address
                </label>

                <input
                  id="email"
                  name="homzy-login-email"
                  type="email"
                  autoComplete="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-[#D4AF6A] focus:ring-2 focus:ring-[#D4AF6A]/30"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-[#10243A]"
                  >
                    Password
                  </label>

                  <Link
                    href="/forgot-password"
                    className="text-sm font-semibold text-[#B88A3B] hover:text-[#10243A] hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>

                <div className="relative mt-2">
                  <input
                    id="password"
                    name="homzy-login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="off"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 pr-12 text-zinc-900 outline-none transition focus:border-[#D4AF6A] focus:ring-2 focus:ring-[#D4AF6A]/30"
                    placeholder="Enter your password"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-[#10243A]"
                  >
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-1 w-full rounded-lg bg-gradient-to-r from-[#B88A3B] via-[#D4AF6A] to-[#F1DDA8] px-4 py-3 font-semibold text-[#10243A] shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Logging in..." : "Log In"}
              </button>
            </form>

            <div className="my-6 border-t border-zinc-200" />

            <p className="text-center text-sm text-zinc-600">
              New to HOMZY?{" "}
              <Link
                href="/register"
                className="font-semibold text-[#10243A] underline decoration-[#D4AF6A] underline-offset-4 hover:text-[#B88A3B]"
              >
                Create an account
              </Link>
            </p>
          </div>
        </section>

        <p className="mt-5 text-center text-xs text-zinc-500">
          Your next chapter starts with the right home.
        </p>
      </div>
    </main>
  );
}