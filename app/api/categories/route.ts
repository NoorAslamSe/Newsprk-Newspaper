import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { SimpleCategory } from "@/lib/models/SimpleCategory";
import { Article } from "@/lib/models/Article";
import { DEPLOYMENT_LOCALE } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") || DEPLOYMENT_LOCALE;

    await connectDB();

    const categories = await SimpleCategory.find({
      locale: locale
    }).lean();

    const categoriesWithCounts = await Promise.all(
      categories.map(async (cat: any) => {
        const [count, latestArticle] = await Promise.all([
          Article.countDocuments({ 
            category: cat.slug,
            status: { $ne: 'draft' },
            locale: locale,
          }),
          Article.findOne({
            category: cat.slug,
            status: "published",
            locale: locale,
          })
            .sort({ date: -1 })
            .select("articleMedia heroImage image content_type slug")
            .lean(),
        ]);

        const latestImage =
          (latestArticle as any)?.articleMedia?.heroCoverMedia?.url ||
          (latestArticle as any)?.heroImage ||
          (latestArticle as any)?.image ||
          "";
        
        return {
          slug: cat.slug,
          label: cat.label,
          color: cat.color || "#64748b",
          count: count,
          locale: cat.locale,
          footerLabel: cat.footerLabel || "",
          latestImage,
        };
      })
    );

    categoriesWithCounts.sort((a, b) => b.count - a.count);

    return NextResponse.json(categoriesWithCounts);

  } catch (error: any) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}
