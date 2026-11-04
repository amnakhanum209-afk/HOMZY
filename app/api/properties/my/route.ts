import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";

export async function GET() {
  const session = await verifySession();

  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const properties = await prisma.property.findMany({
    where: { ownerId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(properties);
}