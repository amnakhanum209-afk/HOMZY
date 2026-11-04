
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";

// POST: Submit an Owner access request
export async function POST() {
  try {
    const session = await verifySession();

    if (!session) {
      return NextResponse.json(
        { error: "Please log in first." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    if (user.role === "ADMIN") {
      return NextResponse.json(
        { error: "Admin accounts do not need Owner access requests." },
        { status: 403 }
      );
    }

    if (user.isOwner) {
      return NextResponse.json(
        { message: "You already have Owner access." },
        { status: 200 }
      );
    }

    const existingRequest = await prisma.ownerRequest.findUnique({
      where: { userId: user.id },
    });

    if (existingRequest?.status === "PENDING") {
      return NextResponse.json(
        {
          message: "Your Owner request is already pending.",
          status: "PENDING",
        },
        { status: 200 }
      );
    }

    const ownerRequest = await prisma.ownerRequest.upsert({
      where: { userId: user.id },
      update: {
        status: "PENDING",
        message: null,
      },
      create: {
        userId: user.id,
        status: "PENDING",
      },
    });

    return NextResponse.json(
      {
        message: "Your Owner access request has been submitted.",
        status: ownerRequest.status,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Owner request error:", error);

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

// GET: Check Owner access request status
export async function GET() {
  try {
    const session = await verifySession();

    if (!session) {
      return NextResponse.json(
        { error: "Please log in first." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { isOwner: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    const ownerRequest = await prisma.ownerRequest.findUnique({
      where: { userId: session.userId },
      select: {
        status: true,
        message: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      isOwner: user.isOwner,
      request: ownerRequest,
    });
  } catch (error) {
    console.error("Owner request status error:", error);

    return NextResponse.json(
      { error: "Unable to fetch Owner request status." },
      { status: 500 }
    );
  }
}
