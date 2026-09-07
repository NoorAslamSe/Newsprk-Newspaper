import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * VAST Proxy — fetches a VAST XML tag server-side to avoid CORS issues.
 * Third-party ad servers (e.g. srv.aso1.net) block direct browser requests
 * with CORS headers. This proxy fetches the XML on the server and returns it.
 *
 * Usage: GET /api/vast-proxy?url=https://srv.aso1.net/vast?z=159250
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const vastUrl = searchParams.get("url");

  if (!vastUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  // Basic validation — only allow http/https URLs
  let parsed: URL;
  try {
    parsed = new URL(vastUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("Invalid protocol");
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const res = await fetch(vastUrl, {
      headers: {
        // Mimic a browser request so ad servers don't block us
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/xml, text/xml, */*",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream VAST fetch failed: ${res.status}` },
        { status: 502 }
      );
    }

    const xml = await res.text();

    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        // Allow the browser to read this response
        "Access-Control-Allow-Origin": "*",
        // Don't cache — VAST tags often contain cache-busters
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("[vast-proxy] fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch VAST tag", details: err.message },
      { status: 502 }
    );
  }
}
