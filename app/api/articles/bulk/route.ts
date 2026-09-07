import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Article } from "@/lib/models/Article";
import { requirePermission } from "@/lib/auth/server";

export async function DELETE(request: Request) {
  try {
    await requirePermission("articles.create");
    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Invalid IDs" }, { status: 400 });
    }

    await connectDB();

    await Article.deleteMany({ _id: { $in: ids } });
    return NextResponse.json({ success: true, count: ids.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await requirePermission("articles.create");
    const { ids, status } = await request.json();
    
    if (status === "published") {
      await requirePermission("articles.publish");
    }

    if (!Array.isArray(ids) || ids.length === 0 || !status) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    await connectDB();

    await Article.updateMany(
      { _id: { $in: ids } },
      { $set: { status } }
    );
    return NextResponse.json({ success: true, count: ids.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
