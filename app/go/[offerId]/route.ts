import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { AffiliateOffer } from "@/lib/models/AffiliateOffer";
import { AffiliateClick } from "@/lib/models/AffiliateClick";

// Known bot User-Agents to block from click logging
const BOT_UA_PATTERNS = /bot|crawl|spider|slurp|mediapartners|adsbot|feedfetcher/i;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ offerId: string }> }
) {
  const { offerId } = await params;

  try {
    await connectDB();

    // 1. Look up the offer
    const offer = await AffiliateOffer.findOne({ offerId, status: "active" }).lean();
    if (!offer) {
      return NextResponse.redirect(new URL("/?offer=not-found", request.url), { status: 302 });
    }

    // 2. Rate limit known bots
    const ua = request.headers.get("user-agent") || "";
    const isBot = BOT_UA_PATTERNS.test(ua);

    // 3. Log the click (server-side, ad-blocker-proof)
    if (!isBot) {
      const referer = request.headers.get("referer") || "";
      const subId = request.nextUrl.searchParams.get("sub_id") || "";

      await AffiliateClick.create({
        offerId,
        timestamp: new Date(),
        userAgent: ua.substring(0, 500),
        referer: referer.substring(0, 500),
        pageClass: request.nextUrl.searchParams.get("page_class") || "",
        entity: request.nextUrl.searchParams.get("entity") || "",
        position: request.nextUrl.searchParams.get("position") || "",
        locale: request.nextUrl.searchParams.get("locale") || "en",
        subId,
      }).catch(() => {});

      // 4. Increment click count
      await AffiliateOffer.updateOne({ offerId }, { $inc: { clickCount: 1 } }).catch(() => {});
    }

    // 5. 302 redirect to the affiliate URL
    return NextResponse.redirect(offer.affiliateUrl, { status: 302 });
  } catch (error) {
    console.error("Error in /go/ redirect:", error);
    return NextResponse.redirect(new URL("/?error=redirect", request.url), { status: 302 });
  }
}
