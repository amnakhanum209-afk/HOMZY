"use client";

import { useEffect, useState, FormEvent } from "react";
import PropertyCard from "@/app/components/PropertyCard";

type AmenityOption = {
  id: string;
  name: string;
};

type RecommendationItem = {
  id: string;
  imageUrl: string;
  title: string;
  city: string;
  locality: string;
  monthlyRent: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  furnishing: string;
  amenityNames: string[];
  matchPercentage: number;
  reasons: string[];
};

type RecommendationResponse = {
  message?: string;
  total?: number;
  recommendations?: RecommendationItem[];
  error?: string;
};

export default function RecommendationForm() {
  const [city, setCity] = useState("");
  const [locality, setLocality] = useState("");
  const [minRent, setMinRent] = useState("");
  const [maxRent, setMaxRent] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [furnishing, setFurnishing] = useState("");
  const [parking, setParking] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);

  const [availableAmenities, setAvailableAmenities] = useState<
    AmenityOption[]
  >([]);

  const [recommendations, setRecommendations] = useState<
    RecommendationItem[]
  >([]);

  const [loading, setLoading] = useState(false);
  const [loadingAmenities, setLoadingAmenities] = useState(true);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  // Load available amenities
  useEffect(() => {
    async function loadAmenities() {
      try {
        const response = await fetch("/api/amenities");
        const data: AmenityOption[] = await response.json();

        if (response.ok && Array.isArray(data)) {
          setAvailableAmenities(data);
        }
      } catch {
        console.error("Unable to load amenities.");
      } finally {
        setLoadingAmenities(false);
      }
    }

    loadAmenities();
  }, []);

  // Select or unselect an amenity
  function toggleAmenity(name: string) {
    setAmenities((current) =>
      current.includes(name)
        ? current.filter((item) => item !== name)
        : [...current, name]
    );
  }

  // Submit preferences
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setRecommendations([]);
    setSearched(false);

    if (
      minRent !== "" &&
      maxRent !== "" &&
      Number(minRent) > Number(maxRent)
    ) {
      setError("Minimum rent cannot be greater than maximum rent.");
      return;
    }

    const hasPreferences =
      city.trim() !== "" ||
      locality.trim() !== "" ||
      minRent !== "" ||
      maxRent !== "" ||
      bedrooms !== "" ||
      furnishing !== "" ||
      parking !== "" ||
      amenities.length > 0;

    if (!hasPreferences) {
      setError("Please select or enter at least one preference.");
      return;
    }

    const preferences = {
      city: city.trim(),
      locality: locality.trim(),
      minRent: minRent === "" ? undefined : Number(minRent),
      maxRent: maxRent === "" ? undefined : Number(maxRent),
      bedrooms: bedrooms === "" ? undefined : Number(bedrooms),
      furnishing,
      parking:
        parking === ""
          ? undefined
          : parking === "true",
      amenities,
    };

    try {
      setLoading(true);

      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferences),
      });

      const data: RecommendationResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to generate recommendations."
        );
      }

      setRecommendations(data.recommendations || []);
      setSearched(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mb-8 text-center">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-orange-600">
          HOMZY SMART SEARCH
        </p>

        <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">
          Find Your Perfect Home
        </h1>

        <p className="mt-3 text-gray-600">
          Tell us what you are looking for. HOMZY will find properties
          that best match your preferences.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-8"
      >
        <h2 className="mb-6 text-xl font-semibold text-gray-900">
          Your Home Preferences
        </h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* City */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Preferred City
            </label>

            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Example: Bengaluru"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-orange-500"
            />
          </div>

          {/* Locality */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Preferred Locality
            </label>

            <input
              type="text"
              value={locality}
              onChange={(e) => setLocality(e.target.value)}
              placeholder="Example: BTM Layout"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-orange-500"
            />
          </div>

          {/* Minimum rent */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Minimum Monthly Rent (₹)
            </label>

            <input
              type="number"
              min="0"
              value={minRent}
              onChange={(e) => setMinRent(e.target.value)}
              placeholder="Example: 5000"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-orange-500"
            />
          </div>

          {/* Maximum rent */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Maximum Monthly Rent (₹)
            </label>

            <input
              type="number"
              min="0"
              value={maxRent}
              onChange={(e) => setMaxRent(e.target.value)}
              placeholder="Example: 20000"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-orange-500"
            />
          </div>

          {/* Bedrooms */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Bedrooms (BHK)
            </label>

            <select
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-orange-500"
            >
              <option value="">Any BHK</option>
              <option value="1">1 BHK</option>
              <option value="2">2 BHK</option>
              <option value="3">3 BHK</option>
              <option value="4">4+ BHK</option>
            </select>
          </div>

          {/* Furnishing */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Furnishing
            </label>

            <select
              value={furnishing}
              onChange={(e) => setFurnishing(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-orange-500"
            >
              <option value="">Any furnishing</option>
              <option value="FURNISHED">Fully Furnished</option>
              <option value="SEMI_FURNISHED">Semi Furnished</option>
              <option value="UNFURNISHED">Unfurnished</option>
            </select>
          </div>

          {/* Parking */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Parking
            </label>

            <select
              value={parking}
              onChange={(e) => setParking(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-orange-500"
            >
              <option value="">No preference</option>
              <option value="true">Parking required</option>
              <option value="false">Parking not required</option>
            </select>
          </div>
        </div>

        {/* Amenities */}
        <div className="mt-7">
          <h3 className="mb-3 text-sm font-semibold text-gray-800">
            Preferred Amenities
          </h3>

          {loadingAmenities ? (
            <p className="text-sm text-gray-500">
              Loading amenities...
            </p>
          ) : availableAmenities.length === 0 ? (
            <p className="text-sm text-gray-500">
              No amenities are currently available.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {availableAmenities.map((amenity) => (
                <label
                  key={amenity.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 p-3 text-sm text-gray-700 hover:border-orange-400"
                >
                  <input
                    type="checkbox"
                    checked={amenities.includes(amenity.name)}
                    onChange={() => toggleAmenity(amenity.name)}
                    className="h-4 w-4 accent-orange-600"
                  />

                  {amenity.name}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="mt-8 w-full rounded-lg bg-orange-600 px-6 py-3.5 font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Finding Your Perfect Home..."
            : "Find My Recommended Homes"}
        </button>
      </form>

      {/* Recommendation results */}
      {searched && (
        <section className="mt-10">
          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            Your Recommended Properties
          </h2>

          <p className="mb-6 text-gray-600">
            We found {recommendations.length} matching properties
            based on your preferences.
          </p>

          {recommendations.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center">
              <h3 className="text-lg font-semibold text-gray-800">
                No properties found
              </h3>

              <p className="mt-2 text-sm text-gray-600">
                Try changing your preferences or searching another city.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {recommendations.map((property) => (
                <div
                  key={property.id}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                >
                  <div className="flex items-center justify-between bg-orange-50 px-4 py-3">
                    <span className="text-sm font-semibold text-orange-800">
                      HOMZY MATCH
                    </span>

                    <span className="rounded-full bg-orange-600 px-3 py-1 text-sm font-bold text-white">
                      {property.matchPercentage}% Match
                    </span>
                  </div>

                  <div className="p-3">
                    <PropertyCard
                      id={property.id}
                      imageUrl={property.imageUrl}
                      title={property.title}
                      city={property.city}
                      locality={property.locality}
                      monthlyRent={property.monthlyRent}
                      area={property.area}
                      bedrooms={property.bedrooms}
                      bathrooms={property.bathrooms}
                      furnishing={property.furnishing}
                      amenityNames={property.amenityNames}
                    />
                  </div>

                  <div className="border-t border-gray-100 px-4 py-4">
                    <h3 className="mb-2 text-sm font-semibold text-gray-800">
                      Why we recommend this home
                    </h3>

                    <ul className="space-y-2">
                      {property.reasons.map((reason, index) => (
                        <li
                          key={index}
                          className="flex gap-2 text-sm text-gray-600"
                        >
                          <span className="text-green-600">✓</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}