"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Home, MapPin, DollarSign, Sparkles } from "lucide-react";

type Amenity = { id: string; name: string };

export default function NewPropertyPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [amenitiesList, setAmenitiesList] = useState<Amenity[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [propertyType, setPropertyType] = useState("APARTMENT");
  const [listingType, setListingType] = useState("Rent");
  const [address, setAddress] = useState("");
  const [locality, setLocality] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("India");
  const [pincode, setPincode] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [area, setArea] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [furnishing, setFurnishing] = useState("UNFURNISHED");
  const [parking, setParking] = useState(false);
  const [floor, setFloor] = useState("");
  const [totalFloors, setTotalFloors] = useState("");
  const [availableDate, setAvailableDate] = useState("");

  const inputClass =
    "mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-zinc-900 transition focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37]";
  const labelClass = "text-sm font-medium text-zinc-700";

  useEffect(() => {
    async function loadAmenities() {
      const response = await fetch("/api/amenities");
      const data = await response.json();
      setAmenitiesList(data);
    }
    loadAmenities();
  }, []);

  function toggleAmenity(id: string) {
    setSelectedAmenities((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, description, propertyType, listingType, address, locality,
          city, state, country, pincode, monthlyRent, securityDeposit,
          area, bedrooms, bathrooms, furnishing, parking,
          floor, totalFloors, availableDate,
          amenityIds: selectedAmenities,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }
      router.push("/properties/my");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A1F44] px-4 py-12">
      <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="bg-gradient-to-r from-[#0A1F44] to-[#8a6d1f] px-8 py-10">
          <h1 className="text-3xl font-bold text-white">List a Property</h1>
          <p className="mt-1 text-sm text-zinc-200">Fill in the details below to list your property on Homzy.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-10 px-8 py-8">
          <div>
            <div className="flex items-center gap-2">
              <Home size={18} className="text-[#D4AF37]" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[#0A1F44]">Basic Details</h2>
            </div>
            <div className="mt-4 flex flex-col gap-4">
              <div>
                <label className={labelClass}>Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={3} className={inputClass} />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className={labelClass}>Property Type</label>
                  <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className={inputClass}>
                    <option value="APARTMENT">Apartment</option>
                    <option value="INDEPENDENT_HOUSE">Independent House</option>
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
                <div className="flex-1">
                  <label className={labelClass}>Furnishing</label>
                  <select value={furnishing} onChange={(e) => setFurnishing(e.target.value)} className={inputClass}>
                    <option value="FURNISHED">Furnished</option>
                    <option value="SEMI_FURNISHED">Semi-Furnished</option>
                    <option value="UNFURNISHED">Unfurnished</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-[#D4AF37]" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[#0A1F44]">Location</h2>
            </div>
            <div className="mt-4 flex flex-col gap-4">
              <div>
                <label className={labelClass}>Address</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} required className={inputClass} />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className={labelClass}>Locality</label>
                  <input type="text" value={locality} onChange={(e) => setLocality(e.target.value)} required className={inputClass} />
                </div>
                <div className="flex-1">
                  <label className={labelClass}>City</label>
                  <input type="text" value={city} onChange={(e) => setCity(e.target.value)} required className={inputClass} />
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className={labelClass}>State</label>
                  <input type="text" value={state} onChange={(e) => setState(e.target.value)} required className={inputClass} />
                </div>
                <div className="flex-1">
                  <label className={labelClass}>Pincode</label>
                  <input type="text" value={pincode} onChange={(e) => setPincode(e.target.value)} required className={inputClass} />
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <DollarSign size={18} className="text-[#D4AF37]" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[#0A1F44]">Pricing and Size</h2>
            </div>
            <div className="mt-4 flex flex-col gap-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className={labelClass}>Monthly Rent</label>
                  <input type="number" min={0} value={monthlyRent} onChange={(e) => setMonthlyRent(e.target.value)} required className={inputClass} />
                </div>
                <div className="flex-1">
                  <label className={labelClass}>Security Deposit</label>
                  <input type="number" min={0} value={securityDeposit} onChange={(e) => setSecurityDeposit(e.target.value)} required className={inputClass} />
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className={labelClass}>Area (sq ft)</label>
                  <input type="number" min={0} value={area} onChange={(e) => setArea(e.target.value)} required className={inputClass} />
                </div>
                <div className="flex-1">
                  <label className={labelClass}>Bedrooms</label>
                  <input type="number" min={0} value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} required className={inputClass} />
                </div>
                <div className="flex-1">
                  <label className={labelClass}>Bathrooms</label>
                  <input type="number" min={0} value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} required className={inputClass} />
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className={labelClass}>Floor</label>
                  <input type="number" min={0} value={floor} onChange={(e) => setFloor(e.target.value)} className={inputClass} />
                </div>
                <div className="flex-1">
                  <label className={labelClass}>Total Floors</label>
                  <input type="number" min={0} value={totalFloors} onChange={(e) => setTotalFloors(e.target.value)} className={inputClass} />
                </div>
                <div className="flex-1">
                  <label className={labelClass}>Available From</label>
                  <input type="date" value={availableDate} onChange={(e) => setAvailableDate(e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-[#D4AF37]" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[#0A1F44]">Amenities</h2>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-3">
              <input type="checkbox" id="parking" checked={parking} onChange={(e) => setParking(e.target.checked)} className="h-4 w-4 accent-[#D4AF37]" />
              <label htmlFor="parking" className="text-sm font-medium text-zinc-700">Parking available</label>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {amenitiesList.map((amenity) => (
                <label
                  key={amenity.id}
                  className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700"
                >
                  <input
                    type="checkbox"
                    checked={selectedAmenities.includes(amenity.id)}
                    onChange={() => toggleAmenity(amenity.id)}
                    className="h-4 w-4 accent-[#D4AF37]"
                  />
                  {amenity.name}
                </label>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#c19d2e] px-4 py-3.5 font-semibold text-[#0A1F44] shadow-md transition hover:shadow-lg disabled:opacity-60"
          >
            {loading ? "Listing property..." : "List Property"}
          </button>
        </form>
      </div>
    </div>
  );
}