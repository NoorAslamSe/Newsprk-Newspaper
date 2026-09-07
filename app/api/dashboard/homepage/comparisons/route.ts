import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Article } from "@/lib/models/Article";
import { DEPLOYMENT_LOCALE } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();

    const comparisons = await Article.find(
      {
        content_type: { $in: ["comparison", "review"] },
        status: "published",
        locale: DEPLOYMENT_LOCALE,
      },
      {
        _id: 1,
        title: 1,
        slug: 1,
        image: 1,
        category: 1,
        "entity_A.name": 1,
        "entity_A.image": 1,
        "entity_B.name": 1,
        "entity_B.image": 1,
      }
    )
      .sort({ date: -1 })
      .lean();

    const items = comparisons.map((c: any) => ({
      _id: c._id.toString(),
      title: c.title,
      slug: c.slug,
      image: c.image || c.entity_A?.image || "",
      category: c.category,
      entity_A: { name: c.entity_A?.name || "", image: c.entity_A?.image || "" },
      entity_B: { name: c.entity_B?.name || "", image: c.entity_B?.image || "" },
    }));

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("Error fetching comparisons for homepage:", error);
    return NextResponse.json(
      { error: "Failed to fetch comparisons", details: error.message },
      { status: 500 }
    );
  }
}
