import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await verifySession();

  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  if (!session.isOwner && session.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Only property owners can list properties." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const {
      title,
      description,
      propertyType,
      listingType,
      address,
      locality,
      city,
      state,
      country,
      pincode,
      monthlyRent,
      securityDeposit,
      area,
      bedrooms,
      bathrooms,
      furnishing,
      parking,
      floor,
      totalFloors,
      availableDate,
      amenityIds,
    } = body;

    if (
      !title || !description || !propertyType || !listingType || !address ||
      !locality || !city || !state || !country || !pincode ||
      !monthlyRent || !securityDeposit || !area || !bedrooms || !bathrooms || !furnishing
    ) {
      return NextResponse.json(
        { error: "All required fields must be filled." },
        { status: 400 }
      );
    }

    const newProperty = await prisma.property.create({
      data: {
        ownerId: session.userId,
        title,
        description,
        propertyType,
        listingType,
        address,
        locality,
        city,
        state,
        country,
        pincode,
        monthlyRent: parseInt(monthlyRent),
        securityDeposit: parseInt(securityDeposit),
        area: parseInt(area),
        bedrooms: parseInt(bedrooms),
        bathrooms: parseInt(bathrooms),
        furnishing,
        parking: Boolean(parking),
        floor: floor ? parseInt(floor) : null,
        totalFloors: totalFloors ? parseInt(totalFloors) : null,
        availableDate: availableDate ? new Date(availableDate) : null,
        amenities: {
          create: (amenityIds || []).map((amenityId: string) => ({
            amenity: { connect: { id: amenityId } },
          })),
        },
      },
    });

    return NextResponse.json(
      { message: "Property listed successfully.", propertyId: newProperty.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Property creation error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}