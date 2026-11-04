"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, FormEvent } from "react";

export default function SearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [city, setCity] = useState(searchParams.get("city") || "");
  const [minRent, setMinRent] = useState(searchParams.get("minRent") || "");
  const [maxRent, setMaxRent] = useState(searchParams.get("maxRent") || "");
  const [bedrooms, setBedrooms] = useState(searchParams.get("bedrooms") || "");
  const [propertyType, setPropertyType] = useState(searchParams.get("propertyType") || "");
  const [furnishing, setFurnishing] = useState(searchParams.get("furnishing") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (minRent) params.set("minRent", minRent);
    if (maxRent) params.set("maxRent", maxRent);
    if (bedrooms) params.set("bedrooms", bedrooms);
    if (propertyType) params.set("propertyType", propertyType);
    if (furnishing) params.set("furnishing", furnishing);
    if (sort) params.set("sort", sort);
    params.set("page", "1");

    router.push(`/properties?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-2 gap-3 rounded-lg border border-[#1E3A6D] bg-[#0f2a5c] p-4 md:grid-cols-4"
    >
      <div>
        <label htmlFor="city" className="text-xs font-medium text-zinc-300">City</label>
        <input
          id="city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="e.g. Bangalore"
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
        />
      </div>

      <div>
        <label htmlFor="minRent" className="text-xs font-medium text-zinc-300">Min Rent</label>
        <input
          id="minRent"
          type="number"
          min={0}
          value={minRent}
          onChange={(e) => setMinRent(e.target.value)}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
        />
      </div>

      <div>
        <label htmlFor="maxRent" className="text-xs font-medium text-zinc-300">Max Rent</label>
        <input
          id="maxRent"
          type="number"
          min={0}
          value={maxRent}
          onChange={(e) => setMaxRent(e.target.value)}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
        />
      </div>

      <div>
        <label htmlFor="bedrooms" className="text-xs font-medium text-zinc-300">Bedrooms</label>
        <select
          id="bedrooms"
          value={bedrooms}
          onChange={(e) => setBedrooms(e.target.value)}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
        >
          <option value="">Any</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4+</option>
        </select>
      </div>

      <div>
        <label htmlFor="propertyType" className="text-xs font-medium text-zinc-300">Type</label>
        <select
          id="propertyType"
          value={propertyType}
          onChange={(e) => setPropertyType(e.target.value)}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
        >
          <option value="">Any</option>
          <option value="APARTMENT">Apartment</option>
          <option value="INDEPENDENT_HOUSE">Independent House</option>
          <option value="VILLA">Villa</option>
          <option value="STUDIO">Studio</option>
          <option value="PG">PG</option>
        </select>
      </div>

      <div>
        <label htmlFor="furnishing" className="text-xs font-medium text-zinc-300">Furnishing</label>
        <select
          id="furnishing"
          value={furnishing}
          onChange={(e) => setFurnishing(e.target.value)}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
        >
          <option value="">Any</option>
          <option value="FURNISHED">Furnished</option>
          <option value="SEMI_FURNISHED">Semi-Furnished</option>
          <option value="UNFURNISHED">Unfurnished</option>
        </select>
      </div>

      <div>
        <label htmlFor="sort" className="text-xs font-medium text-zinc-300">Sort by</label>
        <select
          id="sort"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="area">Largest Area</option>
        </select>
      </div>

      <div className="flex items-end">
        <button
          type="submit"
          className="w-full rounded-md bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-[#0A1F44] hover:bg-[#c19d2e]"
        >
          Search
        </button>
      </div>
    </form>
  );
}