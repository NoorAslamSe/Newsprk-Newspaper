import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { SimpleCategory } from "@/lib/models/SimpleCategory";
import { Article } from "@/lib/models/Article";
import { ObjectId } from "mongodb";
import { DEPLOYMENT_LOCALE } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await connectDB();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid category ID" }, { status: 400 });
    }

    const category = await SimpleCategory.findById(id).lean();
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const c = category as any;
    const articleCount = await Article.countDocuments({
      category: c.slug,
      status: { $ne: "draft" },
      locale: DEPLOYMENT_LOCALE,
    });

    return NextResponse.json({
      _id: c._id.toString(),
      name: c.label,
      slug: c.slug,
      parent: null,
      color: c.color || "#64748b",
      footerLabel: c.footerLabel || "",
      articleCount,
    });
  } catch (error: any) {
    console.error("Error fetching category:", error);
    return NextResponse.json({ error: "Failed to fetch category" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    await connectDB();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid category ID" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (body.name !== undefined) {
      updateData.label = body.name;
      updateData.slug = body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }
    if (body.color !== undefined) {
      updateData.color = body.color;
    }
    // Optional footer badge label (e.g. "Hot", "Trend")
    if (body.footerLabel !== undefined) {
      updateData.footerLabel = body.footerLabel;
    }

    const updatedCategory = await SimpleCategory.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, lean: true }
    );

    if (!updatedCategory) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    const c = updatedCategory as any;
    return NextResponse.json({
      _id: c._id.toString(),
      name: c.label,
      slug: c.slug,
      parent: null,
      color: c.color,
      footerLabel: c.footerLabel || "",
    });
  } catch (error: any) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Failed to update category", details: error.message },
      { status: 500 }
    );
  }
}