"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, X } from "lucide-react";

export default function LoginPanel({
  onClose,
  onSwitchToRegister,
}: {
  onClose: () => void;
  onSwitchToRegister: () => void;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
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
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }
      onClose();
      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative flex w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl animate-pop-in">
        <button onClick={onClose} className="absolute right-5 top-5 z-10 text-zinc-400 hover:text-zinc-700">
          <X size={22} />
        </button>
        <div className="hidden w-1/2 flex-col justify-center gap-10 bg-gradient-to-br from-[#0A1F44] to-[#8a6d1f] p-8 sm:flex">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Homzy logo" width={90} height={90} />
            <span className="text-4xl font-bold">
              <span className="text-white">Hom</span>
              <span className="text-[#D4AF37]">zy</span>
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Find a place you&apos;ll love to call home.</h2>
            <Image src="/house.png" alt="House" width={300} height={200} className="mt-6 rounded-lg object-cover shadow-lg" />
          </div>
        </div>
        <div className="w-full p-8 sm:w-1/2">
          <h1 className="text-2xl font-bold text-[#0A1F44]">Log in to Homzy</h1>
          <p className="mt-1 text-sm text-zinc-600">Welcome back - find your next home.</p>
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div>
              <label htmlFor="panel-email" className="text-sm font-medium text-zinc-700">Email</label>
              <input id="panel-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]" />
            </div>
            <div>
              <label htmlFor="panel-password" className="text-sm font-medium text-zinc-700">Password</label>
              <div className="relative mt-1">
                <input id="panel-password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full rounded-md border border-zinc-300 px-3 py-2 pr-10 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="mt-2 rounded-md bg-[#D4AF37] px-4 py-2 font-semibold text-[#0A1F44] hover:bg-[#c19d2e] disabled:opacity-60">
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-zinc-600">
            Don&apos;t have an account?{" "}
            <button onClick={onSwitchToRegister} className="font-medium text-[#0A1F44] hover:underline">
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}