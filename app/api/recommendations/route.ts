import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";
import { calculatePropertyMatch } from "@/lib/recommendations";
import type {
  RecommendationPreferences,
  RecommendationProperty,
} from "@/lib/recommendations";

export async function POST(request: Request) {
  try {
    // 1. Verify login
    const session = await verifySession();

    if (!session) {
      return NextResponse.json(
        { error: "Please log in to get recommendations." },
        { status: 401 }
      );
    }

    // 2. Only tenants can access recommendations
    if (session.role !== "TENANT" || session.isOwner) {
      return NextResponse.json(
        { error: "Only tenants can access recommendations." },
        { status: 403 }
      );
    }

    // 3. Validate request body
    const body: unknown = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid preferences." },
        { status: 400 }
      );
    }

    const input = body as Record<string, unknown>;

    // 4. Read city and locality
    if (
      (input.city !== undefined && typeof input.city !== "string") ||
      (input.locality !== undefined &&
        typeof input.locality !== "string")
    ) {
      return NextResponse.json(
        { error: "City and locality must be text." },
        { status: 400 }
      );
    }

    const city =
      typeof input.city === "string" ? input.city.trim() : "";

    const locality =
      typeof input.locality === "string"
        ? input.locality.trim()
        : "";

    // 5. Read numeric preferences
    function readNumber(value: unknown): number | undefined {
      if (value === undefined || value === null || value === "") {
        return undefined;
      }

      const number = Number(value);
      return Number.isFinite(number) ? number : NaN;
    }

    const minRent = readNumber(input.minRent);
    const maxRent = readNumber(input.maxRent);
    const bedrooms = readNumber(input.bedrooms);

    if (
      [minRent, maxRent, bedrooms].some(
        (value) => value !== undefined && !Number.isFinite(value)
      )
    ) {
      return NextResponse.json(
        { error: "Please enter valid numeric preferences." },
        { status: 400 }
      );
    }

    if (
      (minRent !== undefined && minRent < 0) ||
      (maxRent !== undefined && maxRent < 0) ||
      (bedrooms !== undefined &&
        (!Number.isInteger(bedrooms) ||
          bedrooms < 1 ||
          bedrooms > 10))
    ) {
      return NextResponse.json(
        { error: "Budget and bedroom values are invalid." },
        { status: 400 }
      );
    }

    if (
      minRent !== undefined &&
      maxRent !== undefined &&
      minRent > maxRent
    ) {
      return NextResponse.json(
        { error: "Minimum rent cannot exceed maximum rent." },
        { status: 400 }
      );
    }

    // 6. Validate furnishing
    const validFurnishing = [
      "FURNISHED",
      "SEMI_FURNISHED",
      "UNFURNISHED",
    ];

    if (
      input.furnishing !== undefined &&
      input.furnishing !== "" &&
      (typeof input.furnishing !== "string" ||
        !validFurnishing.includes(input.furnishing))
    ) {
      return NextResponse.json(
        { error: "Invalid furnishing preference." },
        { status: 400 }
      );
    }

    const furnishing =
      typeof input.furnishing === "string" &&
      input.furnishing !== ""
        ? input.furnishing
        : undefined;

    // 7. Validate amenities
    if (
      input.amenities !== undefined &&
      (!Array.isArray(input.amenities) ||
        input.amenities.length > 20 ||
        !input.amenities.every(
          (item) =>
            typeof item === "string" &&
            item.trim().length > 0
        ))
    ) {
      return NextResponse.json(
        { error: "Invalid amenities selection." },
        { status: 400 }
      );
    }

    const amenities: string[] = Array.isArray(input.amenities)
      ? input.amenities.map((item) => String(item).trim())
      : [];

    // 8. Validate parking
    if (
      input.parking !== undefined &&
      input.parking !== null &&
      typeof input.parking !== "boolean"
    ) {
      return NextResponse.json(
        { error: "Invalid parking preference." },
        { status: 400 }
      );
    }

    const parking =
      typeof input.parking === "boolean"
        ? input.parking
        : undefined;

    // 9. Prepare preferences
    const preferences: RecommendationPreferences = {
      city,
      locality,
      minRent,
      maxRent,
      bedrooms,
      furnishing,
      amenities,
      parking,
    };

    const hasPreferences =
      Boolean(city) ||
      Boolean(locality) ||
      minRent !== undefined ||
      maxRent !== undefined ||
      bedrooms !== undefined ||
      Boolean(furnishing) ||
      amenities.length > 0 ||
      parking !== undefined;

    if (!hasPreferences) {
      return NextResponse.json(
        { error: "Please enter at least one preference." },
        { status: 400 }
      );
    }

    // 10. Fetch approved properties
    const properties = await prisma.property.findMany({
      where: {
        status: "APPROVED",
        ...(city
          ? {
              city: {
                equals: city,
                mode: "insensitive",
              },
            }
          : {}),
      },
      select: {
        id: true,
        imageUrl: true,
        title: true,
        city: true,
        locality: true,
        monthlyRent: true,
        area: true,
        bedrooms: true,
        bathrooms: true,
        furnishing: true,
        parking: true,
        amenities: {
          select: {
            amenity: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 200,
    });

    // 11. Calculate recommendation scores
    const recommendations = properties
      .map((property: RecommendationProperty) => {
        const match = calculatePropertyMatch(
          property,
          preferences
        );

        return {
          ...property,
          amenityNames: property.amenities.map(
            (item: { amenity: { name: string } }) =>
              item.amenity.name
          ),
          matchPercentage: match.matchPercentage,
          reasons: match.reasons,
        };
      })
      .sort(
        (
          a: { matchPercentage: number },
          b: { matchPercentage: number }
        ) => b.matchPercentage - a.matchPercentage
      );

    // 12. Send recommendations
    return NextResponse.json({
      message: "Recommendations generated successfully.",
      total: recommendations.length,
      recommendations,
    });
  } catch (error) {
    console.error("Recommendation API error:", error);

    return NextResponse.json(
      {
        error:
          "Unable to generate recommendations. Please try again.",
      },
      { status: 500 }
    );
  }
}