import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requirePermission } from "@/lib/auth/server";
import { toApiError } from "@/lib/api/errors";
import { MediaDeletionService } from "@/lib/services/mediaDeletion";
import { z } from "zod";

const BulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1).max(50), // Limit to 50 items at once
  force: z.boolean().default(false), // Force delete even if in use
});

const BulkUpdateSchema = z.object({
  ids: z.array(z.string()).min(1).max(50),
  updates: z.object({
    tags: z.array(z.string()).optional(),
    alt: z.string().optional(),
    folder: z.string().optional(),
  }),
});

export async function DELETE(req: Request) {
  try {
    await requirePermission("media.upload");
    await connectDB();

    const body = BulkDeleteSchema.parse(await req.json());
    
    let result;
    if (body.force) {
      // Force delete - ignore usage
      const promises = body.ids.map(id => MediaDeletionService.forceDeleteMedia(id));
      const results = await Promise.all(promises);
      
      result = {
        totalRequested: body.ids.length,
        successCount: results.filter(r => r.success).length,
        failureCount: results.filter(r => !r.success).length,
        results: results.map((r, i) => ({
          id: body.ids[i],
          success: r.success,
          error: r.errors.join('; ') || undefined,
        })),
      };
    } else {
      // Regular bulk delete with usage checking
      result = await MediaDeletionService.bulkDeleteMedia(body.ids);
    }

    return NextResponse.json(result);
  } catch (err) {
    const apiError = toApiError(err);
    const status =
      apiError.error === "Validation error" ? 400 : 
      apiError.error === "Unauthorized" ? 401 : 500;
    return NextResponse.json(apiError, { status });
  }
}

export async function PATCH(req: Request) {
  try {
    await requirePermission("media.upload");
    await connectDB();

    const body = BulkUpdateSchema.parse(await req.json());
    
    // Import Media model here to avoid circular dependencies
    const { Media } = await import("@/lib/models/Media");
    
    const updateData: any = {};
    if (body.updates.tags !== undefined) updateData.tags = body.updates.tags;
    if (body.updates.alt !== undefined) updateData.alt = body.updates.alt;
    if (body.updates.folder !== undefined) updateData.folder = body.updates.folder;

    const result = await Media.updateMany(
      { _id: { $in: body.ids } },
      { $set: updateData }
    );

    return NextResponse.json({
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      success: result.modifiedCount > 0,
    });
  } catch (err) {
    const apiError = toApiError(err);
    const status =
      apiError.error === "Validation error" ? 400 : 
      apiError.error === "Unauthorized" ? 401 : 500;
    return NextResponse.json(apiError, { status });
  }
}

export async function POST(req: Request) {
  try {
    await requirePermission("media.upload");
    await connectDB();

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'preview-deletion') {
      const body = z.object({
        ids: z.array(z.string()).min(1).max(50),
      }).parse(await req.json());

      const preview = await MediaDeletionService.getDeletionPreview(body.ids);
      return NextResponse.json(preview);
    }

    if (action === 'cleanup-orphaned') {
      const result = await MediaDeletionService.cleanupOrphanedMedia();
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    const apiError = toApiError(err);
    const status =
      apiError.error === "Validation error" ? 400 : 
      apiError.error === "Unauthorized" ? 401 : 500;
    return NextResponse.json(apiError, { status });
  }
}