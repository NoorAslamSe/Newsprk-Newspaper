import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Media } from "@/lib/models/Media";
import { MediaUpdateSchema } from "@/lib/validations/media";
import { toApiError } from "@/lib/api/errors";
import { requirePermission } from "@/lib/auth/server";
import { MediaDeletionService } from "@/lib/services/mediaDeletion";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid media id." }, { status: 400 });
    }
    
    const media = await Media.findById(id)
      .populate("uploadedBy", "name email")
      .lean();
    
    if (!media) {
      return NextResponse.json({ error: "Media not found." }, { status: 404 });
    }
    
    return NextResponse.json({ item: media });
  } catch (err) {
    const apiError = toApiError(err);
    return NextResponse.json(apiError, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission("media.upload");
    await connectDB();
    const { id } = await params;
    
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid media id." }, { status: 400 });
    }
    
    const media = await Media.findById(id);
    if (!media) {
      return NextResponse.json({ error: "Media not found." }, { status: 404 });
    }
    
    const body = MediaUpdateSchema.parse(await req.json());
    
    // Update allowed fields
    if (body.alt !== undefined) media.alt = body.alt;
    if (body.metadata !== undefined) media.set("metadata", body.metadata);
    
    // Handle new fields if they exist in the schema
    if ('tags' in body && body.tags !== undefined) media.tags = body.tags;
    if ('folder' in body && body.folder !== undefined) media.folder = body.folder;
    
    await media.save();
    
    const updatedMedia = await Media.findById(id)
      .populate("uploadedBy", "name email")
      .lean();
    
    return NextResponse.json({ item: updatedMedia });
  } catch (err) {
    const apiError = toApiError(err);
    const status =
      apiError.error === "Validation error" ? 400 : 
      apiError.error === "Unauthorized" ? 401 : 500;
    return NextResponse.json(apiError, { status });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("media.upload");
    await connectDB();
    const { id } = await params;
    
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid media id." }, { status: 400 });
    }
    
    const { searchParams } = new URL(req.url);
    const force = searchParams.get('force') === 'true';
    
    let result;
    if (force) {
      result = await MediaDeletionService.forceDeleteMedia(id);
    } else {
      result = await MediaDeletionService.deleteMediaWithUsageCheck(id);
    }
    
    if (!result.success) {
      const status = result.errors.some(e => e.includes('in use')) ? 409 : 500;
      return NextResponse.json({
        error: result.errors.join('; '),
        usageWarnings: 'usageWarnings' in result ? result.usageWarnings : undefined,
      }, { status });
    }
    
    return NextResponse.json({ 
      message: "Media deleted successfully",
      deletedId: id 
    });
  } catch (err) {
    const apiError = toApiError(err);
    const status = apiError.error === "Unauthorized" ? 401 : 500;
    return NextResponse.json(apiError, { status });
  }
}

