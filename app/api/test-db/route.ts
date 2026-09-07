import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Media } from "@/lib/models/Media";
import { toApiError } from "@/lib/api/errors";

export async function GET() {
  try {
    await connectDB();
    
    // Simple test query
    const count = await Media.countDocuments({});
    const firstItem = await Media.findOne({}).lean();
    
    return NextResponse.json({
      success: true,
      totalCount: count,
      hasItems: count > 0,
      firstItem: firstItem ? {
        id: firstItem._id.toString(),
        filename: firstItem.filename,
        url: firstItem.url
      } : null
    });
  } catch (error) {
    console.error('Database test error:', error);
    const apiError = toApiError(error);
    return NextResponse.json({
      success: false,
      error: apiError.error
    }, { status: 500 });
  }
}