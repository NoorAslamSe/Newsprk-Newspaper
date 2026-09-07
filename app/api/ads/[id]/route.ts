import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { AdSnippet } from "@/lib/models/AdSnippet";
import { AdSnippetUpdateSchema } from "@/lib/validations/ad";
import { toApiError } from "@/lib/api/errors";
import { requirePermission } from "@/lib/auth/server";
import { buildVastUrl, hasUnresolvedMacros, contextFromRequest } from "@/lib/ads/buildVastUrl";
import { POSITION_SIZE_CONFIG } from "@/lib/constants/adSizes";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid ad id." }, { status: 400 });
    const item = await AdSnippet.findById(id).lean();
    if (!item) return NextResponse.json({ error: "Not found." }, { status: 404 });

    // Resolve VAST macros server-side if the tag URL contains [replace_me] templates
    const adItem = item as any;
    if (adItem.vastTagUrl && hasUnresolvedMacros(adItem.vastTagUrl)) {
      const posConfig = POSITION_SIZE_CONFIG[adItem.position];
      const width = posConfig?.desktop?.width ?? 728;
      const height = posConfig?.desktop?.height ?? 90;
      const ctx = contextFromRequest(req, width, height);
      const resolved = buildVastUrl(adItem.vastTagUrl, ctx);
      return NextResponse.json({ item: { ...adItem, vastUrl: resolved } });
    }

    return NextResponse.json({ item });
  } catch (err) {
    return NextResponse.json(toApiError(err), { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("adsmanager.manage");
    await connectDB();
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid ad id." }, { status: 400 });
    const ad = await AdSnippet.findById(id);
    if (!ad) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const body = AdSnippetUpdateSchema.parse(await req.json());
    Object.assign(ad, body);
    await ad.save();
    return NextResponse.json({ item: ad });
  } catch (err) {
    const apiError = toApiError(err);
    const status =
      apiError.error === "Validation error" ? 400 : apiError.error === "Forbidden" ? 403 : 500;
    return NextResponse.json(apiError, { status });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("adsmanager.manage");
    await connectDB();
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid ad id." }, { status: 400 });
    const ad = await AdSnippet.findById(id);
    if (!ad) return NextResponse.json({ error: "Not found." }, { status: 404 });
    await ad.deleteOne();
    return NextResponse.json({ ok: true });
  } catch (err) {
    const apiError = toApiError(err);
    const status = apiError.error === "Forbidden" ? 403 : 500;
    return NextResponse.json(apiError, { status });
  }
}

