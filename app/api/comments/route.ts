import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Comment } from "@/lib/models/Comment";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const articleSlug = req.nextUrl.searchParams.get("articleSlug");
  if (!articleSlug) {
    return NextResponse.json({ error: "articleSlug required" }, { status: 400 });
  }

  await connectDB();

  const comments = await Comment.find({ articleSlug })
    .sort({ createdAt: -1 })
    .lean();

  const avgResult = await Comment.aggregate([
    { $match: { articleSlug } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  const averageRating = avgResult.length > 0 ? Math.round(avgResult[0].avg * 10) / 10 : 0;
  const totalComments = avgResult.length > 0 ? avgResult[0].count : 0;

  return NextResponse.json({ comments, averageRating, totalComments });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { articleSlug, authorName, content, rating, parentCommentId } = body;

  if (!articleSlug || !authorName || !content || !rating) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (typeof rating !== "number" || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
  }

  if (authorName.trim().length > 50) {
    return NextResponse.json({ error: "Name too long" }, { status: 400 });
  }

  if (content.trim().length > 2000) {
    return NextResponse.json({ error: "Comment too long (max 2000 characters)" }, { status: 400 });
  }

  await connectDB();

  const comment = await Comment.create({
    articleSlug,
    authorName: authorName.trim(),
    content: content.trim(),
    rating: Math.round(rating),
    parentCommentId: parentCommentId || null,
  });

  return NextResponse.json({ comment }, { status: 201 });
}
