import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { SimpleCategory } from "@/lib/models/SimpleCategory";
import { Article } from "@/lib/models/Article";
import { DEPLOYMENT_LOCALE } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();

    const categories = await SimpleCategory.find({ locale: DEPLOYMENT_LOCALE }).lean();

    const categoriesWithLatest = await Promise.all(
      categories.map(async (cat: any) => {
        const [count, latestArticle] = await Promise.all([
          Article.countDocuments({
            category: cat.slug,
            status: { $ne: "draft" },
            locale: DEPLOYMENT_LOCALE,
          }),
          Article.findOne({
            category: cat.slug,
            status: "published",
            locale: DEPLOYMENT_LOCALE,
          })
            .sort({ date: -1 })
            .select("title slug excerpt image articleMedia authorName date readTime views content_type")
            .lean(),
        ]);

        return {
          slug: cat.slug,
          label: cat.label,
          color: cat.color || "#64748b",
          count,
          footerLabel: cat.footerLabel || "",
          latestArticle: latestArticle
            ? {
                title: (latestArticle as any).title,
                slug: (latestArticle as any).slug,
                excerpt: (latestArticle as any).excerpt,
                content_type: (latestArticle as any).content_type || "article",
                image:
                  (latestArticle as any).articleMedia?.heroCoverMedia?.url ||
                  (latestArticle as any).image ||
                  "",
                date: (latestArticle as any).date,
                authorName: (latestArticle as any).authorName,
                readTime: (latestArticle as any).readTime,
                views: (latestArticle as any).views || 0,
              }
            : null,
        };
      })
    );

    categoriesWithLatest.sort((a, b) => b.count - a.count);

    return NextResponse.json(categoriesWithLatest);
  } catch (error: any) {
    console.error("Error fetching categories with latest:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories", details: error.message },
      { status: 500 }
    );
  }
}
