import { NextResponse } from "next/server";
import { headers } from "next/headers";

/**
 * Lightweight public endpoint that returns the visitor's IP address.
 * Used by client-side VAST macro replacement since browsers
 * cannot determine the user's public IP on their own.
 *
 * No authentication required — returns only the IP, nothing sensitive.
 */
export async function GET() {
  const hdrs = await headers();

  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    hdrs.get("x-real-ip") ||
    hdrs.get("cf-connecting-ip") ||
    "";

  return NextResponse.json({ ip }, {
    headers: {
      // Cache per-user for 5 minutes to avoid excessive calls
      "Cache-Control": "private, max-age=300",
    },
  });
}
