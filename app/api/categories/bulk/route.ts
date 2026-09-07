import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { SimpleCategory } from "@/lib/models/SimpleCategory";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request) {
  try {
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json(
        { error: "Invalid ids provided" },
        { status: 400 }
      );
    }

    await connectDB();

    // Convert string IDs to ObjectIds
    const objectIds = ids.map(id => new ObjectId(id));

    const result = await SimpleCategory.deleteMany({
      _id: { $in: objectIds }
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount
    });

  } catch (error: any) {
    console.error("Error deleting categories:", error);
    return NextResponse.json(
      { error: "Failed to delete categories", details: error.message },
      { status: 500 }
    );
  }
}