import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ConsentLog } from "@/lib/models/ConsentLog";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { consentState } = body;

    if (!consentState || !["accepted", "declined", "partial"].includes(consentState)) {
      return NextResponse.json({ error: "Invalid consent state" }, { status: 400 });
    }

    await connectDB();

    // Generate a session ID from the request (simple fingerprint)
    const userAgent = req.headers.get("user-agent") || "";
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0] || "unknown";

    await ConsentLog.create({
      sessionId: `${ip}-${Date.now()}`,
      timestamp: new Date(),
      consentState,
      ad_storage: consentState === "accepted" ? "granted" : "denied",
      analytics_storage: consentState === "accepted" ? "granted" : "denied",
      ad_user_data: consentState === "accepted" ? "granted" : "denied",
      ad_personalization: consentState === "accepted" ? "granted" : "denied",
      geo: "",
      userAgent: userAgent.substring(0, 200),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Consent log error:", err);
    return NextResponse.json({ error: "Failed to log consent" }, { status: 500 });
  }
}
