import Link from "next/link";

type PropertyCardProps = {
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
};

export default function PropertyCard({
  id,
  imageUrl,
  title,
  city,
  locality,
  monthlyRent,
  area,
  bedrooms,
  bathrooms,
  furnishing,
  amenityNames,
}: PropertyCardProps) {
  return (
    <div className="rounded-lg border border-[#1E3A6D] bg-white overflow-hidden shadow-sm transition hover:shadow-md">
      <div className="h-48 w-full overflow-hidden bg-zinc-200">
  {imageUrl ? (
    <img
      src={imageUrl}
      alt={title}
      className="h-full w-full object-cover"
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center text-sm text-zinc-500">
      No image available
    </div>
  )}
</div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-zinc-900 truncate">{title}</h3>
        <p className="text-sm text-zinc-500">{locality}, {city}</p>

        <p className="mt-2 text-lg font-bold text-[#0A1F44]">
          ₹{monthlyRent.toLocaleString()}/month
        </p>

        <p className="mt-1 text-sm text-zinc-600">
          {bedrooms} Beds · {bathrooms} Baths · {area} sq ft · {furnishing}
        </p>

        {amenityNames.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {amenityNames.slice(0, 3).map((name) => (
              <span
                key={name}
                className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700"
              >
                {name}
              </span>
            ))}
          </div>
        )}

        <Link
          href={`/properties/${id}`}
          className="mt-4 block rounded-md bg-[#D4AF37] px-4 py-2 text-center text-sm font-semibold text-[#0A1F44] hover:bg-[#c19d2e]"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}