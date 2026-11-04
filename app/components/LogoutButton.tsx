"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-md bg-[#D4AF37] px-4 py-2 text-[#0A1F44] font-semibold hover:bg-[#c19d2e]"
    >
      Logout
    </button>
  );
}