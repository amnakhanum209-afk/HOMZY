
import {
  searchProperties,
  PropertySearchParams,
} from "@/lib/properties";

import PropertyCard from "@/app/components/PropertyCard";
import SearchFilters from "@/app/components/SearchFilters";
import Pagination from "@/app/components/Pagination";

type SearchProperty = {
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
  amenities: {
    amenity: {
      name: string;
    };
  }[];
};

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<PropertySearchParams>;
}) {
  const params = await searchParams;

  const {
    properties: rawProperties,
    totalCount,
    page,
    totalPages,
  } = await searchProperties(params);

  const properties = rawProperties as SearchProperty[];

  return (
    <div className="min-h-screen bg-[#0A1F44] px-8 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white">
            Find your next home
          </h1>

          <p className="mt-2 text-zinc-300">
            Browse verified rental listings across India, matched to your
            budget and lifestyle.
          </p>
        </div>

        <div className="mt-8">
          <SearchFilters />
        </div>

        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-zinc-400">
            {totalCount}{" "}
            {totalCount === 1 ? "property" : "properties"} found
          </p>
        </div>

        {properties.length === 0 ? (
          <div className="mt-16 text-center text-zinc-400">
            <p className="text-lg font-medium text-white">
              No properties match your search.
            </p>

            <p className="mt-1 text-sm">
              Try widening your budget or removing a filter.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property: SearchProperty) => (
              <PropertyCard
                key={property.id}
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
                amenityNames={property.amenities.map(
                  (a: SearchProperty["amenities"][number]) =>
                    a.amenity.name
                )}
              />
            ))}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} />
      </div>
    </div>
  );
}
