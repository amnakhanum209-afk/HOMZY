"use client";

import { useRouter, useSearchParams } from "next/navigation";

type PaginationProps = {
  page: number;
  totalPages: number;
};

export default function Pagination({ page, totalPages }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function goTo(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/properties?${params.toString()}`);
  }

  if (totalPages <= 1) return null;

  return (
    <div className="mt-8 flex items-center justify-center gap-3">
      <button
        onClick={() => goTo(page - 1)}
        disabled={page <= 1}
        className="rounded-md border border-[#1E3A6D] px-4 py-2 text-sm text-white disabled:opacity-40"
      >
        Previous
      </button>
      <span className="text-sm text-zinc-300">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => goTo(page + 1)}
        disabled={page >= totalPages}
        className="rounded-md border border-[#1E3A6D] px-4 py-2 text-sm text-white disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}