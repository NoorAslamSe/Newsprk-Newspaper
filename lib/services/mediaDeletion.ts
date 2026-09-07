import { connectDB } from '@/lib/db';
import { Media } from '@/lib/models/Media';

/**
 * MediaDeletionService — handles safe removal of Media documents.
 *
 * Architecture notes:
 *  - Cloudinary has been fully removed; the cloudinaryDeleted flag is a no-op stub
 *    retained to prevent regressions if Cloudinary is re-introduced.
 *  - deleteMediaWithUsageCheck() is the preferred safe path — it reads the media.usage
 *    array populated by the media upload system before allowing deletion.
 *  - forceDeleteMedia() bypasses the usage check for admin overrides.
 *  - getDeletionPreview() is used by the dashboard's bulk-select UI to show
 *    which files are safe to delete vs. still in use.
 */

/** Unified result shape for single-item deletion. */
export interface DeletionResult {
  success: boolean;
  deletedIds: string[];
  failedIds: string[];
  errors: string[];
}

/** Aggregated result shape for bulk deletion. */
export interface BulkDeletionResult {
  totalRequested: number;
  successCount: number;
  failureCount: number;
  results: Array<{
    id: string;
    success: boolean;
    error?: string;
  }>;
}

export class MediaDeletionService {
  /**
   * Delete a single media file from both database and Cloudinary
   */
  static async deleteMedia(mediaId: string): Promise<DeletionResult> {
    try {
      await connectDB();

      // Get media record from database
      const media = await Media.findById(mediaId);
      if (!media) {
        return {
          success: false,
          deletedIds: [],
          failedIds: [mediaId],
          errors: ['Media not found in database'],
        };
      }

      const errors: string[] = [];
      let cloudinaryDeleted = false;
      let databaseDeleted = false;

      // Cloudinary is deprecated — bypass flag is always true to allow DB deletion to proceed
      cloudinaryDeleted = true;

      // Delete from database
      try {
        await Media.findByIdAndDelete(mediaId);
        databaseDeleted = true;
      } catch (error) {
        errors.push(`Failed to delete from database: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      const success = cloudinaryDeleted && databaseDeleted;

      return {
        success,
        deletedIds: success ? [mediaId] : [],
        failedIds: success ? [] : [mediaId],
        errors,
      };
    } catch (error) {
      return {
        success: false,
        deletedIds: [],
        failedIds: [mediaId],
        errors: [`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  /**
   * Delete multiple media files in bulk
   */
  static async bulkDeleteMedia(mediaIds: string[]): Promise<BulkDeletionResult> {
    const results: Array<{ id: string; success: boolean; error?: string }> = [];
    
    try {
      await connectDB();

      // Get all media records
      const mediaRecords = await Media.find({ _id: { $in: mediaIds } });
      const foundIds = mediaRecords.map(m => m._id.toString());
      const notFoundIds = mediaIds.filter(id => !foundIds.includes(id));

      // Add not found results
      notFoundIds.forEach(id => {
        results.push({
          id,
          success: false,
          error: 'Media not found in database',
        });
      });

      // Group by Cloudinary public IDs for batch deletion
      const cloudinaryPublicIds = mediaRecords
        .filter(m => m.cloudinaryPublicId)
        .map(m => m.cloudinaryPublicId);

      let cloudinaryDeletionResults: { deleted: string[]; failed: string[] } = {
        deleted: [],
        failed: [],
      };

      // Delete from Cloudinary in batch
      if (cloudinaryPublicIds.length > 0) {
         cloudinaryDeletionResults.deleted = cloudinaryPublicIds;
      }

      // Process each media record
      for (const media of mediaRecords) {
        const mediaId = media._id.toString();
        let success = true;
        const errors: string[] = [];

        // Check Cloudinary deletion result
        if (media.cloudinaryPublicId) {
          const wasDeletedFromCloudinary = cloudinaryDeletionResults.deleted.includes(media.cloudinaryPublicId);
          const failedInCloudinary = cloudinaryDeletionResults.failed.includes(media.cloudinaryPublicId);

          if (failedInCloudinary) {
            success = false;
            errors.push('Failed to delete from Cloudinary');
          }
        }

        // Delete from database
        try {
          await Media.findByIdAndDelete(mediaId);
        } catch (error) {
          success = false;
          errors.push(`Database deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        results.push({
          id: mediaId,
          success,
          error: errors.length > 0 ? errors.join('; ') : undefined,
        });
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      return {
        totalRequested: mediaIds.length,
        successCount,
        failureCount,
        results,
      };
    } catch (error) {
      // If there's a general error, mark all as failed
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        totalRequested: mediaIds.length,
        successCount: 0,
        failureCount: mediaIds.length,
        results: mediaIds.map(id => ({
          id,
          success: false,
          error: `Bulk deletion failed: ${errorMessage}`,
        })),
      };
    }
  }

  /**
   * Delete media with usage checking
   */
  static async deleteMediaWithUsageCheck(mediaId: string): Promise<DeletionResult & { usageWarnings?: string[] }> {
    try {
      await connectDB();

      const media = await Media.findById(mediaId);
      if (!media) {
        return {
          success: false,
          deletedIds: [],
          failedIds: [mediaId],
          errors: ['Media not found'],
        };
      }

      const usageWarnings: string[] = [];

      // Check if media is being used
      if (media.usage && media.usage.length > 0) {
        for (const usage of media.usage) {
          usageWarnings.push(`Used in ${usage.type} (ID: ${usage.referenceId})`);
        }
      }

      // Block deletion if the media is still referenced by any document (post, ad, template)
      if (usageWarnings.length > 0) {
        return {
          success: false,
          deletedIds: [],
          failedIds: [mediaId],
          errors: ['Media is currently in use'],
          usageWarnings,
        };
      }

      // Proceed with deletion if no usage found
      const result = await this.deleteMedia(mediaId);
      return {
        ...result,
        usageWarnings,
      };
    } catch (error) {
      return {
        success: false,
        deletedIds: [],
        failedIds: [mediaId],
        errors: [`Error checking usage: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  /**
   * Force delete media (ignoring usage)
   */
  static async forceDeleteMedia(mediaId: string): Promise<DeletionResult> {
    try {
      await connectDB();

      const media = await Media.findById(mediaId);
      if (!media) {
        return {
          success: false,
          deletedIds: [],
          failedIds: [mediaId],
          errors: ['Media not found'],
        };
      }

      // Clear usage references before deletion
      if (media.usage && media.usage.length > 0) {
        // In a production system, you might want to update the referencing documents
        // to remove the media references or replace with placeholders
        console.warn(`Force deleting media ${mediaId} that is in use:`, media.usage);
      }

      return await this.deleteMedia(mediaId);
    } catch (error) {
      return {
        success: false,
        deletedIds: [],
        failedIds: [mediaId],
        errors: [`Force deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  /**
   * Clean up orphaned media (exists in database but not in Cloudinary)
   */
  static async cleanupOrphanedMedia(): Promise<{
    cleaned: number;
    errors: string[];
  }> {
    try {
      await connectDB();

      const allMedia = await Media.find({});
      const errors: string[] = [];
      let cleaned = 0;

      for (const media of allMedia) {
        if (media.cloudinaryPublicId) {
          try {
            // Assume media no longer exists since Cloudinary is evicted
            const cloudinaryMedia = null;
            
            if (!cloudinaryMedia) {
              // Media doesn't exist in Cloudinary, remove from database
              await Media.findByIdAndDelete(media._id);
              cleaned++;
              console.log(`Cleaned orphaned media: ${media.filename} (${media._id})`);
            }
          } catch (error) {
            errors.push(`Error checking media ${media._id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      return { cleaned, errors };
    } catch (error) {
      return {
        cleaned: 0,
        errors: [`Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  /**
   * Get media deletion preview (what will be deleted)
   */
  static async getDeletionPreview(mediaIds: string[]): Promise<{
    canDelete: Array<{ id: string; filename: string; size: number }>;
    hasUsage: Array<{ id: string; filename: string; usage: any[] }>;
    notFound: string[];
  }> {
    try {
      await connectDB();

      const mediaRecords = await Media.find({ _id: { $in: mediaIds } });
      const foundIds = mediaRecords.map(m => m._id.toString());
      const notFound = mediaIds.filter(id => !foundIds.includes(id));

      const canDelete: Array<{ id: string; filename: string; size: number }> = [];
      const hasUsage: Array<{ id: string; filename: string; usage: any[] }> = [];

      for (const media of mediaRecords) {
        const mediaData = {
          id: media._id.toString(),
          filename: media.filename,
          size: media.size,
        };

        if (media.usage && media.usage.length > 0) {
          hasUsage.push({
            ...mediaData,
            usage: media.usage,
          });
        } else {
          canDelete.push(mediaData);
        }
      }

      return { canDelete, hasUsage, notFound };
    } catch (error) {
      console.error('Error getting deletion preview:', error);
      return {
        canDelete: [],
        hasUsage: [],
        notFound: mediaIds,
      };
    }
  }
}