import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Article } from "@/lib/models/Article";
import { SimpleCategory } from "@/lib/models/SimpleCategory";
import { DEPLOYMENT_LOCALE } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();

    const localeFilter = { locale: DEPLOYMENT_LOCALE };

    // Get basic metrics — scoped to current locale
    const [
      totalPosts,
      publishedPosts,
      draftPosts,
      totalCategories,
      totalViews
    ] = await Promise.all([
      Article.countDocuments(localeFilter),
      Article.countDocuments({ ...localeFilter, status: "published" }),
      Article.countDocuments({ ...localeFilter, status: "draft" }),
      SimpleCategory.countDocuments({ locale: DEPLOYMENT_LOCALE }),
      Article.aggregate([
        { $match: localeFilter },
        { $group: { _id: null, totalViews: { $sum: "$views" } } }
      ]).then(result => result[0]?.totalViews || 0)
    ]);

    // Get recent posts — scoped to current locale
    const recentPosts = await Article.find(localeFilter)
      .sort({ date: -1 })
      .limit(5)
      .select('title slug status date views')
      .lean();

    // Get popular posts — scoped to current locale
    const popularPosts = await Article.find({ ...localeFilter, status: "published" })
      .sort({ views: -1 })
      .limit(5)
      .select('title slug views')
      .lean();

    // Get posts by category — scoped to current locale
    const postsByCategory = await Article.aggregate([
      { $match: { ...localeFilter, status: "published" } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    return NextResponse.json({
      overview: {
        totalPosts,
        publishedPosts,
        draftPosts,
        totalCategories,
        totalViews
      },
      recentPosts: recentPosts.map(post => ({
        _id: post._id.toString(),
        title: post.title,
        slug: post.slug,
        status: post.status,
        date: post.date,
        views: post.views || 0
      })),
      popularPosts: popularPosts.map(post => ({
        _id: post._id.toString(),
        title: post.title,
        slug: post.slug,
        views: post.views || 0
      })),
      postsByCategory: postsByCategory.map(item => ({
        category: item._id || 'uncategorized',
        count: item.count
      }))
    });

  } catch (error: any) {
    console.error("Error fetching dashboard metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics", details: error.message },
      { status: 500 }
    );
  }
}