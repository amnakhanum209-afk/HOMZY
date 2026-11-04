import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";

// This type lists every filter our search page will accept.
export type PropertySearchParams = {
  city?: string;
  minRent?: string;
  maxRent?: string;
  propertyType?: string;
  bedrooms?: string;
  furnishing?: string;
  sort?: string;   // "price_asc" | "price_desc" | "newest" | "area"
  page?: string;
};

const PAGE_SIZE = 12;

export async function searchProperties(params: PropertySearchParams) {
  // Only ever show properties that are ACTIVE in public search results.
  const where: Prisma.PropertyWhereInput = {
    status: "APPROVED",
  };

  if (params.city) {
    where.city = { equals: params.city, mode: "insensitive" };
  }

  if (params.minRent || params.maxRent) {
    where.monthlyRent = {
      ...(params.minRent ? { gte: Number(params.minRent) } : {}),
      ...(params.maxRent ? { lte: Number(params.maxRent) } : {}),
    };
  }

  if (params.bedrooms) {
    where.bedrooms = Number(params.bedrooms);
  }

  if (params.propertyType) {
    where.propertyType = params.propertyType as Prisma.EnumPropertyTypeFilter["equals"];
  }

  if (params.furnishing) {
    where.furnishing = params.furnishing as Prisma.EnumFurnishingTypeFilter["equals"];
  }

  let orderBy: Prisma.PropertyOrderByWithRelationInput = { createdAt: "desc" };
  if (params.sort === "price_asc") orderBy = { monthlyRent: "asc" };
  if (params.sort === "price_desc") orderBy = { monthlyRent: "desc" };
  if (params.sort === "area") orderBy = { area: "desc" };

  const page = Math.max(1, Number(params.page) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const [properties, totalCount] = await Promise.all([
    prisma.property.findMany({
      where,
      orderBy,
      skip,
      take: PAGE_SIZE,
      include: {
        amenities: { include: { amenity: true } },
      },
    }),
    prisma.property.count({ where }),
  ]);

  return {
    properties,
    totalCount,
    page,
    totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
  };
}