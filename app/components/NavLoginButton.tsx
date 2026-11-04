"use client";

import Link from "next/link";

export default function NavLoginButton() {
  return (
    <Link
      href="/login"
      className="rounded-md border border-[#10243A] bg-[#10243A] px-5 py-2 font-semibold uppercase tracking-wider text-[#F1DDA8] transition hover:bg-[#24486A]"
    >
      LOGIN
    </Link>
  );
}