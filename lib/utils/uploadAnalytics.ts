import { connectDB } from '@/lib/db';
import { UploadAnalytics } from '@/lib/models/UploadAnalytics';

/**
 * Accumulates upload metrics into the daily UploadAnalytics document.
 * Uses MongoDB $inc + upsert so a single document is reused for the entire UTC day
 * without needing a separate aggregation job.
 */

type FileCategory = 'image' | 'video' | 'audio' | 'other';

/** Maps a MIME type to one of the four tracked upload categories. */
function getFileCategory(mimeType: string): FileCategory {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'other';
}

export async function recordUploadSuccess(
  provider: 'cloudinary' | 'cdn' | 'supabase',
  mimeType: string,
  sizeBytes: number,
  timeMs: number
) {
  try {
    await connectDB();
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to midnight so all uploads in the same day share one doc

    const category = getFileCategory(mimeType);

    // Upsert: creates the daily doc if missing, otherwise increments existing counters
    await UploadAnalytics.findOneAndUpdate(
      { date: today },
      {
        $inc: {
          totalUploads: 1,
          [`storageByProvider.${provider}`]: sizeBytes,       // Bytes by storage provider
          [`uploadTimeByType.${category}.totalTimeMs`]: timeMs, // Accumulate for avg calculation
          [`uploadTimeByType.${category}.count`]: 1,
        },
      },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error('Failed to record upload success analytics', error);
  }
}

export async function recordUploadFailure() {
  try {
    await connectDB();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await UploadAnalytics.findOneAndUpdate(
      { date: today },
      {
        $inc: {
          totalUploads: 1,
          failedUploads: 1,
        },
      },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error('Failed to record upload failure analytics', error);
  }
}
