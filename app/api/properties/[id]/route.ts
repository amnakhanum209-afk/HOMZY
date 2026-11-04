import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";

const ALLOWED_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "INACTIVE",
] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifySession();

  if (!session) {
    return NextResponse.json(
      { error: "Not authenticated." },
      { status: 401 }
    );
  }

  const { id } = await params;

  const property = await prisma.property.findUnique({
    where: { id },
  });

  if (!property) {
    return NextResponse.json(
      { error: "Property not found." },
      { status: 404 }
    );
  }

  if (property.ownerId !== session.userId) {
    return NextResponse.json(
      { error: "You do not have permission to edit this property." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const data: Record<string, unknown> = {};

    // Reactivate an inactive property safely.
    // Restore its previous status when available.
    // Older inactive properties without a saved status return to PENDING.
    if (body.reactivate === true) {
      if (property.status !== "INACTIVE") {
        return NextResponse.json(
          { error: "Only inactive properties can be reactivated." },
          { status: 400 }
        );
      }

      const restoredStatus =
        property.previousStatus === "APPROVED" ||
        property.previousStatus === "PENDING"
          ? property.previousStatus
          : "PENDING";

      const updated = await prisma.property.update({
        where: { id },
        data: {
          status: restoredStatus,
          previousStatus: null,
        },
      });

      return NextResponse.json({
        message:
          restoredStatus === "APPROVED"
            ? "Property reactivated."
            : "Property reactivated as pending review.",
        property: updated,
      });
    }

    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description;
    if (body.propertyType !== undefined) data.propertyType = body.propertyType;
    if (body.address !== undefined) data.address = body.address;
    if (body.locality !== undefined) data.locality = body.locality;
    if (body.city !== undefined) data.city = body.city;
    if (body.state !== undefined) data.state = body.state;
    if (body.pincode !== undefined) data.pincode = body.pincode;

    if (body.monthlyRent !== undefined) {
      const value = Number(body.monthlyRent);

      if (!Number.isFinite(value) || value < 0) {
        return NextResponse.json(
          { error: "Invalid monthly rent." },
          { status: 400 }
        );
      }

      data.monthlyRent = Math.trunc(value);
    }

    if (body.securityDeposit !== undefined) {
      const value = Number(body.securityDeposit);

      if (!Number.isFinite(value) || value < 0) {
        return NextResponse.json(
          { error: "Invalid security deposit." },
          { status: 400 }
        );
      }

      data.securityDeposit = Math.trunc(value);
    }

    if (body.area !== undefined) {
      const value = Number(body.area);

      if (!Number.isFinite(value) || value < 0) {
        return NextResponse.json(
          { error: "Invalid property area." },
          { status: 400 }
        );
      }

      data.area = Math.trunc(value);
    }

    if (body.bedrooms !== undefined) {
      const value = Number(body.bedrooms);

      if (!Number.isInteger(value) || value < 0) {
        return NextResponse.json(
          { error: "Invalid bedroom count." },
          { status: 400 }
        );
      }

      data.bedrooms = value;
    }

    if (body.bathrooms !== undefined) {
      const value = Number(body.bathrooms);

      if (!Number.isInteger(value) || value < 0) {
        return NextResponse.json(
          { error: "Invalid bathroom count." },
          { status: 400 }
        );
      }

      data.bathrooms = value;
    }

    if (body.furnishing !== undefined) {
      data.furnishing = body.furnishing;
    }

    if (body.parking !== undefined) {
      data.parking = Boolean(body.parking);
    }

    if (body.floor !== undefined) {
      if (body.floor === "" || body.floor === null) {
        data.floor = null;
      } else {
        const value = Number(body.floor);

        if (!Number.isInteger(value)) {
          return NextResponse.json(
            { error: "Invalid floor number." },
            { status: 400 }
          );
        }

        data.floor = value;
      }
    }

    if (body.totalFloors !== undefined) {
      if (body.totalFloors === "" || body.totalFloors === null) {
        data.totalFloors = null;
      } else {
        const value = Number(body.totalFloors);

        if (!Number.isInteger(value) || value < 1) {
          return NextResponse.json(
            { error: "Invalid total floors." },
            { status: 400 }
          );
        }

        data.totalFloors = value;
      }
    }

    if (body.availableDate !== undefined) {
      const date = body.availableDate
        ? new Date(body.availableDate)
        : null;

      if (date && Number.isNaN(date.getTime())) {
        return NextResponse.json(
          { error: "Invalid availability date." },
          { status: 400 }
        );
      }

      data.availableDate = date;
    }

    if (body.status !== undefined) {
      if (
        typeof body.status !== "string" ||
        !ALLOWED_STATUSES.includes(
          body.status as (typeof ALLOWED_STATUSES)[number]
        )
      ) {
        return NextResponse.json(
          { error: "Invalid property status." },
          { status: 400 }
        );
      }

      // Owners may deactivate a property, but cannot approve or reject it.
      if (body.status === "INACTIVE") {
        if (property.status !== "INACTIVE") {
          data.previousStatus = property.status;
          data.status = "INACTIVE";
        }
      } else if (body.status !== property.status) {
        return NextResponse.json(
          {
            error:
              "This status change is not allowed through this endpoint.",
          },
          { status: 403 }
        );
      }
    }

    const updated = await prisma.property.update({
      where: { id },
      data: data as any,
    });

    return NextResponse.json({
      message: "Property updated.",
      property: updated,
    });
  } catch (error) {
    console.error("Property update error:", error);

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifySession();

  if (!session) {
    return NextResponse.json(
      { error: "Not authenticated." },
      { status: 401 }
    );
  }

  const { id } = await params;

  const property = await prisma.property.findUnique({
    where: { id },
  });

  if (!property) {
    return NextResponse.json(
      { error: "Property not found." },
      { status: 404 }
    );
  }

  if (property.ownerId !== session.userId) {
    return NextResponse.json(
      { error: "You do not have permission to delete this property." },
      { status: 403 }
    );
  }

  try {
    await prisma.property.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Property deleted.",
    });
  } catch (error) {
    console.error("Property deletion error:", error);

    return NextResponse.json(
      { error: "Failed to delete property. Please try again." },
      { status: 500 }
    );
  }
}