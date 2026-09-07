import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Setting } from "@/lib/models/Setting";
import { toApiError } from "@/lib/api/errors";
import { DEPLOYMENT_LOCALE } from "@/lib/i18n";

const SETTINGS_KEY = "site";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    const doc = await Setting.findOne({ key: SETTINGS_KEY, locale: DEPLOYMENT_LOCALE }).lean();
    
    // Only return the ad settings part
    const value = doc?.value ?? {};
    
    return NextResponse.json({ 
      adAppearance: value.adAppearance || null,
      adSlotSizing: value.adSlotSizing || null
    });
  } catch (err) {
    return NextResponse.json(toApiError(err), { status: 500 });
  }
}
