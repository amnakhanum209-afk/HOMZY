
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Direct Owner activation is disabled. Please submit an Owner access request and wait for Admin approval.",
    },
    { status: 403 }
  );
}
