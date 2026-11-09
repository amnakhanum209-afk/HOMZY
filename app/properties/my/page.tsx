
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AssistantChat from "@/app/components/AssistantChat";

type Property = {
  id: string;
  title: string;
  city: string;
  locality: string;
  monthlyRent: number;
  bedrooms: number;
  bathrooms: number;
  status: string;
};

export default function MyPropertiesPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadProperties() {
      try {
        const response = await fetch("/api/properties/my");

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to load properties");
        }

        const data = await response.json();
        setProperties(data);
      } catch (error) {
        console.error("Error loading properties:", error);
        alert("Failed to load properties. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    }

    loadProperties();
  }, [router]);

  async function handleDeactivate(id: string) {
    const property = properties.find((p) => p.id === id);

    if (!property || property.status === "INACTIVE") return;

    const confirmed = window.confirm(
      `Are you sure you want to deactivate "${property.title}"?\n\n` +
        "This property will no longer appear in public search."
    );

    if (!confirmed) return;

    try {
      setProcessingId(id);

      const response = await fetch(`/api/properties/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "INACTIVE" }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to deactivate property.");
      }

      setProperties((current) =>
        current.map((p) =>
          p.id === id ? { ...p, status: "INACTIVE" } : p
        )
      );

      alert("Property deactivated successfully.");
    } catch (error) {
      console.error("Error deactivating property:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReactivate(id: string) {
    const property = properties.find((p) => p.id === id);

    if (!property || property.status !== "INACTIVE") return;

    const confirmed = window.confirm(
      `Do you want to reactivate "${property.title}"?\n\n` +
        "If its previous status is unavailable, it will return to Pending for review."
    );

    if (!confirmed) return;

    try {
      setProcessingId(id);

      const response = await fetch(`/api/properties/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reactivate: true }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to reactivate property.");
      }

      setProperties((current) =>
        current.map((p) =>
          p.id === id
            ? { ...p, status: result.property.status }
            : p
        )
      );

      alert(result.message || "Property reactivated successfully.");
    } catch (error) {
      console.error("Error reactivating property:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function handleDelete(id: string) {
    const property = properties.find((p) => p.id === id);

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${property?.title ?? "this property"}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setProcessingId(id);

      const response = await fetch(`/api/properties/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete property.");
      }

      setProperties((current) =>
        current.filter((p) => p.id !== id)
      );

      alert("Property deleted successfully.");
    } catch (error) {
      console.error("Error deleting property:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setProcessingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A1F44]">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A1F44] px-4 py-12 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-white">My Properties</h1>

          <Link
            href="/properties/new"
            className="rounded-md bg-[#D4AF37] px-4 py-2 font-semibold text-[#0A1F44] hover:bg-[#c19d2e]"
          >
            + List New Property
          </Link>
        </div>

        {properties.length === 0 ? (
          <p className="mt-8 text-zinc-300">
            You haven&apos;t listed any properties yet.
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <div
                key={property.id}
                className="overflow-hidden rounded-lg border border-[#1E3A6D] bg-white"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-semibold text-zinc-900">
                      {property.title}
                    </h3>

                    <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">
                      {property.status}
                    </span>
                  </div>

                  <p className="text-sm text-zinc-500">
                    {property.locality}, {property.city}
                  </p>

                  <p className="mt-2 text-lg font-bold text-[#0A1F44]">
                    ₹{property.monthlyRent.toLocaleString("en-IN")}/month
                  </p>

                  <p className="mt-1 text-sm text-zinc-600">
                    {property.bedrooms} Beds · {property.bathrooms} Baths
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/properties/${property.id}/edit`}
                      className="flex-1 rounded-md border border-[#0A1F44] px-3 py-1.5 text-center text-sm font-medium text-[#0A1F44] hover:bg-zinc-50"
                    >
                      Edit
                    </Link>

                    {property.status === "INACTIVE" ? (
                      <button
                        onClick={() => handleReactivate(property.id)}
                        disabled={processingId === property.id}
                        className="flex-1 rounded-md bg-green-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {processingId === property.id
                          ? "Processing..."
                          : "Reactivate"}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDeactivate(property.id)}
                        disabled={processingId === property.id}
                        className="flex-1 rounded-md border border-zinc-400 px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {processingId === property.id
                          ? "Processing..."
                          : "Deactivate"}
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(property.id)}
                      disabled={processingId === property.id}
                      className="flex-1 rounded-md border border-red-600 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {processingId === property.id ? "Processing..." : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* OWNER AI ASSISTANT */}
      <section className="mx-auto mt-12 max-w-6xl">
        <AssistantChat embedded />
      </section>
    </div>
  );
}
