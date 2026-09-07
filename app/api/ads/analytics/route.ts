import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { AdSnippet } from "@/lib/models/AdSnippet";
import { toApiError } from "@/lib/api/errors";

// GET /api/ads/analytics - Get aggregated analytics
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const pageType = searchParams.get("pageType");
    const position = searchParams.get("position");

    // Build query
    const query: any = {};
    if (pageType) query.pageType = pageType;
    if (position) query.position = position;

    const ads = await AdSnippet.find(query).select(
      "name label position pageType analytics enabled"
    );

    // Calculate totals
    const totals = {
      impressions: 0,
      clicks: 0,
      closes: 0,
      ctr: 0,
      closeReasons: {
        inappropriate: 0,
        coveredContent: 0,
        seenMultiple: 0,
        notInterested: 0,
        other: 0,
      },
      otherReasonTexts: [] as { adId: string, adName: string, text: string, date: Date }[],
    };

    ads.forEach((ad) => {
      totals.impressions += ad.analytics.impressions || 0;
      totals.clicks += ad.analytics.clicks || 0;
      totals.closes += ad.analytics.closes || 0;
      
      // Aggregate close reasons with proper typing
      const reasons = ad.analytics.closeReasons || {};
      totals.closeReasons.inappropriate += reasons.inappropriate || 0;
      totals.closeReasons.coveredContent += reasons.coveredContent || 0;
      totals.closeReasons.seenMultiple += reasons.seenMultiple || 0;
      totals.closeReasons.notInterested += reasons.notInterested || 0;
      totals.closeReasons.other += reasons.other || 0;

      // Add other reason texts
      if (ad.analytics.otherReasonDetails && Array.isArray(ad.analytics.otherReasonDetails)) {
        ad.analytics.otherReasonDetails.forEach((detail: any) => {
          totals.otherReasonTexts.push({
            adId: ad._id.toString(),
            adName: ad.name,
            text: detail.text,
            date: detail.date
          });
        });
      }
    });

    // Calculate overall CTR
    if (totals.impressions > 0) {
      totals.ctr = (totals.clicks / totals.impressions) * 100;
    }

    // Group by page type
    const byPageType: Record<string, any> = {};
    ads.forEach((ad) => {
      if (!byPageType[ad.pageType]) {
        byPageType[ad.pageType] = {
          impressions: 0,
          clicks: 0,
          closes: 0,
          ctr: 0,
          ads: [],
        };
      }
      byPageType[ad.pageType].impressions += ad.analytics.impressions || 0;
      byPageType[ad.pageType].clicks += ad.analytics.clicks || 0;
      byPageType[ad.pageType].closes += ad.analytics.closes || 0;
      byPageType[ad.pageType].ads.push({
        id: ad._id,
        name: ad.name,
        label: ad.label,
        position: ad.position,
        enabled: ad.enabled,
        analytics: ad.analytics,
      });
    });

    // Calculate CTR for each page type
    Object.keys(byPageType).forEach((pt) => {
      if (byPageType[pt].impressions > 0) {
        byPageType[pt].ctr = (byPageType[pt].clicks / byPageType[pt].impressions) * 100;
      }
    });

    // Group by position
    const byPosition: Record<string, any> = {};
    ads.forEach((ad) => {
      if (!byPosition[ad.position]) {
        byPosition[ad.position] = {
          impressions: 0,
          clicks: 0,
          closes: 0,
          ctr: 0,
          ads: [],
        };
      }
      byPosition[ad.position].impressions += ad.analytics.impressions || 0;
      byPosition[ad.position].clicks += ad.analytics.clicks || 0;
      byPosition[ad.position].closes += ad.analytics.closes || 0;
      byPosition[ad.position].ads.push({
        id: ad._id,
        name: ad.name,
        label: ad.label,
        pageType: ad.pageType,
        enabled: ad.enabled,
        analytics: ad.analytics,
      });
    });

    // Calculate CTR for each position
    Object.keys(byPosition).forEach((pos) => {
      if (byPosition[pos].impressions > 0) {
        byPosition[pos].ctr = (byPosition[pos].clicks / byPosition[pos].impressions) * 100;
      }
    });

    return NextResponse.json({
      totals,
      byPageType,
      byPosition,
      totalAds: ads.length,
      enabledAds: ads.filter((a) => a.enabled).length,
    });
  } catch (error) {
    console.error("Get aggregated analytics error:", error);
    const apiError = toApiError(error);
    return NextResponse.json(apiError, { status: 500 });
  }
}
