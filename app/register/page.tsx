
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, X, House } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, phone, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }

      router.push("/login");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#08182B] px-4 py-8 sm:px-6">
      <section className="grid w-full max-w-6xl overflow-hidden rounded-3xl shadow-2xl lg:grid-cols-[1fr_1.08fr]">

        {/* Left branding panel */}
        <div className="relative flex flex-col justify-center overflow-hidden bg-gradient-to-br from-[#08182B] via-[#10243A] to-[#24486A] px-8 py-10 sm:px-12 lg:py-14">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#D4AF6A]/10 blur-3xl" />

          <Link href="/" className="relative mb-12 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D4AF6A]/60 bg-white/10">
              <House size={34} className="text-[#D4AF6A]" />
            </div>
            <span className="text-4xl font-bold tracking-tight text-white">
              Hom<span className="text-[#D4AF6A]">zy</span>
            </span>
          </Link>

          <div className="relative">
            <h2 className="max-w-md text-3xl font-bold leading-tight text-white sm:text-4xl">
              Find a place you&apos;ll love to call home.
            </h2>

            <p className="mt-4 max-w-md text-base leading-7 text-[#E0E7EF]">
              Discover rental homes that fit your budget, lifestyle, and
              daily travel needs — powered by HOMZY.
            </p>

            <div className="mt-8 overflow-hidden rounded-2xl border border-white/15 shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=85"
                alt="Beautiful modern family home"
                className="h-56 w-full object-cover sm:h-64"
              />
            </div>

            <div className="mt-6 flex items-center gap-2">
              <span className="h-1.5 w-8 rounded-full bg-[#D4AF6A]" />
              <span className="h-1.5 w-2 rounded-full bg-white/40" />
              <span className="h-1.5 w-2 rounded-full bg-white/40" />
            </div>
          </div>

          <p className="relative mt-10 text-xs tracking-wide text-white/50">
            YOUR NEXT CHAPTER STARTS AT HOME
          </p>
        </div>

        {/* Right registration panel */}
        <div className="relative bg-white px-6 py-8 sm:px-10 sm:py-10 lg:px-12">
          <Link
            href="/"
            aria-label="Close registration and return home"
            className="absolute right-5 top-5 rounded-full p-2 text-[#10243A]/60 transition hover:bg-[#F7F5F0] hover:text-[#10243A]"
          >
            <X size={23} />
          </Link>

          <div className="mx-auto w-full max-w-lg pt-4">
            <h1 className="pr-7 text-2xl font-bold tracking-tight text-[#10243A] sm:text-3xl">
              Create your HOMZY account
            </h1>

            <p className="mt-2 text-sm text-zinc-600 sm:text-base">
              Find a place you&apos;ll love to call home.
            </p>

            <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="text-sm font-medium text-[#10243A]">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-3 text-zinc-900 outline-none transition focus:border-[#D4AF6A] focus:ring-2 focus:ring-[#D4AF6A]/30"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="text-sm font-medium text-[#10243A]">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-3 text-zinc-900 outline-none transition focus:border-[#D4AF6A] focus:ring-2 focus:ring-[#D4AF6A]/30"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="text-sm font-medium text-[#10243A]">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-3 text-zinc-900 outline-none transition focus:border-[#D4AF6A] focus:ring-2 focus:ring-[#D4AF6A]/30"
                />
              </div>

              <div>
                <label htmlFor="phone" className="text-sm font-medium text-[#10243A]">
                  Contact Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-3 text-zinc-900 outline-none transition focus:border-[#D4AF6A] focus:ring-2 focus:ring-[#D4AF6A]/30"
                />
              </div>

              <div>
                <label htmlFor="password" className="text-sm font-medium text-[#10243A]">
                  Password
                </label>

                <div className="relative mt-2">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-lg border border-zinc-300 px-3 py-3 pr-12 text-zinc-900 outline-none transition focus:border-[#D4AF6A] focus:ring-2 focus:ring-[#D4AF6A]/30"
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

                <p className="mt-1.5 text-xs text-zinc-500">
                  Use at least 8 characters.
                </p>
              </div>

              {error && (
                <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-1 w-full rounded-lg bg-gradient-to-r from-[#B88A3B] via-[#D4AF6A] to-[#F1DDA8] px-4 py-3.5 font-semibold text-[#10243A] shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-zinc-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-[#10243A] underline decoration-[#D4AF6A] underline-offset-4 hover:text-[#B88A3B]"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
