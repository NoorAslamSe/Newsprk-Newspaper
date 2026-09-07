import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { SimpleCategory } from "@/lib/models/SimpleCategory";
import { DEPLOYMENT_LOCALE } from "@/lib/i18n";

export const dynamic = "force-dynamic";

function transformCategory(cat: any) {
  return {
    _id: cat._id,
    name: cat.label ?? cat.name,
    slug: cat.slug,
    parent: null,
    color: cat.color || "#64748b",
    footerLabel: cat.footerLabel || "",
  };
}

export async function GET() {
  try {
    await connectDB();

    const categories = await SimpleCategory.find({ locale: DEPLOYMENT_LOCALE }).lean();

    const transformedCategories = categories.map((cat: any) => transformCategory(cat));

    return NextResponse.json({ items: transformedCategories });
  } catch (error: any) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json();

    const slug = body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const categoryData = {
      slug,
      label: body.name,
      color: body.color || "#64748b",
      footerLabel: body.footerLabel || "",
      count: 0,
      locale: DEPLOYMENT_LOCALE,
    };

    const category = new SimpleCategory(categoryData);
    await category.save();

    return NextResponse.json({
      _id: category._id.toString(),
      name: category.label,
      slug: category.slug,
      parent: null,
      color: category.color,
      footerLabel: (category as any).footerLabel || "",
    });
  } catch (error: any) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category", details: error.message },
      { status: 500 }
    );
  }
}