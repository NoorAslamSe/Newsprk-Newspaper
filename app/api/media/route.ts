import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Media } from "@/lib/models/Media";
import { requirePermission } from "@/lib/auth/server";
import { toApiError } from "@/lib/api/errors";
import { MediaQuerySchema } from "@/lib/validations/media";
import { Types } from "mongoose";

export const runtime = "nodejs";
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_BYTES = 25 * 1024 * 1024; // 25MB

function isAllowedMime(mime: string) {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "video/mp4",
    "video/webm",
    "video/avi",
    "video/mov",
    "video/quicktime", // For .mov files
    "audio/mp3",
    "audio/mpeg", // For .mp3 files
    "audio/wav",
    "audio/aac",
    "audio/ogg",
  ];
  
  // MIME check silent
  return allowedTypes.includes(mime);
}

import { syncMediaFolderAction } from "@/lib/actions/mediaDiscovery";

export async function GET(req: Request) {
  try {
    await requirePermission("media.view");
    await connectDB();
    
    const url = new URL(req.url);
    const query = MediaQuerySchema.parse({
      page: url.searchParams.get("page"),
      limit: url.searchParams.get("limit"),
      q: url.searchParams.get("q") ?? undefined,
      type: url.searchParams.get("type") ?? undefined,
    });

    // Auto-sync for ads if on first page and no search query
    if (query.type === "ads" && query.page === 1 && !query.q) {
      try {
        await syncMediaFolderAction('ads');
      } catch (syncErr) {
        console.warn("Auto-sync failed in media API:", syncErr);
      }
    }

    // Simple filter
    const filter: Record<string, unknown> = {};
    if (query.q) {
      filter.filename = { $regex: query.q, $options: "i" };
    }
    if (query.type === "image") filter.mimeType = { $regex: "^image/" };
    if (query.type === "video") filter.mimeType = { $regex: "^video/" };
    if (query.type === "audio") filter.mimeType = { $regex: "^audio/" };
    if (query.type === "ads") {
      filter.$or = [
        { folder: { $regex: "ads", $options: "i" } },
        { bucket: { $regex: "ads", $options: "i" } },
        { objectPath: { $regex: "ads", $options: "i" } },
        { url: { $regex: "ads", $options: "i" } }
      ];
    }
    const skip = (query.page - 1) * query.limit;
    
    // Simplified query without populate to avoid potential issues
    const [items, total] = await Promise.all([
      Media.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(query.limit)
        .lean(),
      Media.countDocuments(filter),
    ]);

    // Proper serialization - convert all non-plain values
    const transformedItems = items.map(item => {
      const i = item as any;
      // Compute fileType from mimeType so MediaCard can distinguish image/video/audio
      const mimeType: string = i.mimeType || '';
      const fileType = mimeType.startsWith('image/')
        ? 'image'
        : mimeType.startsWith('video/')
        ? 'video'
        : mimeType.startsWith('audio/')
        ? 'audio'
        : 'other';

      return {
        ...i,
        _id: i._id?.toString?.() ?? String(i._id),
        fileType,
        uploadedBy: i.uploadedBy
          ? (typeof i.uploadedBy === 'object' && i.uploadedBy._id
              ? { _id: i.uploadedBy._id.toString(), name: i.uploadedBy.name, email: i.uploadedBy.email }
              : i.uploadedBy.toString())
          : null,
        createdAt: i.createdAt instanceof Date ? i.createdAt.toISOString() : String(i.createdAt ?? ''),
        updatedAt: i.updatedAt instanceof Date ? i.updatedAt.toISOString() : String(i.updatedAt ?? ''),
        // Guarantee metadata is always a plain object (never undefined)
        metadata: {
          width: i.metadata?.width ?? null,
          height: i.metadata?.height ?? null,
          duration: i.metadata?.duration ?? null,
          format: i.metadata?.format ?? null,
          colorSpace: i.metadata?.colorSpace ?? null,
          bitrate: i.metadata?.bitrate ?? null,
          frameRate: i.metadata?.frameRate ?? null,
          codec: i.metadata?.codec ?? null,
          sampleRate: i.metadata?.sampleRate ?? null,
          channels: i.metadata?.channels ?? null,
        },
        variants: {
          original: i.variants?.original || i.url,
          thumbnail: i.variants?.thumbnail || null,
          medium: i.variants?.medium || null,
        }
      };
    });

    // Simple storage calculation
    const storageUsedBytes = items.reduce((total, item) => total + (item.size || 0), 0);

    return NextResponse.json({
      items: transformedItems,
      total,
      page: query.page,
      limit: query.limit,
      storageUsedBytes,
    });
  } catch (err) {
    console.error('Media API Error:', err);
    const apiError = toApiError(err);
    const status = apiError.error === "Validation error" ? 400 : 500;
    return NextResponse.json(apiError, { status });
  }
}

// POST endpoint removed in favor of Server Actions (Client-side Direct Uploads to Cloudinary/CDN)
