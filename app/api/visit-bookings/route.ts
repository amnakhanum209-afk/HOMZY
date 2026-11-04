
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";

// Check owner login
async function checkOwner() {
  const session = await verifySession();

  if (!session) {
    return { error: "Please login first.", status: 401 };
  }

  if (session.role !== "OWNER" && !session.isOwner) {
    return { error: "Only property owners can manage bookings.", status: 403 };
  }

  return { session };
}

// GET: View bookings for owner's properties
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

// PATCH: Accept or reject a booking
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

    if (!bookingId || !["ACCEPTED", "REJECTED"].includes(status)) {
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
      where: {
        id: bookingId,
      },
      data: {
        status,
      },
    });

    return NextResponse.json({
      message: `Booking ${status.toLowerCase()} successfully.`,
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Update booking error:", error);

    return NextResponse.json(
      { error: "Unable to update booking." },
      { status: 500 }
    );
  }
}
