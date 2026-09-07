import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { AdSnippet } from "@/lib/models/AdSnippet";
import { toApiError } from "@/lib/api/errors";

// POST /api/ads/[id]/analytics - Track analytics events
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const { event } = body;

    const ad = await AdSnippet.findById(id);
    if (!ad) {
      return NextResponse.json({ error: "Ad not found" }, { status: 404 });
    }

    // Update analytics based on event type
    switch (event) {
      case "impression":
        ad.analytics.impressions += 1;
        ad.analytics.lastImpression = new Date();
        break;

      case "click":
        ad.analytics.clicks += 1;
        ad.analytics.lastClick = new Date();
        break;

      case "close":
        ad.analytics.closes += 1;
        ad.analytics.lastClose = new Date();
        
        // Track close reason
        const { closeReason, customText } = body;
        if (closeReason && ad.analytics.closeReasons[closeReason] !== undefined) {
          ad.analytics.closeReasons[closeReason] += 1;
          
          // Store custom text if it's "other"
          if (closeReason === "other" && customText) {
            if (!ad.analytics.otherReasonDetails) ad.analytics.otherReasonDetails = [];
            ad.analytics.otherReasonDetails.push({
              text: customText,
              date: new Date()
            });
            // Ensure Mongoose tracks the push to the nested array
            ad.markModified('analytics.otherReasonDetails');
          }
          ad.markModified('analytics.closeReasons');
        } else if (closeReason) {
          ad.analytics.closeReasons.other += 1;
          ad.markModified('analytics.closeReasons');
        }
        break;

      case "like":
        ad.analytics.likes = (ad.analytics.likes || 0) + 1;
        ad.analytics.lastLike = new Date();
        break;

      default:
        return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
    }

    // Calculate CTR
    if (ad.analytics.impressions > 0) {
      ad.analytics.ctr = (ad.analytics.clicks / ad.analytics.impressions) * 100;
    }

    await ad.save();

    return NextResponse.json({
      success: true,
      analytics: ad.analytics,
    });
  } catch (error) {
    console.error("Analytics tracking error:", error);
    const apiError = toApiError(error);
    return NextResponse.json(apiError, { status: 500 });
  }
}

// GET /api/ads/[id]/analytics - Get analytics for specific ad
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const ad = await AdSnippet.findById(id).select("analytics name label position pageType");
    if (!ad) {
      return NextResponse.json({ error: "Ad not found" }, { status: 404 });
    }

    return NextResponse.json({
      ad: {
        id: ad._id,
        name: ad.name,
        label: ad.label,
        position: ad.position,
        pageType: ad.pageType,
      },
      analytics: ad.analytics,
    });
  } catch (error) {
    console.error("Get analytics error:", error);
    const apiError = toApiError(error);
    return NextResponse.json(apiError, { status: 500 });
  }
}
