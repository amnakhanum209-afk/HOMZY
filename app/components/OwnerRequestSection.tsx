"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type OwnerRequestData = {
  isOwner: boolean;
  request: {
    status: string;
    message: string | null;
    createdAt: string;
  } | null;
};

export default function OwnerRequestSection() {
  const router = useRouter();

  const [data, setData] = useState<OwnerRequestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadStatus() {
    try {
      const response = await fetch("/api/owner/request");
      const result = await response.json();

      if (response.status === 401) {
        setError("Please log in to request owner access.");
        return;
      }

      if (!response.ok) {
        setError(result.error || "Unable to load your request status.");
        return;
      }

      setData(result);
      setError("");
    } catch {
      setError("Unable to connect to HOMZY. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  async function submitRequest() {
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/owner/request", {
        method: "POST",
      });

      const result = await response.json();

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (!response.ok) {
        setError(result.error || "Unable to submit your request.");
        return;
      }

      setSuccess(result.message || "Your request was submitted.");
      await loadStatus();
    } catch {
      setError("Unable to connect to HOMZY. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      id="become-owner"
      className="bg-white px-6 py-16 sm:px-8"
    >
      <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-[#D4AF6A]/40 shadow-lg">
        <div className="bg-gradient-to-r from-[#08182B] via-[#10243A] to-[#24486A] px-8 py-10 text-center">
          <p className="font-semibold uppercase tracking-[0.2em] text-[#D4AF6A]">
            Have a property to rent?
          </p>

          <h2 className="mt-3 text-3xl font-bold text-white">
            Become a HOMZY Owner
          </h2>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-gray-200">
            List your properties and connect with people looking for
            their perfect home.
          </p>
        </div>

        <div className="bg-[#F7F5F0] px-6 py-9 text-center sm:px-10">
          {loading ? (
            <p className="text-[#10243A]">
              Checking your owner access status...
            </p>
          ) : data?.isOwner ? (
            <>
              <h3 className="text-xl font-bold text-[#10243A]">
                Your owner access is approved!
              </h3>

              <p className="mt-3 text-gray-600">
                You can now manage and list your rental properties.
              </p>

              <Link
                href="/properties/my"
                className="mt-6 inline-block rounded-lg bg-[#10243A] px-7 py-3 font-semibold text-white hover:bg-[#24486A]"
              >
                Open Owner Dashboard
              </Link>
            </>
          ) : data?.request?.status === "PENDING" ? (
            <>
              <h3 className="text-xl font-bold text-[#10243A]">
                Request Under Review
              </h3>

              <p className="mt-3 text-gray-600">
                Your owner access request has been submitted.
                Please wait for administrator approval.
              </p>

              <span className="mt-5 inline-block rounded-full bg-[#D4AF6A]/30 px-5 py-2 font-bold text-[#10243A]">
                Status: PENDING
              </span>
            </>
          ) : (
            <>
              <h3 className="text-xl font-bold text-[#10243A]">
                Request Owner Access
              </h3>

              <p className="mx-auto mt-3 max-w-2xl leading-7 text-gray-600">
                Use your existing HOMZY tenant account to request
                permission to list properties. You do not need
                another account.
              </p>

              <div className="mx-auto mt-6 max-w-xl rounded-xl bg-white p-5 text-left">
                <h4 className="font-bold text-[#10243A]">
                  What happens next?
                </h4>

                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-600">
                  <li>Submit your owner access request.</li>
                  <li>An administrator reviews your request.</li>
                  <li>After approval, you can list properties.</li>
                </ul>
              </div>

              <button
                onClick={submitRequest}
                disabled={submitting}
                className="mt-7 rounded-lg bg-gradient-to-r from-[#B88A3B] to-[#D4AF6A] px-8 py-3 font-bold text-[#10243A] transition hover:brightness-105 disabled:opacity-60"
              >
                {submitting
                  ? "Submitting..."
                  : "Request Owner Access"}
              </button>
            </>
          )}

          {success && (
            <p className="mt-5 text-sm font-medium text-green-700">
              {success}
            </p>
          )}

          {error && (
            <p className="mt-5 text-sm font-medium text-red-600">
              {error}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}