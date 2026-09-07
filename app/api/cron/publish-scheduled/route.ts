import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Article } from "@/lib/models/Article";
import { toApiError } from "@/lib/api/errors";

// Publishes any articles whose status is "scheduled".
// Article schema does not use a publishedAt timestamp field;
// scheduling is handled externally before setting status="scheduled".
export async function POST() {
  try {
    await connectDB();
    const res = await Article.updateMany(
      { status: "scheduled" },
      { $set: { status: "published" } }
    );
    return NextResponse.json({ ok: true, modified: res.modifiedCount });
  } catch (err) {
    return NextResponse.json(toApiError(err), { status: 500 });
  }
}
