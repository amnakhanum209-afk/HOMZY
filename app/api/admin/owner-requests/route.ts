import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";

// Check whether the logged-in user is an Admin
async function checkAdmin() {
  const session = await verifySession();

  if (!session) {
    return { error: "Please log in first.", status: 401 };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });

  if (!user || user.role !== "ADMIN") {
    return { error: "Admin access required.", status: 403 };
  }

  return { session };
}

// GET: Fetch all Owner access requests
export async function GET() {
  try {
    const auth = await checkAdmin();

    if ("error" in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    const requests = await prisma.ownerRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            isOwner: true,
          },
        },
      },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Fetch Owner requests error:", error);

    return NextResponse.json(
      { error: "Unable to fetch Owner requests." },
      { status: 500 }
    );
  }
}

// PATCH: Approve or reject an Owner access request
export async function PATCH(request: Request) {
  try {
    const auth = await checkAdmin();

    if ("error" in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    const body = await request.json();
    const { requestId, action } = body;

    if (
      typeof requestId !== "string" ||
      !requestId.trim() ||
      !["APPROVE", "REJECT"].includes(action)
    ) {
      return NextResponse.json(
        { error: "A valid request ID and action are required." },
        { status: 400 }
      );
    }

    // Find the Owner request
    const ownerRequest = await prisma.ownerRequest.findUnique({
      where: { id: requestId },
    });

    if (!ownerRequest) {
      return NextResponse.json(
        { error: "Owner request not found." },
        { status: 404 }
      );
    }

    if (ownerRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "This request has already been reviewed." },
        { status: 409 }
      );
    }

    const isApproved = action === "APPROVE";

    // Update the user and request together
    const result = await prisma.$transaction([
      prisma.user.update({
        where: { id: ownerRequest.userId },
        data: { isOwner: isApproved },
      }),

      prisma.ownerRequest.update({
        where: { id: requestId },
        data: {
          status: isApproved ? "APPROVED" : "REJECTED",
        },
      }),
    ]);

    const updatedRequest = result[1];

    return NextResponse.json({
      message: isApproved
        ? "Owner request approved successfully."
        : "Owner request rejected successfully.",
      request: updatedRequest,
    });
  } catch (error) {
    console.error("Review Owner request error:", error);

    return NextResponse.json(
      { error: "Unable to review Owner request." },
      { status: 500 }
    );
  }
}