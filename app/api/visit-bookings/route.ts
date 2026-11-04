import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";

// Check whether the logged-in user is a property owner
async function checkOwner() {
  const session = await verifySession();

  if (!session) {
    return { error: "Please login first.", status: 401 };
  }

  if (session.role !== "OWNER" && !session.isOwner) {
    return {
      error: "Only property owners can manage bookings.",
      status: 403,
    };
  }

  return { session };
}

// TENANT: Submit a property visit request
export async function POST(request: Request) {
  try {
    const session = await verifySession();

    if (!session) {
      return NextResponse.json(
        { error: "Please login first." },
        { status: 401 }
      );
    }

    if (session.role !== "TENANT" || session.isOwner) {
      return NextResponse.json(
        { error: "Only tenants can request property visits." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const { propertyId, visitAt, message } = body;

    if (!propertyId || !visitAt) {
      return NextResponse.json(
        { error: "Property and visit date are required." },
        { status: 400 }
      );
    }

    const visitDate = new Date(visitAt);

    if (Number.isNaN(visitDate.getTime())) {
      return NextResponse.json(
        { error: "Please select a valid visit date." },
        { status: 400 }
      );
    }

    if (visitDate <= new Date()) {
      return NextResponse.json(
        { error: "Please select a future date and time." },
        { status: 400 }
      );
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property || property.status !== "APPROVED") {
      return NextResponse.json(
        { error: "This property is not available for booking." },
        { status: 404 }
      );
    }

    if (property.ownerId === session.userId) {
      return NextResponse.json(
        { error: "You cannot book a visit to your own property." },
        { status: 403 }
      );
    }

    const booking = await prisma.visitBooking.create({
      data: {
        tenantId: session.userId,
        propertyId,
        visitAt: visitDate,
        message: message?.trim() || null,
      },
    });

    return NextResponse.json(
      {
        message: "Your visit request has been submitted successfully!",
        booking,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create visit booking error:", error);

    return NextResponse.json(
      { error: "Unable to submit your visit request." },
      { status: 500 }
    );
  }
}

// OWNER: View received visit requests
export async function GET() {
  try {
    const auth = await checkOwner();

    if ("error" in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    const bookings = await prisma.visitBooking.findMany({
      where: {
        property: {
          ownerId: auth.session.userId,
        },
      },
      include: {
        tenant: true,
        property: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("Fetch owner bookings error:", error);

    return NextResponse.json(
      { error: "Unable to fetch bookings." },
      { status: 500 }
    );
  }
}

// OWNER: Accept or reject a visit request
export async function PATCH(request: Request) {
  try {
    const auth = await checkOwner();

    if ("error" in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    const body = await request.json();
    const { bookingId, status } = body;

    if (
      !bookingId ||
      !["ACCEPTED", "REJECTED"].includes(status)
    ) {
      return NextResponse.json(
        { error: "Valid booking ID and status are required." },
        { status: 400 }
      );
    }

    const booking = await prisma.visitBooking.findFirst({
      where: {
        id: bookingId,
        property: {
          ownerId: auth.session.userId,
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found." },
        { status: 404 }
      );
    }

    if (booking.status !== "PENDING") {
      return NextResponse.json(
        { error: "This booking has already been processed." },
        { status: 400 }
      );
    }

    const updatedBooking = await prisma.visitBooking.update({
      where: { id: bookingId },
      data: { status },
    });

    return NextResponse.json({
      message: `Booking ${status.toLowerCase()} successfully.`,
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Update booking error:", error);

    return NextResponse.json(
      { error: "Unable to update bookings." },
      { status: 500 }
    );
  }
}