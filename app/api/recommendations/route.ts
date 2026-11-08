
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";

const propertySelection = {
  id: true,
  title: true,
  description: true,
  imageUrl: true,
  imageUrls: true,
  propertyType: true,
  address: true,
  locality: true,
  city: true,
  state: true,
  monthlyRent: true,
  securityDeposit: true,
  area: true,
  bedrooms: true,
  bathrooms: true,
  furnishing: true,
  parking: true,
  latitude: true,
  longitude: true,
  amenities: {
    select: {
      amenity: {
        select: {
          name: true,
        },
      },
    },
  },
} satisfies Prisma.PropertySelect;

type DatabaseProperty = Prisma.PropertyGetPayload<{
  select: typeof propertySelection;
}>;

type AIRecommendation = {
  propertyId: string;
  matchPercentage: number;
  reasons: string[];
  disadvantages: string[];
};

const validPropertyTypes = [
  "APARTMENT",
  "INDEPENDENT_HOUSE",
  "VILLA",
  "STUDIO",
  "PG",
  "ONE_BHK",
  "TWO_BHK",
  "THREE_BHK",
  "FOUR_BHK_PLUS",
  "OTHER",
];

const validFurnishingTypes = [
  "FURNISHED",
  "SEMI_FURNISHED",
  "UNFURNISHED",
];

function readText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;

  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : undefined;
}

function readInteger(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (
    typeof value !== "number" &&
    typeof value !== "string"
  ) {
    return undefined;
  }

  const number = Number(value);

  if (!Number.isSafeInteger(number) || number < 0) {
    return undefined;
  }

  return number;
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item === "string")
  );
}

function isAIRecommendation(
  value: unknown
): value is AIRecommendation {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    typeof item.propertyId === "string" &&
    item.propertyId.length > 0 &&
    typeof item.matchPercentage === "number" &&
    Number.isFinite(item.matchPercentage) &&
    item.matchPercentage >= 0 &&
    item.matchPercentage <= 100 &&
    isStringArray(item.reasons) &&
    isStringArray(item.disadvantages)
  );
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verify the user's session.
    const session = await verifySession();

    if (!session) {
      return NextResponse.json(
        { error: "Please log in to get recommendations." },
        { status: 401 }
      );
    }

    // 2. Only tenants can use recommendations.
    if (session.role !== "TENANT" || session.isOwner) {
      return NextResponse.json(
        { error: "Only tenants can get recommendations." },
        { status: 403 }
      );
    }

    // 3. Validate the request body.
    const body: unknown = await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { error: "Invalid request data." },
        { status: 400 }
      );
    }

    const data = body as Record<string, unknown>;

    // 4. Read basic preferences.
    const city = readText(data.city);
    const locality = readText(data.locality);
    const minRent = readInteger(data.minRent);
    const maxRent = readInteger(data.maxRent);
    const bedrooms = readInteger(data.bedrooms);
    const furnishing = readText(data.furnishing);
    const propertyType = readText(data.propertyType);

    // 5. Read lifestyle and travel preferences.
    const workplace = readText(data.workplace);
    const college = readText(data.college);
    const preferredDestination = readText(
      data.preferredDestination
    );
    const otherPreferences = readText(data.otherPreferences);
    const maxTravelTime = readInteger(data.maxTravelTime);

    // 6. Validate rent values.
    if (
      data.minRent !== undefined &&
      data.minRent !== null &&
      data.minRent !== "" &&
      minRent === undefined
    ) {
      return NextResponse.json(
        {
          error: "Minimum rent must be a non-negative whole number.",
        },
        { status: 400 }
      );
    }

    if (
      data.maxRent !== undefined &&
      data.maxRent !== null &&
      data.maxRent !== "" &&
      maxRent === undefined
    ) {
      return NextResponse.json(
        {
          error: "Maximum rent must be a non-negative whole number.",
        },
        { status: 400 }
      );
    }

    if (
      minRent !== undefined &&
      maxRent !== undefined &&
      minRent > maxRent
    ) {
      return NextResponse.json(
        {
          error: "Minimum budget cannot exceed maximum budget.",
        },
        { status: 400 }
      );
    }

    // 7. Validate bedrooms.
    if (
      data.bedrooms !== undefined &&
      data.bedrooms !== null &&
      data.bedrooms !== "" &&
      (
        bedrooms === undefined ||
        bedrooms < 1 ||
        bedrooms > 20
      )
    ) {
      return NextResponse.json(
        {
          error: "Bedrooms must be a whole number between 1 and 20.",
        },
        { status: 400 }
      );
    }

    // 8. Validate property type.
    if (
      propertyType !== undefined &&
      !validPropertyTypes.includes(propertyType)
    ) {
      return NextResponse.json(
        { error: "Invalid property type preference." },
        { status: 400 }
      );
    }

    // 9. Validate furnishing.
    if (
      furnishing !== undefined &&
      !validFurnishingTypes.includes(furnishing)
    ) {
      return NextResponse.json(
        { error: "Invalid furnishing preference." },
        { status: 400 }
      );
    }

    // 10. Validate travel time.
    if (
      data.maxTravelTime !== undefined &&
      data.maxTravelTime !== null &&
      data.maxTravelTime !== "" &&
      (
        maxTravelTime === undefined ||
        maxTravelTime < 1 ||
        maxTravelTime > 600
      )
    ) {
      return NextResponse.json(
        {
          error: "Maximum travel time must be between 1 and 600 minutes.",
        },
        { status: 400 }
      );
    }

    // 11. Validate text preference lengths.
    const textPreferences = [
      { name: "Workplace", value: workplace },
      { name: "College", value: college },
      {
        name: "Preferred destination",
        value: preferredDestination,
      },
      { name: "Other preferences", value: otherPreferences },
    ];

    for (const preference of textPreferences) {
      if (preference.value && preference.value.length > 200) {
        return NextResponse.json(
          {
            error: `${preference.name} must not exceed 200 characters.`,
          },
          { status: 400 }
        );
      }
    }

    // 12. Validate amenities.
    let amenities: string[] = [];

    if (data.amenities !== undefined) {
      if (!isStringArray(data.amenities)) {
        return NextResponse.json(
          {
            error: "Amenities must be a list of text values.",
          },
          { status: 400 }
        );
      }

      amenities = data.amenities
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    }

    // 13. Validate parking.
    let parking: boolean | undefined;

    if (data.parking !== undefined && data.parking !== null) {
      if (typeof data.parking !== "boolean") {
        return NextResponse.json(
          { error: "Parking must be true or false." },
          { status: 400 }
        );
      }

      parking = data.parking;
    }

    // 14. Build preferences for FastAPI.
    const preferences = {
      ...(city ? { city } : {}),
      ...(locality ? { locality } : {}),
      ...(minRent !== undefined ? { minRent } : {}),
      ...(maxRent !== undefined ? { maxRent } : {}),
      ...(bedrooms !== undefined ? { bedrooms } : {}),
      ...(propertyType ? { propertyType } : {}),
      ...(furnishing ? { furnishing } : {}),
      ...(amenities.length > 0 ? { amenities } : {}),
      ...(parking !== undefined ? { parking } : {}),
      ...(workplace ? { workplace } : {}),
      ...(college ? { college } : {}),
      ...(preferredDestination ? { preferredDestination } : {}),
      ...(maxTravelTime !== undefined ? { maxTravelTime } : {}),
      ...(otherPreferences ? { otherPreferences } : {}),
    };

    // 15. Fetch approved properties from PostgreSQL.
    // Maximum 200 candidates are sent to the AI service.
    const properties: DatabaseProperty[] =
      await prisma.property.findMany({
        where: {
          status: "APPROVED",
        },

        select: propertySelection,

        orderBy: {
          createdAt: "desc",
        },

        take: 200,
      });

    if (properties.length === 0) {
      return NextResponse.json({
        success: true,
        total: 0,
        message: "No approved properties are available yet.",
        recommendations: [],
      });
    }

    // 16. Convert database properties into FastAPI candidates.
    // Travel time is omitted until reliable travel data is available.
    const candidates = properties.map((property) => ({
      id: property.id,
      title: property.title,
      city: property.city,
      locality: property.locality,
      monthlyRent: property.monthlyRent,
      bedrooms: property.bedrooms,
      propertyType: property.propertyType,
      furnishing: property.furnishing,
      parking: property.parking,

      amenities: property.amenities.map(
        (item: { amenity: { name: string } }) =>
          item.amenity.name
      ),

      description: property.description,
    }));

    // 17. Check the FastAPI service URL.
    const aiServiceUrl = process.env.AI_SERVICE_URL?.trim();

    if (!aiServiceUrl) {
      console.error("AI_SERVICE_URL is not configured.");

      return NextResponse.json(
        { error: "HOMZY AI service is not configured." },
        { status: 503 }
      );
    }

    const baseUrl = aiServiceUrl.replace(/\/+$/, "");

    // 18. Send candidates and preferences to FastAPI.
    let aiResponse: Response;

    try {
      aiResponse = await fetch(`${baseUrl}/recommend`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          preferences,
          candidates,
        }),

        signal: AbortSignal.timeout(30000),
        cache: "no-store",
      });
    } catch (error) {
      console.error("HOMZY AI connection error:", error);

      return NextResponse.json(
        {
          error:
            "Unable to connect to HOMZY AI. Please check that the AI service is running.",
        },
        { status: 503 }
      );
    }

    if (!aiResponse.ok) {
      console.error(
        "HOMZY AI returned HTTP status:",
        aiResponse.status
      );

      return NextResponse.json(
        {
          error: "HOMZY AI could not generate recommendations.",
        },
        { status: 502 }
      );
    }

    // 19. Read and validate the FastAPI response.
    const aiData: unknown = await aiResponse.json();

    if (
      !aiData ||
      typeof aiData !== "object" ||
      Array.isArray(aiData)
    ) {
      return NextResponse.json(
        {
          error: "HOMZY AI returned an invalid response.",
        },
        { status: 502 }
      );
    }

    const result = aiData as Record<string, unknown>;

    if (
      result.status !== "success" ||
      !Array.isArray(result.recommendations) ||
      !result.recommendations.every(isAIRecommendation)
    ) {
      return NextResponse.json(
        {
          error:
            "HOMZY AI returned an invalid recommendation format.",
        },
        { status: 502 }
      );
    }

    // 20. Match AI results with original database records.
    const propertyMap = new Map(
      properties.map((property) => [property.id, property])
    );

    const seenIds = new Set<string>();

    const validRecommendations = result.recommendations.filter(
      (item) => {
        if (
          !propertyMap.has(item.propertyId) ||
          seenIds.has(item.propertyId)
        ) {
          return false;
        }

        seenIds.add(item.propertyId);
        return true;
      }
    );

    // 21. Build the final recommendation response.
    const recommendations = validRecommendations
      .map((item) => {
        const property = propertyMap.get(item.propertyId);

        if (!property) {
          return null;
        }

        return {
          id: property.id,
          imageUrl: property.imageUrl,
          title: property.title,
          city: property.city,
          locality: property.locality,
          monthlyRent: property.monthlyRent,
          area: property.area,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          furnishing: property.furnishing,

          amenityNames: property.amenities.map(
            (amenity: { amenity: { name: string } }) =>
              amenity.amenity.name
          ),

          matchPercentage: item.matchPercentage,
          reasons: item.reasons,
          disadvantages: item.disadvantages,
        };
      })
      .filter((item) => item !== null)
      .sort(
        (a, b) => b.matchPercentage - a.matchPercentage
      );

    // 22. Return the recommendations.
    return NextResponse.json({
      success: true,
      total: recommendations.length,
      message: "Recommendations generated successfully.",
      recommendations,
    });
  } catch (error) {
    console.error("Recommendation API error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to generate recommendations. Please try again.",
      },
      { status: 500 }
    );
  }
}
