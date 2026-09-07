import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Article } from "@/lib/models/Article";
import { DEPLOYMENT_LOCALE } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();

    // Get all tags from articles matching the current locale, and count their usage
    const tagCounts = await Article.aggregate([
      { $match: { status: { $ne: 'draft' }, locale: DEPLOYMENT_LOCALE } }, // Exclude draft articles, match locale
      { $unwind: "$tags" }, // Separate each tag into its own document
      { 
        $group: { 
          _id: "$tags", 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { count: -1 } }, // Sort by count descending
      { $limit: 50 }, // Get top 50 tags
      {
        $project: {
          tag: "$_id",
          count: 1,
          _id: 0
        }
      }
    ]);

    return NextResponse.json(tagCounts);

  } catch (error: any) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch tags", details: error.message },
      { status: 500 }
    );
  }
}