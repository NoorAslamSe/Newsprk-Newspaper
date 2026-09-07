import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { AdSnippet } from "@/lib/models/AdSnippet";
import { AdSnippetCreateSchema } from "@/lib/validations/ad";
import { toApiError } from "@/lib/api/errors";
import { requirePermission } from "@/lib/auth/server";
import { buildVastUrl, hasUnresolvedMacros, contextFromRequest } from "@/lib/ads/buildVastUrl";
import { POSITION_SIZE_CONFIG } from "@/lib/constants/adSizes";
import { DEPLOYMENT_LOCALE } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const pageType = searchParams.get("pageType");
    const position = searchParams.get("position");
    const activeOnly = searchParams.get("activeOnly") === "true";

    const query: any = {};
    // Scope all ad queries to the current deployment locale
    query.locale = DEPLOYMENT_LOCALE;
    if (pageType) query.pageType = pageType;
    // When a specific position is requested, filter server-side so only the
    // exact matching ad is returned — no cross-position bleed possible.
    if (position) query.position = position;
    if (activeOnly) query.enabled = true;
    // CRITICAL: Never return per-article override snippets in global queries.
    // These are only valid for the specific article they belong to and must
    // only be fetched directly by their _id via adOverrideId.
    // Without this, a per-article ad bleeds onto every article page that
    // shares the same pageType + position combination.
    query.isArticleOverride = { $ne: true };
    const items = await AdSnippet.find(query).sort({ pageType: 1, position: 1, name: 1 }).lean();

    // Resolve VAST macros server-side for any ads with [replace_me] templates
    const resolvedItems = items.map((ad: any) => {
      if (ad.vastTagUrl && hasUnresolvedMacros(ad.vastTagUrl)) {
        const posConfig = POSITION_SIZE_CONFIG[ad.position];
        const width = posConfig?.desktop?.width ?? 728;
        const height = posConfig?.desktop?.height ?? 90;
        const ctx = contextFromRequest(req, width, height);
        const resolved = buildVastUrl(ad.vastTagUrl, ctx);
        return { ...ad, vastUrl: resolved };
      }
      return ad;
    });

    return NextResponse.json({ items: resolvedItems });
  } catch (err) {
    return NextResponse.json(toApiError(err), { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requirePermission("adsmanager.manage");
    await connectDB();
    const body = AdSnippetCreateSchema.parse(await req.json());
    // Scope new ad snippets to the current deployment locale
    const created = await AdSnippet.create({ ...body, locale: DEPLOYMENT_LOCALE });
    return NextResponse.json({ item: created }, { status: 201 });
  } catch (err) {
    const apiError = toApiError(err);
    const status =
      apiError.error === "Validation error" ? 400 : apiError.error === "Forbidden" ? 403 : 500;
    return NextResponse.json(apiError, { status });
  }
}

