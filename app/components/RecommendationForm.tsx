
"use client";

import { useEffect, useState, FormEvent } from "react";
import PropertyCard from "@/app/components/PropertyCard";

type AmenityOption = {
  id: string;
  name: string;
};

type RecommendationItem = {
  id: string;
  imageUrl: string | null;
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
  disadvantages: string[];
};

type RecommendationResponse = {
  success?: boolean;
  message?: string;
  total?: number;
  recommendations?: RecommendationItem[];
  error?: string;
};

const inputClass =
  "w-full rounded-lg border border-[#D8D0C1] bg-white px-4 py-3 text-[#17233F] outline-none transition placeholder:text-gray-400 focus:border-[#B18A42] focus:ring-2 focus:ring-[#B18A42]/20";

const labelClass =
  "mb-2 block text-sm font-semibold text-[#17233F]";

export default function RecommendationForm() {
  // Location preferences
  const [city, setCity] = useState("");
  const [locality, setLocality] = useState("");

  // Budget preferences
  const [minRent, setMinRent] = useState("");
  const [maxRent, setMaxRent] = useState("");

  // Property preferences
  const [bedrooms, setBedrooms] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [furnishing, setFurnishing] = useState("");
  const [parking, setParking] = useState("");

  // Lifestyle and travel preferences
  const [workplace, setWorkplace] = useState("");
  const [college, setCollege] = useState("");
  const [preferredDestination, setPreferredDestination] =
    useState("");
  const [maxTravelTime, setMaxTravelTime] = useState("");
  const [otherPreferences, setOtherPreferences] = useState("");

  // Amenities
  const [amenities, setAmenities] = useState<string[]>([]);
  const [availableAmenities, setAvailableAmenities] = useState<
    AmenityOption[]
  >([]);

  // Recommendation results
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

    // Validate rent
    if (
      minRent !== "" &&
      maxRent !== "" &&
      Number(minRent) > Number(maxRent)
    ) {
      setError(
        "Minimum rent cannot be greater than maximum rent."
      );
      return;
    }

    // Validate travel time
    if (
      maxTravelTime !== "" &&
      (
        !Number.isInteger(Number(maxTravelTime)) ||
        Number(maxTravelTime) < 1 ||
        Number(maxTravelTime) > 600
      )
    ) {
      setError(
        "Maximum travel time must be between 1 and 600 minutes."
      );
      return;
    }

    // Check that at least one preference is provided
    const hasPreferences =
      city.trim() !== "" ||
      locality.trim() !== "" ||
      minRent !== "" ||
      maxRent !== "" ||
      bedrooms !== "" ||
      propertyType !== "" ||
      furnishing !== "" ||
      parking !== "" ||
      amenities.length > 0 ||
      workplace.trim() !== "" ||
      college.trim() !== "" ||
      preferredDestination.trim() !== "" ||
      maxTravelTime !== "" ||
      otherPreferences.trim() !== "";

    if (!hasPreferences) {
      setError(
        "Please select or enter at least one preference."
      );
      return;
    }

    // Validate text lengths
    if (
      workplace.length > 200 ||
      college.length > 200 ||
      preferredDestination.length > 200 ||
      otherPreferences.length > 200
    ) {
      setError(
        "Workplace, college, destination and other preferences must not exceed 200 characters."
      );
      return;
    }

    // Prepare preferences for the API
    const preferences = {
      city: city.trim(),
      locality: locality.trim(),

      minRent:
        minRent === "" ? undefined : Number(minRent),

      maxRent:
        maxRent === "" ? undefined : Number(maxRent),

      bedrooms:
        bedrooms === "" ? undefined : Number(bedrooms),

      propertyType: propertyType || undefined,
      furnishing: furnishing || undefined,

      parking:
        parking === ""
          ? undefined
          : parking === "true",

      amenities,

      workplace: workplace.trim() || undefined,
      college: college.trim() || undefined,

      preferredDestination:
        preferredDestination.trim() || undefined,

      maxTravelTime:
        maxTravelTime === ""
          ? undefined
          : Number(maxTravelTime),

      otherPreferences:
        otherPreferences.trim() || undefined,
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

      const data: RecommendationResponse =
        await response.json();

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

      {/* HOMZY BANNER */}
      <section className="mb-8 overflow-hidden rounded-2xl bg-[#17233F] px-6 py-12 text-center shadow-xl md:px-12 md:py-16">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.3em] text-[#D5B46A]">
          HOMZY SMART SEARCH
        </p>

        <h1 className="text-3xl font-bold text-white md:text-5xl">
          Find Your Perfect Home
        </h1>

        <div className="mx-auto mt-5 h-1 w-20 rounded-full bg-[#B18A42]" />

        <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#E5E9F1] md:text-base">
          Your dream home is just a search away. Tell us your
          preferences and let HOMZY discover homes that match
          your lifestyle.
        </p>

        <p className="mt-6 text-xs font-semibold tracking-widest text-[#D5B46A]">
          SMART SEARCH | BETTER MATCHES | HAPPY HOMES
        </p>
      </section>

      {/* PREFERENCE FORM */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-[#E5DDCE] bg-white p-5 shadow-[0_8px_30px_rgba(23,35,63,0.08)] md:p-8"
      >
        <div className="mb-7 flex items-center gap-3 border-b border-[#EAE4D9] pb-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#17233F] text-2xl text-[#D5B46A]">
            🏠
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#17233F]">
              Your Home Preferences
            </h2>

            <p className="mt-1 text-sm text-[#7A8497]">
              Choose the details that matter to you.
            </p>
          </div>
        </div>

        {/* LOCATION AND BUDGET */}
        <h3 className="mb-4 text-base font-bold text-[#17233F]">
          Location and Budget
        </h3>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

          <div>
            <label className={labelClass}>
              Preferred City
            </label>

            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Example: Bengaluru"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              Preferred Locality
            </label>

            <input
              type="text"
              value={locality}
              onChange={(e) => setLocality(e.target.value)}
              placeholder="Example: BTM Layout"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              Minimum Monthly Rent (₹)
            </label>

            <input
              type="number"
              min="0"
              step="1"
              value={minRent}
              onChange={(e) => setMinRent(e.target.value)}
              placeholder="Example: 5000"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              Maximum Monthly Rent (₹)
            </label>

            <input
              type="number"
              min="0"
              step="1"
              value={maxRent}
              onChange={(e) => setMaxRent(e.target.value)}
              placeholder="Example: 20000"
              className={inputClass}
            />
          </div>
        </div>

        {/* PROPERTY PREFERENCES */}
        <div className="mt-8 border-t border-[#EAE4D9] pt-7">
          <h3 className="mb-4 text-base font-bold text-[#17233F]">
            Property Preferences
          </h3>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            <div>
              <label className={labelClass}>
                Property Type
              </label>

              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className={inputClass}
              >
                <option value="">Any property type</option>
                <option value="APARTMENT">Apartment</option>
                <option value="INDEPENDENT_HOUSE">
                  Independent House
                </option>
                <option value="VILLA">Villa</option>
                <option value="STUDIO">Studio</option>
                <option value="PG">PG</option>
                <option value="ONE_BHK">1 BHK</option>
                <option value="TWO_BHK">2 BHK</option>
                <option value="THREE_BHK">3 BHK</option>
                <option value="FOUR_BHK_PLUS">4+ BHK</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>
                Bedrooms (BHK)
              </label>

              <select
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                className={inputClass}
              >
                <option value="">Any BHK</option>
                <option value="1">1 BHK</option>
                <option value="2">2 BHK</option>
                <option value="3">3 BHK</option>
                <option value="4">4+ BHK</option>
              </select>

              <p className="mt-1 text-xs text-[#7A8497]">
                Selecting 4 BHK includes properties with 4 or
                more bedrooms.
              </p>
            </div>

            <div>
              <label className={labelClass}>
                Furnishing
              </label>

              <select
                value={furnishing}
                onChange={(e) => setFurnishing(e.target.value)}
                className={inputClass}
              >
                <option value="">Any furnishing</option>
                <option value="FURNISHED">
                  Fully Furnished
                </option>
                <option value="SEMI_FURNISHED">
                  Semi Furnished
                </option>
                <option value="UNFURNISHED">
                  Unfurnished
                </option>
              </select>
            </div>

            <div>
              <label className={labelClass}>
                Parking
              </label>

              <select
                value={parking}
                onChange={(e) => setParking(e.target.value)}
                className={inputClass}
              >
                <option value="">No preference</option>
                <option value="true">Parking required</option>
                <option value="false">
                  Parking not required
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* WORKPLACE AND COLLEGE */}
        <div className="mt-8 border-t border-[#EAE4D9] pt-7">
          <h3 className="mb-2 text-base font-bold text-[#17233F]">
            Work, College and Daily Travel
          </h3>

          <p className="mb-5 text-sm text-[#7A8497]">
            Tell HOMZY about the places you regularly travel to.
          </p>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            <div>
              <label className={labelClass}>
                Workplace
              </label>

              <input
                type="text"
                value={workplace}
                onChange={(e) => setWorkplace(e.target.value)}
                placeholder="Example: Electronic City"
                maxLength={200}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                College or University
              </label>

              <input
                type="text"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                placeholder="Example: Your college name"
                maxLength={200}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                Preferred Destination
              </label>

              <input
                type="text"
                value={preferredDestination}
                onChange={(e) =>
                  setPreferredDestination(e.target.value)
                }
                placeholder="Example: Metro station or market"
                maxLength={200}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                Maximum Travel Time (Minutes)
              </label>

              <input
                type="number"
                min="1"
                max="600"
                step="1"
                value={maxTravelTime}
                onChange={(e) =>
                  setMaxTravelTime(e.target.value)
                }
                placeholder="Example: 30"
                className={inputClass}
              />

              <p className="mt-1 text-xs text-[#7A8497]">
                Travel times are not verified yet. HOMZY will
                identify when route information is unavailable.
              </p>
            </div>
          </div>
        </div>

        {/* AMENITIES */}
        <div className="mt-8 border-t border-[#EAE4D9] pt-7">
          <h3 className="mb-4 text-base font-bold text-[#17233F]">
            Preferred Amenities
          </h3>

          {loadingAmenities ? (
            <p className="text-sm text-[#7A8497]">
              Loading amenities...
            </p>
          ) : availableAmenities.length === 0 ? (
            <p className="text-sm text-[#7A8497]">
              No amenities are currently available.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {availableAmenities.map((amenity) => (
                <label
                  key={amenity.id}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm transition ${
                    amenities.includes(amenity.name)
                      ? "border-[#B18A42] bg-[#F5F0E6] font-semibold text-[#17233F]"
                      : "border-[#E5DDCE] text-[#4D5870] hover:border-[#B18A42]"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={amenities.includes(amenity.name)}
                    onChange={() =>
                      toggleAmenity(amenity.name)
                    }
                    className="h-4 w-4 accent-[#B18A42]"
                  />

                  {amenity.name}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* OTHER PREFERENCES */}
        <div className="mt-8 border-t border-[#EAE4D9] pt-7">
          <h3 className="mb-4 text-base font-bold text-[#17233F]">
            Additional Preferences
          </h3>

          <label className={labelClass}>
            Anything Else You Would Like in Your Home?
          </label>

          <textarea
            value={otherPreferences}
            onChange={(e) =>
              setOtherPreferences(e.target.value)
            }
            placeholder="Example: Near public transport, family-friendly neighbourhood, balcony, good ventilation..."
            maxLength={200}
            rows={4}
            className={inputClass}
          />

          <p className="mt-1 text-xs text-[#7A8497]">
            Maximum 200 characters.
          </p>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* SEARCH BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className="mt-8 w-full rounded-lg bg-[#17233F] px-6 py-4 font-bold text-white shadow-md transition hover:bg-[#26395E] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Finding Your Perfect Home..."
            : "Find My Recommended Homes"}
        </button>
      </form>

      {/* RECOMMENDATION RESULTS */}
      {searched && (
        <section className="mt-10">

          <div className="mb-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#B18A42]">
              PERSONALIZED FOR YOU
            </p>

            <h2 className="text-2xl font-bold text-[#17233F]">
              Your Recommended Properties
            </h2>

            <p className="mt-2 text-sm text-[#657087]">
              We found {recommendations.length} recommended
              properties based on your preferences.
            </p>
          </div>

          {recommendations.length === 0 ? (
            <div className="rounded-xl border border-[#E5DDCE] bg-[#F5F0E6] p-8 text-center">
              <h3 className="text-lg font-bold text-[#17233F]">
                No properties found
              </h3>

              <p className="mt-2 text-sm text-[#657087]">
                Try changing your preferences or searching
                another city.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {recommendations.map((property) => (
                <div
                  key={property.id}
                  className="overflow-hidden rounded-xl border border-[#E5DDCE] bg-white shadow-[0_5px_20px_rgba(23,35,63,0.06)]"
                >
                  {/* MATCH HEADER */}
                  <div className="flex items-center justify-between bg-[#17233F] px-4 py-3">
                    <span className="text-sm font-bold tracking-wide text-[#D5B46A]">
                      HOMZY MATCH
                    </span>

                    <span className="rounded-full bg-[#B18A42] px-3 py-1 text-sm font-bold text-white">
                      {property.matchPercentage}% Match
                    </span>
                  </div>

                  {/* PROPERTY CARD */}
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

                  {/* REASONS */}
                  <div className="border-t border-[#EAE4D9] px-4 py-4">
                    <h3 className="mb-3 text-sm font-bold text-[#17233F]">
                      Why We Recommend This Home
                    </h3>

                    {property.reasons.length === 0 ? (
                      <p className="text-sm text-[#657087]">
                        No specific matching reasons are available.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {property.reasons.map((reason, index) => (
                          <li
                            key={index}
                            className="flex gap-2 text-sm text-[#657087]"
                          >
                            <span className="font-bold text-green-600">
                              ✓
                            </span>

                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* DISADVANTAGES */}
                  <div className="border-t border-[#EAE4D9] bg-[#FAF8F3] px-4 py-4">
                    <h3 className="mb-3 text-sm font-bold text-[#17233F]">
                      Things to Consider
                    </h3>

                    {property.disadvantages.length === 0 ? (
                      <p className="text-sm text-[#657087]">
                        No specific disadvantages were identified
                        from the available property information.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {property.disadvantages.map(
                          (disadvantage, index) => (
                            <li
                              key={index}
                              className="flex gap-2 text-sm text-[#657087]"
                            >
                              <span className="font-bold text-[#B18A42]">
                                !
                              </span>

                              <span>{disadvantage}</span>
                            </li>
                          )
                        )}
                      </ul>
                    )}
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
