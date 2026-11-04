
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

type Property = {
  id: string;
  title: string;
  description: string | null;
  propertyType: string;
  address: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  monthlyRent: number | string;
  securityDeposit: number | string;
  area: number | string;
  bedrooms: number;
  bathrooms: number;
  furnishing: string;
  parking: boolean;
};

export default function EditPropertyPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [propertyType, setPropertyType] = useState("APARTMENT");
  const [address, setAddress] = useState("");
  const [locality, setLocality] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [area, setArea] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [furnishing, setFurnishing] = useState("UNFURNISHED");
  const [parking, setParking] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProperty() {
      try {
        setInitialLoading(true);
        setError("");

        const response = await fetch("/api/properties/my");
        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401) {
            setError(
              "Please log in as the property owner to edit this property."
            );
          } else {
            setError(
              data?.error || "Unable to load your properties."
            );
          }
          return;
        }

        if (!Array.isArray(data)) {
          setError("The server returned an unexpected response.");
          return;
        }

        const property = data.find(
          (item: Property) => item.id === id
        ) as Property | undefined;

        if (!property) {
          setError(
            "This property was not found in your account."
          );
          return;
        }

        if (cancelled) return;

        setTitle(property.title ?? "");
        setDescription(property.description ?? "");
        setPropertyType(property.propertyType ?? "APARTMENT");
        setAddress(property.address ?? "");
        setLocality(property.locality ?? "");
        setCity(property.city ?? "");
        setState(property.state ?? "");
        setPincode(property.pincode ?? "");
        setMonthlyRent(String(property.monthlyRent ?? ""));
        setSecurityDeposit(String(property.securityDeposit ?? ""));
        setArea(String(property.area ?? ""));
        setBedrooms(String(property.bedrooms ?? ""));
        setBathrooms(String(property.bathrooms ?? ""));
        setFurnishing(property.furnishing ?? "UNFURNISHED");
        setParking(Boolean(property.parking));
      } catch {
        if (!cancelled) {
          setError("Unable to load the property. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setInitialLoading(false);
        }
      }
    }

    loadProperty();

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`/api/properties/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          propertyType,
          address,
          locality,
          city,
          state,
          pincode,
          monthlyRent,
          securityDeposit,
          area,
          bedrooms,
          bathrooms,
          furnishing,
          parking,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data?.error || "Unable to save changes. Please try again."
        );
        return;
      }

      router.push("/properties/my");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]";

  if (initialLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A1F44]">
        <p className="text-white">Loading property details...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A1F44] px-4 py-12">
      <div className="mx-auto max-w-2xl rounded-lg bg-white p-8 shadow-lg">
        <button
          type="button"
          onClick={() => router.push("/properties/my")}
          className="mb-4 text-sm font-medium text-[#0A1F44] hover:underline"
        >
          ← Back to My Properties
        </button>

        <h1 className="text-2xl font-bold text-[#0A1F44]">
          Edit Property
        </h1>

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}

            {error.toLowerCase().includes("log in") && (
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="ml-2 font-semibold underline"
              >
                Go to Login
              </button>
            )}
          </div>
        )}

        {!error && (
          <form
            onSubmit={handleSubmit}
            className="mt-6 flex flex-col gap-4"
          >
            <div>
              <label className="text-sm font-medium text-zinc-700">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-700">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={3}
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-700">
                Property Type
              </label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className={inputClass}
              >
                <option value="APARTMENT">Apartment</option>
                <option value="INDEPENDENT_HOUSE">Independent House</option>
                <option value="VILLA">Villa</option>
                <option value="STUDIO">Studio</option>
                <option value="PG">PG</option>
                <option value="ONE_BHK">1 BHK</option>
                <option value="TWO_BHK">2 BHK</option>
                <option value="THREE_BHK">3 BHK</option>
                <option value="FOUR_BHK_PLUS">4 BHK and above</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-700">
                Address
              </label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-zinc-700">
                  Locality
                </label>
                <input
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-700">
                  City
                </label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-700">
                  State
                </label>
                <input
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-700">
                  Pincode
                </label>
                <input
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-zinc-700">
                  Monthly Rent (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-700">
                  Security Deposit (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={securityDeposit}
                  onChange={(e) => setSecurityDeposit(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-700">
                  Area (sq ft)
                </label>
                <input
                  type="number"
                  min="0"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-700">
                  Furnishing
                </label>
                <select
                  value={furnishing}
                  onChange={(e) => setFurnishing(e.target.value)}
                  className={inputClass}
                >
                  <option value="FURNISHED">Furnished</option>
                  <option value="SEMI_FURNISHED">Semi-furnished</option>
                  <option value="UNFURNISHED">Unfurnished</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-700">
                  Bedrooms
                </label>
                <input
                  type="number"
                  min="0"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-700">
                  Bathrooms
                </label>
                <input
                  type="number"
                  min="0"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="parking"
                checked={parking}
                onChange={(e) => setParking(e.target.checked)}
                className="h-4 w-4"
              />
              <label
                htmlFor="parking"
                className="text-sm font-medium text-zinc-700"
              >
                Parking available
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-[#D4AF37] px-4 py-3 font-semibold text-[#0A1F44] hover:bg-[#c19d2e] disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}