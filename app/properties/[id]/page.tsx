import VisitBookingForm from "@/app/components/VisitBookingForm";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PropertyImageGallery from "@/app/components/PropertyImageGallery";

type PropertyDetailsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PropertyDetailsPage({
  params,
}: PropertyDetailsPageProps) {
  const { id } = await params;

  const property = await prisma.property.findFirst({
    where: {
      id,
      status: "APPROVED",
    },
    include: {
      amenities: {
        include: {
          amenity: true,
        },
      },
    },
  });

  if (!property) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#0A1F44] px-4 py-10">
      <div className="mx-auto max-w-4xl rounded-xl bg-white p-6 shadow-lg sm:p-8">
        <a
          href="/properties"
          className="text-sm font-semibold text-[#0A1F44] hover:underline"
        >
          ← Back to Properties
        </a>

        <h1 className="mt-6 text-3xl font-bold text-[#0A1F44]">
          {property.title}
        </h1>

        <PropertyImageGallery
  imageUrl={property.imageUrl}
  imageUrls={property.imageUrls}
  title={property.title}
/>

        <p className="mt-2 text-zinc-600">
          {property.locality}, {property.city}, {property.state}
        </p>

        <p className="mt-6 text-2xl font-bold text-[#0A1F44]">
          ₹{Number(property.monthlyRent).toLocaleString("en-IN")}
          <span className="text-base font-normal text-zinc-500">
            /month
          </span>
        </p>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg bg-gray-100 p-4">
            <p className="text-sm text-zinc-500">Bedrooms</p>
            <p className="mt-1 font-semibold">{property.bedrooms}</p>
          </div>

          <div className="rounded-lg bg-gray-100 p-4">
            <p className="text-sm text-zinc-500">Bathrooms</p>
            <p className="mt-1 font-semibold">{property.bathrooms}</p>
          </div>

          <div className="rounded-lg bg-gray-100 p-4">
            <p className="text-sm text-zinc-500">Area</p>
            <p className="mt-1 font-semibold">{Number(property.area)} sq ft</p>
          </div>

          <div className="rounded-lg bg-gray-100 p-4">
            <p className="text-sm text-zinc-500">Furnishing</p>
            <p className="mt-1 font-semibold">{property.furnishing}</p>
          </div>
        </div>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-[#0A1F44]">
            Property Description
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-zinc-700">
            {property.description || "No description available."}
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-[#0A1F44]">
            Property Details
          </h2>
          <div className="mt-3 space-y-2 text-zinc-700">
            <p><strong>Property type:</strong> {property.propertyType}</p>
            <p><strong>Address:</strong> {property.address}</p>
            <p><strong>Pincode:</strong> {property.pincode}</p>
            <p>
              <strong>Security deposit:</strong> ₹
              {Number(property.securityDeposit).toLocaleString("en-IN")}
            </p>
            <p>
              <strong>Parking:</strong>{" "}
              {property.parking ? "Available" : "Not available"}
            </p>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-[#0A1F44]">
            Amenities
          </h2>

          {property.amenities.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {property.amenities.map((item: { amenity: { id: string; name: string } }) => (
                <span
                  key={item.amenity.id}
                  className="rounded-full bg-amber-100 px-4 py-2 text-sm text-zinc-800"
                >
                  {item.amenity.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-zinc-500">
              No amenities listed.
            </p>
          )}
        </section>

        <VisitBookingForm propertyId={property.id} />
        <a
          href="/properties"
          className="mt-8 inline-block rounded-md bg-[#D4AF37] px-6 py-3 font-semibold text-[#0A1F44] hover:bg-[#c19d2e]"
        >
          Browse More Properties
        </a>
      </div>
    </main>
  );
}
