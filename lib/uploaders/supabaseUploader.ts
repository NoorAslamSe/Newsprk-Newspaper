import { createClientBrowser, getPublicUrl } from '@/lib/storage/supabase';
import type { CDNUploadOptions, CDNUploadResult } from '@/lib/types/upload';
import { generateSupabaseSignedUrlAction } from '@/lib/actions/media';

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000];

export async function uploadToSupabase(
  file: File,
  options: CDNUploadOptions,
  onProgress?: (progress: number) => void
): Promise<CDNUploadResult & { objectPath: string; bucket: string }> {
  let retryCount = 0;

  while (retryCount <= MAX_RETRIES) {
    try {
      // Generate a signed upload URL using the service role via server action to completely securely bypass RLS
      const presignedResponse = await generateSupabaseSignedUrlAction({
        filename: file.name,
        contentType: options.contentType || file.type,
        folder: options.folder,
      });

      if (!presignedResponse.success || !presignedResponse.data) {
        throw new Error(presignedResponse.error || "Failed to generate signed url");
      }

      const { token, objectPath, bucket } = presignedResponse.data;

      if (onProgress) onProgress(10); // Start

      const browserClient = createClientBrowser();
      // Upload using signed URL explicitly to attach the bypass ticket
      const { data, error } = await browserClient
        .storage
        .from(bucket)
        .uploadToSignedUrl(objectPath, token, file, {
          cacheControl: '31536000', // Set for maximum CDN performance
          upsert: false
        });

      if (error) {
        throw new Error(error.message);
      }

      if (onProgress) onProgress(100); // Complete

      const publicUrl = getPublicUrl(bucket, objectPath);

      return {
        id: objectPath,
        url: publicUrl,
        key: objectPath,
        objectPath: objectPath,
        bucket,
      };
    } catch (error) {
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        console.warn(`Supabase upload failed (attempt ${retryCount}/${MAX_RETRIES}), retrying...`, error);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS[retryCount - 1]));
        continue;
      }
      throw new Error(error instanceof Error ? error.message : 'Supabase upload failed');
    }
  }

  throw new Error('Supabase upload failed after maximum retry attempts');
}

export function uploadToSupabaseWithCancel(
  file: File,
  options: CDNUploadOptions,
  onProgress?: (progress: number) => void
): { promise: Promise<CDNUploadResult & { objectPath: string; bucket: string }>; abort: () => void } {
  let aborted = false;

  const promise = (async () => {
    let retryCount = 0;

    while (retryCount <= MAX_RETRIES && !aborted) {
      try {
        const presignedResponse = await generateSupabaseSignedUrlAction({
          filename: file.name,
          contentType: options.contentType || file.type,
          folder: options.folder,
        });

        if (!presignedResponse.success || !presignedResponse.data) {
          throw new Error(presignedResponse.error || "Failed to generate signed url");
        }

        const { token, objectPath, bucket } = presignedResponse.data;

        if (aborted) throw new Error('Upload was cancelled');
        if (onProgress) onProgress(10);

        const browserClient = createClientBrowser();
        const { data, error } = await browserClient
          .storage
          .from(bucket)
          .uploadToSignedUrl(objectPath, token, file, {
            cacheControl: '31536000',
            upsert: false
          });

        if (error) throw new Error(error.message);
        if (aborted) {
           throw new Error('Upload was cancelled');
        }

        if (onProgress) onProgress(100);

        const publicUrl = getPublicUrl(bucket, objectPath);

        return {
          id: objectPath,
          url: publicUrl,
          key: objectPath,
          objectPath: objectPath,
          bucket,
        };
      } catch (error) {
        if (aborted) {
          throw new Error('Upload was cancelled');
        }
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS[retryCount - 1]));
          continue;
        }
        throw new Error(error instanceof Error ? error.message : 'Supabase upload failed');
      }
    }

    throw new Error('Upload failed after maximum retry attempts');
  })();

  return {
    promise,
    abort: () => {
      aborted = true;
    },
  };
}
