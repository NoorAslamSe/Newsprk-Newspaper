import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Setting } from "@/lib/models/Setting";
import { Article } from "@/lib/models/Article";
import { DEPLOYMENT_LOCALE } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const FEATURED_IDS_KEY = "homepage.featuredComparisons";
const MAX_COUNT_KEY = "homepage.featuredComparisonsMaxCount";
const DEFAULT_MAX_COUNT = 6;

export async function GET() {
  try {
    await connectDB();

    const [idsSetting, maxCountSetting] = await Promise.all([
      Setting.findOne({ key: FEATURED_IDS_KEY, locale: DEPLOYMENT_LOCALE }).lean(),
      Setting.findOne({ key: MAX_COUNT_KEY, locale: DEPLOYMENT_LOCALE }).lean(),
    ]);

    let featuredComparisonIds = Array.isArray(idsSetting?.value)
      ? (idsSetting.value as string[])
      : [];
    const maxCount = typeof maxCountSetting?.value === "number"
      ? (maxCountSetting.value as number)
      : DEFAULT_MAX_COUNT;

    // Validate stored IDs actually belong to published comparisons of the current locale
    if (featuredComparisonIds.length > 0) {
      const validArticles = await Article.find(
        {
          _id: { $in: featuredComparisonIds },
          locale: DEPLOYMENT_LOCALE,
          content_type: { $in: ["comparison", "review"] },
          status: "published",
        },
        { _id: 1 }
      ).lean();
      const validIdStrings = new Set(validArticles.map((a: any) => a._id.toString()));
      const validIds = featuredComparisonIds.filter((id: string) => validIdStrings.has(id));
      // Silently drop stale IDs and update the setting
      if (validIds.length !== featuredComparisonIds.length) {
        featuredComparisonIds = validIds;
        await Setting.findOneAndUpdate(
          { key: FEATURED_IDS_KEY, locale: DEPLOYMENT_LOCALE },
          { value: featuredComparisonIds }
        );
      }
    }

    return NextResponse.json({ featuredComparisonIds, maxCount });
  } catch (error: any) {
    console.error("Error fetching homepage settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch homepage settings", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await connectDB();

    const body = await request.json();
    const { featuredComparisonIds, maxCount } = body as {
      featuredComparisonIds?: string[];
      maxCount?: number;
    };

    if (!Array.isArray(featuredComparisonIds)) {
      return NextResponse.json(
        { error: "featuredComparisonIds must be an array" },
        { status: 400 }
      );
    }

    const count = typeof maxCount === "number" && maxCount >= 1 && maxCount <= 12
      ? maxCount
      : DEFAULT_MAX_COUNT;

    await Promise.all([
      Setting.findOneAndUpdate(
        { key: FEATURED_IDS_KEY, locale: DEPLOYMENT_LOCALE },
        { key: FEATURED_IDS_KEY, locale: DEPLOYMENT_LOCALE, value: featuredComparisonIds },
        { upsert: true, new: true }
      ),
      Setting.findOneAndUpdate(
        { key: MAX_COUNT_KEY, locale: DEPLOYMENT_LOCALE },
        { key: MAX_COUNT_KEY, locale: DEPLOYMENT_LOCALE, value: count },
        { upsert: true, new: true }
      ),
    ]);

    return NextResponse.json({ ok: true, featuredComparisonIds, maxCount: count });
  } catch (error: any) {
    console.error("Error saving homepage settings:", error);
    return NextResponse.json(
      { error: "Failed to save homepage settings", details: error.message },
      { status: 500 }
    );
  }
}
