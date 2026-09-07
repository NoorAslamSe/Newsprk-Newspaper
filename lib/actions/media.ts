'use server';

import { connectDB } from "@/lib/db";
import { Media } from "@/lib/models/Media";
import { Types } from "mongoose";
import { getSession } from "@/lib/auth/server";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PresignedUrlRequestSchema, FileMetadataSchema } from "@/lib/validations/upload";
import type { PresignedUrlResponse, UploadProvider } from "@/lib/types/upload";
import { recordUploadSuccess } from "@/lib/utils/uploadAnalytics";
import { syncMediaFolderAction } from "./mediaDiscovery";

const MAX_BYTES = 25 * 1024 * 1024; // 25MB

const ALLOWED_MIME_TYPES = [
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
  "video/quicktime",
  "audio/mp3",
  "audio/mpeg",
  "audio/wav",
  "audio/aac",
  "audio/ogg",
];

export async function uploadMediaAction(formData: FormData): Promise<{ success: boolean; item?: any; error?: string }> {
  throw new Error("uploadMediaAction is deprecated. All uploads are now directly handled via CDN Presigned URLs.");
}

/**
 * Save media metadata after successful upload
 * 
 * Validates: Requirements 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 26.3
 * 
 * @param metadata - Media metadata input containing file information and provider details
 * @returns Created MediaItem or error
 */
export async function saveMediaMetadataAction(
  metadata: unknown
): Promise<{ success: true; data: any } | { success: false; error: string }> {
  try {
    // Requirement 26.3: Validate user authentication
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized: Authentication required" };
    }

    // Validate input using FileMetadataSchema
    const validationResult = FileMetadataSchema.safeParse(metadata);
    if (!validationResult.success) {
      const errorMessages = validationResult.error?.issues
        ? validationResult.error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
        : 'Validation failed';
      return { 
        success: false, 
        error: `Invalid metadata: ${errorMessages}` 
      };
    }

    const validatedMetadata = validationResult.data;

    // Connect to MongoDB
    await connectDB();

    // Validate and convert user ID to ObjectId
    let uploadedByObjectId: Types.ObjectId;
    try {
      uploadedByObjectId = Types.ObjectId.isValid(session.user.id)
        ? new Types.ObjectId(session.user.id)
        : new Types.ObjectId(); // Fallback to new ObjectId if invalid
    } catch (error) {
      return {
        success: false,
        error: 'Invalid user ID format',
      };
    }

    // Prepare media document data
    const mediaData: any = {
      filename: validatedMetadata.filename,
      mimeType: validatedMetadata.mimeType,
      size: validatedMetadata.size,
      url: (metadata as any).url,
      provider: (metadata as any).provider,
      variants: (metadata as any).variants || {
        original: (metadata as any).url,
        thumbnail: null,
        medium: null,
      },
      alt: validatedMetadata.alt || '',
      metadata: (metadata as any).metadata || {},
      tags: validatedMetadata.tags || [],
      folder: validatedMetadata.folder || 'uploads',
      uploadedBy: uploadedByObjectId,
    };

    // Add provider-specific fields
    if ((metadata as any).provider === 'cdn') {
      if ((metadata as any).cdnKey) {
        mediaData.cdnKey = (metadata as any).cdnKey;
      }
      if ((metadata as any).cdnBucket) {
        mediaData.cdnBucket = (metadata as any).cdnBucket;
      }
    } else if ((metadata as any).provider === 'supabase') {
      if ((metadata as any).objectPath) {
        mediaData.objectPath = (metadata as any).objectPath;
      }
      if ((metadata as any).bucket) {
        mediaData.bucket = (metadata as any).bucket;
      }
      if ((metadata as any).publicUrl) {
        mediaData.publicUrl = (metadata as any).publicUrl;
      }
    }

    // Add ad-specific fields if present
    if (validatedMetadata.vastTag) {
      mediaData.vastTag = validatedMetadata.vastTag;
    }
    if (validatedMetadata.adTiming) {
      mediaData.adTiming = validatedMetadata.adTiming;
    }

    // Create Media document
    const created = await Media.create(mediaData);

    // Track analytics 
    try {
      await recordUploadSuccess(
        created.provider as UploadProvider,
        created.mimeType,
        created.size,
        1500 // Generic estimated time in ms
      );
    } catch (e) {
      console.error("Analytics tracking failed:", e);
    }

    // Return created media item
    return {
      success: true,
      data: {
        _id: created._id.toString(),
        filename: created.filename,
        mimeType: created.mimeType,
        size: created.size,
        url: created.url,
        provider: created.provider,
        variants: created.variants,
        alt: created.alt,
        metadata: created.metadata,
        tags: created.tags,
        folder: created.folder,
        cdnKey: created.cdnKey,
        cdnBucket: created.cdnBucket,
        objectPath: created.objectPath,
        publicUrl: created.publicUrl,
        bucket: created.bucket,
        vastTag: created.vastTag,
        adTiming: created.adTiming,
        uploadedBy: created.uploadedBy,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      },
    };
  } catch (error) {
    // Handle database errors
    console.error('Error saving media metadata:', error);
    
    // Attempt to cleanup uploaded file on failure
    try {
      const metadataObj = metadata as any;
    } catch (cleanupError) {
      console.error('Error cleaning up uploaded file:', cleanupError);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save media metadata',
    };
  }
}

/**
 * Generate presigned URL for CDN uploads
 * 
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 25.1, 25.2, 25.3, 25.4, 26.2
 * 
 * @param request - Presigned URL request containing filename, contentType, and folder
 * @returns Presigned URL, object key, and expiration time
 */
export async function generatePresignedUrlAction(
  request: unknown
): Promise<{ success: true; data: PresignedUrlResponse } | { success: false; error: string }> {
  try {
    // Requirement 26.2: Validate user authentication
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized: Authentication required" };
    }

    // Validate input using Zod schema
    const validationResult = PresignedUrlRequestSchema.safeParse(request);
    if (!validationResult.success) {
      const errorMessages = validationResult.error?.issues
        ? validationResult.error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
        : 'Validation failed';
      return { 
        success: false, 
        error: `Invalid request: ${errorMessages}` 
      };
    }

    const { filename, contentType, folder } = validationResult.data;

    // Requirement 25.2: Use environment variables for access credentials
    const region = process.env.AWS_REGION || process.env.R2_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;
    const bucket = process.env.AWS_S3_BUCKET || process.env.R2_BUCKET;
    const endpoint = process.env.R2_ENDPOINT; // Optional: for Cloudflare R2

    if (!accessKeyId || !secretAccessKey || !bucket) {
      console.error('Missing CDN configuration:', { 
        hasAccessKeyId: !!accessKeyId, 
        hasSecretAccessKey: !!secretAccessKey, 
        hasBucket: !!bucket 
      });
      return { 
        success: false, 
        error: "CDN configuration error: Missing required environment variables" 
      };
    }

    // Requirement 25.1: Use AWS SDK (compatible with both S3 and Cloudflare R2)
    const s3Client = new S3Client({
      region: region || 'auto',
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      ...(endpoint && { endpoint }), // Use custom endpoint for R2
    });

    // Requirement 3.3: Include folder path in object key
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `${folder}/${timestamp}-${sanitizedFilename}`;

    // Requirement 25.4: Include Content-Type in presigned URL parameters
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });

    // Requirement 3.4: Set URL expiration to 3600 seconds (1 hour)
    const expiresIn = 3600;
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn });

    // Requirement 3.5: Return both presigned URL and object key
    return {
      success: true,
      data: {
        url: presignedUrl,
        key,
        expiresIn,
      },
    };
  } catch (error) {
    // Requirement 25.5: Handle S3/R2 API errors gracefully
    console.error('Error generating presigned URL:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate presigned URL',
    };
  }
}

/**
 * Generate a signed upload URL for Supabase using the Service Role key.
 * This bypasses RLS and allows secure uploads directly from the browser.
 */
export async function generateSupabaseSignedUrlAction(request: { filename: string; contentType: string; folder?: string }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      console.error("[generateSupabaseSignedUrlAction] Unauthorized. Session state:", JSON.stringify(session));
      return { 
        success: false, 
        error: "Unauthorized: Your Next-Auth session is missing or expired. Please refresh the page and log in again." 
      };
    }
    
    // Import here to avoid edge/server conflicts at the top level
    const { getSupabaseAdminClient } = await import("@/lib/storage/supabase");
    const adminClient = getSupabaseAdminClient();
    const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || process.env.SUPABASE_STORAGE_BUCKET || 'media';
    
    const timestamp = Date.now();
    const sanitizedFilename = request.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const folderPath = request.folder ? `${request.folder}/` : '';
    const objectPath = `${folderPath}${timestamp}-${sanitizedFilename}`;

    const { data, error } = await adminClient.storage.from(bucket).createSignedUploadUrl(objectPath);

    if (error) {
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      data: { 
        signedUrl: data.signedUrl,
        token: data.token,
        objectPath, 
        bucket 
      } 
    };
  } catch (error) {
    console.error('Error generating Supabase signed url:', error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to generate signed url" };
  }
}

/**
 * Delete media from storage and database
 * 
 * Validates: Requirements 14.3, 14.4, 26.5
 * 
 * @param mediaId - ID of the media to delete
 * @returns Success status and optional message
 */
export async function deleteMediaAction(
  mediaId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    // Requirement 26.5: Validate user authentication
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized: Authentication required" };
    }

    // Validate mediaId format
    if (!Types.ObjectId.isValid(mediaId)) {
      return { success: false, error: "Invalid media ID format" };
    }

    // Connect to MongoDB
    await connectDB();

    // Fetch media document
    const media = await Media.findById(mediaId);
    if (!media) {
      return { success: false, error: "Media not found" };
    }

    // Requirement 26.5: Check authorization - user must be admin OR file owner
    const userRoles = (session.user.roles ?? []) as string[];
    const isAdmin = userRoles.includes('admin');
    const isOwner = media.uploadedBy && media.uploadedBy.toString() === session.user.id;

    if (!isAdmin && !isOwner) {
      return { 
        success: false, 
        error: "Forbidden: You must be an admin or the file owner to delete this media" 
      };
    }

    // Requirement 14.4: Delete from storage provider based on provider field
    try {
      if (media.provider === 'supabase' && media.objectPath && media.bucket) {
        const { getSupabaseAdminClient } = await import("@/lib/storage/supabase");
        const adminClient = getSupabaseAdminClient();
        const { error } = await adminClient.storage.from(media.bucket).remove([media.objectPath]);
        if (error) {
          console.error("Error deleting from Supabase:", error);
        } else {
          // Supabase delete success log removed
        }
      } else if (media.provider === 'cdn' && media.cdnKey) {
        // Delete from S3/R2 using SDK
        const region = process.env.AWS_REGION || process.env.R2_REGION;
        const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
        const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;
        const bucket = media.cdnBucket || process.env.AWS_S3_BUCKET || process.env.R2_BUCKET;
        const endpoint = process.env.R2_ENDPOINT;

        if (!accessKeyId || !secretAccessKey || !bucket) {
          console.error('Missing CDN configuration for deletion');
          return { 
            success: false, 
            error: "CDN configuration error: Cannot delete file from storage" 
          };
        }

        const s3Client = new S3Client({
          region: region || 'auto',
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
          ...(endpoint && { endpoint }),
        });

        const deleteCommand = new DeleteObjectCommand({
          Bucket: bucket,
          Key: media.cdnKey,
        });

        await s3Client.send(deleteCommand);
        // CDN delete success log removed
      } else {
        console.warn(`Media ${mediaId} has no valid storage provider information`);
      }
    } catch (storageError) {
      console.error('Error deleting from storage provider:', storageError);
      // Continue with database deletion even if storage deletion fails
      // This prevents orphaned database records
    }

    // Requirement 14.4: Delete from MongoDB
    await Media.findByIdAndDelete(mediaId);
    // Db delete success log removed

    return { success: true };
  } catch (error) {
    console.error('Error in deleteMediaAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete media',
    };
  }
}

/**
 * Bulk delete media from storage and database
 * 
 * Validates: Requirements 14.3, 14.4, 26.5
 * 
 * @param mediaIds - Array of media IDs to delete
 * @returns Success status, deleted count, and optional failed IDs
 */
export async function bulkDeleteMediaAction(
  mediaIds: string[]
): Promise<{ 
  success: boolean; 
  deletedCount: number; 
  failedIds?: string[]; 
  message?: string 
}> {
  try {
    // Requirement 26.5: Validate user authentication
    const session = await getSession();
    if (!session?.user?.id) {
      return { 
        success: false, 
        deletedCount: 0, 
        message: "Unauthorized: Authentication required" 
      };
    }

    // Validate input
    if (!Array.isArray(mediaIds) || mediaIds.length === 0) {
      return { 
        success: false, 
        deletedCount: 0, 
        message: "Invalid input: mediaIds must be a non-empty array" 
      };
    }

    // Connect to MongoDB
    await connectDB();

    let deletedCount = 0;
    const failedIds: string[] = [];
    const userRoles = (session.user.roles ?? []) as string[];
    const isAdmin = userRoles.includes('admin');

    // Process each media item
    for (const mediaId of mediaIds) {
      try {
        // Validate mediaId format
        if (!Types.ObjectId.isValid(mediaId)) {
          console.warn(`Invalid media ID format: ${mediaId}`);
          failedIds.push(mediaId);
          continue;
        }

        // Fetch media document
        const media = await Media.findById(mediaId);
        if (!media) {
          console.warn(`Media not found: ${mediaId}`);
          failedIds.push(mediaId);
          continue;
        }

        // Requirement 26.5: Check authorization - user must be admin OR file owner
        const isOwner = media.uploadedBy && media.uploadedBy.toString() === session.user.id;

        if (!isAdmin && !isOwner) {
          console.warn(`Unauthorized to delete media: ${mediaId}`);
          failedIds.push(mediaId);
          continue;
        }

        // Requirement 14.4: Delete from storage provider based on provider field
        try {
          if (media.provider === 'supabase' && media.objectPath && media.bucket) {
            const { getSupabaseAdminClient } = await import("@/lib/storage/supabase");
            const adminClient = getSupabaseAdminClient();
            const { error } = await adminClient.storage.from(media.bucket).remove([media.objectPath]);
            if (error) {
              console.error(`Error deleting from Supabase for ${mediaId}:`, error);
            } else {
              // Supabase delete success log removed
            }
          } else if (media.provider === 'cdn' && media.cdnKey) {
            // Delete from S3/R2 using SDK
            const region = process.env.AWS_REGION || process.env.R2_REGION;
            const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
            const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;
            const bucket = media.cdnBucket || process.env.AWS_S3_BUCKET || process.env.R2_BUCKET;
            const endpoint = process.env.R2_ENDPOINT;

            if (!accessKeyId || !secretAccessKey || !bucket) {
              console.error(`Missing CDN configuration for deletion: ${mediaId}`);
              failedIds.push(mediaId);
              continue;
            }

            const s3Client = new S3Client({
              region: region || 'auto',
              credentials: {
                accessKeyId,
                secretAccessKey,
              },
              ...(endpoint && { endpoint }),
            });

            const deleteCommand = new DeleteObjectCommand({
              Bucket: bucket,
              Key: media.cdnKey,
            });

            await s3Client.send(deleteCommand);
            // CDN delete success log removed
          } else {
            console.warn(`Media ${mediaId} has no valid storage provider information`);
          }
        } catch (storageError) {
          console.error(`Error deleting from storage provider for ${mediaId}:`, storageError);
          // Continue with database deletion even if storage deletion fails
          // This prevents orphaned database records
        }

        // Requirement 14.4: Delete from MongoDB
        await Media.findByIdAndDelete(mediaId);
        // Db delete success log removed
        deletedCount++;

      } catch (itemError) {
        console.error(`Error deleting media ${mediaId}:`, itemError);
        failedIds.push(mediaId);
      }
    }

    // Prepare response
    const totalRequested = mediaIds.length;
    const allSucceeded = deletedCount === totalRequested;

    return {
      success: allSucceeded,
      deletedCount,
      ...(failedIds.length > 0 && { failedIds }),
      message: allSucceeded 
        ? `Successfully deleted ${deletedCount} media item${deletedCount !== 1 ? 's' : ''}`
        : `Deleted ${deletedCount} of ${totalRequested} media items. ${failedIds.length} failed.`
    };

  } catch (error) {
    console.error('Error in bulkDeleteMediaAction:', error);
    return {
      success: false,
      deletedCount: 0,
      message: error instanceof Error ? error.message : 'Failed to delete media items',
    };
  }
}
/**
 * Get storage statistics for media library
 * 
 * Validates: Requirements 30.1, 30.2, 30.5
 * 
 * @returns Storage statistics by provider and total
 */
export async function getStorageStatsAction(): Promise<{ 
  success: true; 
  data: {
    cdn: { count: number; totalSize: number };
    total: { count: number; totalSize: number };
  }
} | { success: false; error: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }
    
    // Connect to MongoDB
    await connectDB();

    const userRoles = (session.user.roles ?? []) as string[];
    const isAdmin = userRoles.includes('admin');
    
    // Build match stage for user isolation
    const matchStage: any = {};
    if (!isAdmin) {
      matchStage.uploadedBy = Types.ObjectId.isValid(session.user.id) ? new Types.ObjectId(session.user.id) : new Types.ObjectId();
    }

    // Aggregate storage statistics by provider
    const stats = await Media.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$provider",
          count: { $sum: 1 },
          totalSize: { $sum: "$size" }
        }
      }
    ]);

    // Initialize default stats
    const result = {
      cdn: { count: 0, totalSize: 0 },
      total: { count: 0, totalSize: 0 }
    };

    // Process aggregation results
    for (const stat of stats) {
      if (stat._id === 'cdn') {
        result.cdn = {
          count: stat.count,
          totalSize: stat.totalSize
        };
      }
    }

    // Calculate totals
    result.total = {
      count: result.cdn.count,
      totalSize: result.cdn.totalSize
    };

    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('Error fetching storage statistics:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch storage statistics'
    };
  }
}

/**
 * Get media items with filtering and pagination
 * 
 * Validates: Requirements 13.2, 13.4, 13.5
 * 
 * @param options - Filter and pagination options
 * @returns Filtered media items with pagination info
 */
export async function getMediaAction(options: {
  search?: string;
  type?: 'all' | 'images' | 'videos' | 'ads';
  page?: number;
  limit?: number;
}): Promise<{ 
  success: true; 
  data: {
    items: any[];
    total: number;
    filteredCount: number;
    page: number;
    limit: number;
  }
} | { success: false; error: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }
    
    // Connect to MongoDB
    await connectDB();

    const { search = '', type = 'all', page = 1, limit = 50 } = options;

    const userRoles = (session.user.roles ?? []) as string[];
    const isAdmin = userRoles.includes('admin');

    // Build filter query
    const filter: any = {};
    if (!isAdmin) {
      filter.uploadedBy = Types.ObjectId.isValid(session.user.id) ? new Types.ObjectId(session.user.id) : new Types.ObjectId();
    }

    // Search filter
    if (search) {
      filter.filename = { $regex: search, $options: 'i' };
    }

    // Type filter
    if (type === 'images') {
      filter.mimeType = { $regex: '^image/' };
    } else if (type === 'videos') {
      filter.mimeType = { $regex: '^video/' };
    } else if (type === 'ads') {
      // Auto-sync if it's the first page and ads type
      if (page === 1 && !search) {
        try {
          await syncMediaFolderAction('ads');
        } catch (e) {
          console.warn("Auto-sync failed in getMediaAction", e);
        }
      }

      filter.$or = [
        { folder: { $regex: "ads", $options: "i" } },
        { bucket: { $regex: "ads", $options: "i" } },
        { objectPath: { $regex: "ads", $options: "i" } },
        { url: { $regex: "ads", $options: "i" } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute queries
    const [items, filteredCount, totalCount] = await Promise.all([
      Media.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Media.countDocuments(filter),
      Media.countDocuments({})
    ]);

    // Transform items for client
    const transformedItems = items.map(item => ({
      ...item,
      _id: item._id.toString(),
      uploadedBy: item.uploadedBy ? {
        _id: item.uploadedBy.toString(),
        name: null,
        email: null
      } : null,
      variants: {
        original: item.variants?.original || item.url,
        thumbnail: item.variants?.thumbnail || item.url,
        medium: item.variants?.medium || item.url,
      },
      // Add virtual fileType field
      fileType: item.mimeType.startsWith('image/') ? 'image' :
                 item.mimeType.startsWith('video/') ? 'video' :
                 item.mimeType.startsWith('audio/') ? 'audio' : 'file'
    }));

    return {
      success: true,
      data: {
        items: transformedItems,
        total: totalCount,
        filteredCount,
        page,
        limit
      }
    };
  } catch (error) {
    console.error('Error fetching media:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch media'
    };
  }
}