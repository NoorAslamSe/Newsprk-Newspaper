/**
 * CDN Uploader - Client-Side Direct Upload to S3/R2
 * 
 * This module handles direct uploads to S3/Cloudflare R2 from the browser using
 * presigned URLs. Files are uploaded directly to the CDN without proxying through
 * the Next.js server.
 * 
 * Requirements: 2.2, 2.3, 25.3, 25.4, 25.5
 */

import type { CDNUploadOptions, CDNUploadResult } from '@/lib/types/upload';
import { generatePresignedUrlAction } from '@/lib/actions/media';

/**
 * Maximum number of retry attempts for transient errors
 */
const MAX_RETRIES = 3;

/**
 * Retry delay in milliseconds (exponential backoff)
 */
const RETRY_DELAYS = [1000, 2000, 4000]; // 1s, 2s, 4s

/**
 * Transient error status codes that should trigger a retry
 */
const TRANSIENT_ERROR_CODES = [408, 429, 500, 502, 503, 504];

/**
 * Upload a file directly to CDN (S3/R2) using presigned URL
 * 
 * This function performs a direct client-side upload to S3/Cloudflare R2 using
 * XMLHttpRequest for progress tracking. It first requests a presigned URL from
 * the server, then uploads the file directly to the CDN.
 * 
 * @param file - The File object to upload
 * @param options - Upload options including folder and content type
 * @param onProgress - Optional callback for upload progress (0-100)
 * @returns Promise resolving to CDNUploadResult
 * 
 * @throws Error if presigned URL generation fails or upload fails
 * 
 * Requirements:
 * - 2.2: Direct upload to S3/R2 via presigned URL
 * - 2.3: Uses XMLHttpRequest for progress tracking
 * - 25.3: Sets Content-Type header from file MIME type
 * - 25.4: Handles S3/R2 API errors with user-friendly messages
 * - 25.5: Implements retry logic for transient errors
 */
export async function uploadToCDN(
  file: File,
  options: CDNUploadOptions,
  onProgress?: (progress: number) => void
): Promise<CDNUploadResult> {
  let retryCount = 0;

  // Retry loop for transient errors
  while (retryCount <= MAX_RETRIES) {
    try {
      // Step 1: Request presigned URL from server
      const presignedResponse = await generatePresignedUrlAction({
        filename: file.name,
        contentType: options.contentType || file.type,
        folder: options.folder,
      });

      if (!presignedResponse.success) {
        throw new Error(presignedResponse.error || 'Failed to generate presigned URL');
      }

      const { url: presignedUrl, key } = presignedResponse.data;

      // Step 2: Upload file directly to S3/R2 using presigned URL
      const uploadResult = await uploadFileToPresignedUrl(
        file,
        presignedUrl,
        options.contentType || file.type,
        onProgress
      );

      // Step 3: Construct CDN URL from key
      const cdnUrl = constructCDNUrl(key);

      // Return successful result
      return {
        id: key,
        url: cdnUrl,
        key,
      };
    } catch (error) {
      const isTransientError = isTransientErrorRetryable(error);
      const shouldRetry = isTransientError && retryCount < MAX_RETRIES;

      if (shouldRetry) {
        retryCount++;
        console.warn(`CDN upload failed (attempt ${retryCount}/${MAX_RETRIES}), retrying...`, error);
        
        // Wait before retrying with exponential backoff
        await delay(RETRY_DELAYS[retryCount - 1]);
        continue;
      }

      // Requirement 25.5: Handle S3/R2 API errors with user-friendly messages
      throw new Error(getUserFriendlyErrorMessage(error));
    }
  }

  // This should never be reached due to the throw in the catch block
  throw new Error('Upload failed after maximum retry attempts');
}

/**
 * Upload file to presigned URL using XMLHttpRequest
 * 
 * @param file - The File object to upload
 * @param presignedUrl - The presigned URL for direct upload
 * @param contentType - The MIME type of the file
 * @param onProgress - Optional callback for upload progress
 * @returns Promise that resolves when upload completes
 */
function uploadFileToPresignedUrl(
  file: File,
  presignedUrl: string,
  contentType: string,
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Requirement 2.3: Track upload progress using XMLHttpRequest events
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    });

    // Handle successful upload
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        // Requirement 25.4: Handle S3/R2 API errors
        const error = new Error(`Upload failed with status ${xhr.status}`);
        (error as any).status = xhr.status;
        (error as any).response = xhr.responseText;
        reject(error);
      }
    });

    // Handle network errors
    xhr.addEventListener('error', () => {
      reject(new Error('Network error occurred during upload'));
    });

    // Handle upload abort
    xhr.addEventListener('abort', () => {
      reject(new Error('Upload was cancelled'));
    });

    // Requirement 2.2: Direct PUT request to presigned URL
    xhr.open('PUT', presignedUrl);
    
    // Requirement 25.3: Set Content-Type header from file MIME type
    xhr.setRequestHeader('Content-Type', contentType);

    // Send the file
    xhr.send(file);
  });
}

/**
 * Check if an error is transient and should be retried
 * 
 * @param error - The error to check
 * @returns True if the error is transient and retryable
 */
function isTransientErrorRetryable(error: unknown): boolean {
  if (error instanceof Error) {
    const status = (error as any).status;
    
    // Check for transient HTTP status codes
    if (typeof status === 'number' && TRANSIENT_ERROR_CODES.includes(status)) {
      return true;
    }

    // Check for network errors
    if (error.message.includes('Network error') || error.message.includes('timeout')) {
      return true;
    }
  }

  return false;
}

/**
 * Convert error to user-friendly message
 * 
 * Requirement 25.5: Handle S3/R2 API errors with user-friendly messages
 * 
 * @param error - The error to convert
 * @returns User-friendly error message
 */
function getUserFriendlyErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const status = (error as any).status;

    // Map HTTP status codes to user-friendly messages
    if (typeof status === 'number') {
      switch (status) {
        case 400:
          return 'Invalid upload request. Please check your file and try again.';
        case 401:
        case 403:
          return 'Upload authentication failed. Please refresh the page and try again.';
        case 404:
          return 'Upload destination not found. Please contact support.';
        case 408:
          return 'Upload timed out. Please check your connection and try again.';
        case 413:
          return 'File is too large. Please choose a smaller file.';
        case 429:
          return 'Too many upload requests. Please wait a moment and try again.';
        case 500:
        case 502:
        case 503:
        case 504:
          return 'CDN service error. Please try again later.';
        default:
          return `Upload failed with error code ${status}. Please try again.`;
      }
    }

    // Handle specific error messages
    if (error.message.includes('Network error')) {
      return 'Network error occurred. Please check your connection and try again.';
    }

    if (error.message.includes('cancelled')) {
      return 'Upload was cancelled.';
    }

    if (error.message.includes('presigned URL')) {
      return 'Failed to prepare upload. Please try again.';
    }

    // Return original error message if it's user-friendly
    if (error.message.length < 200) {
      return error.message;
    }
  }

  // Default error message
  return 'Upload failed. Please try again.';
}

/**
 * Construct CDN URL from object key
 * 
 * @param key - The S3/R2 object key
 * @returns Full CDN URL
 */
function constructCDNUrl(key: string): string {
  // Use environment variable for CDN base URL
  const cdnBaseUrl = process.env.NEXT_PUBLIC_CDN_BASE_URL || process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

  if (!cdnBaseUrl) {
    console.warn('CDN base URL not configured, using key as URL');
    return key;
  }

  // Ensure base URL doesn't end with slash and key doesn't start with slash
  const baseUrl = cdnBaseUrl.replace(/\/$/, '');
  const objectKey = key.replace(/^\//, '');

  return `${baseUrl}/${objectKey}`;
}

/**
 * Delay helper for retry logic
 * 
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after delay
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Upload a file to CDN with cancellation support
 * 
 * @param file - The File object to upload
 * @param options - Upload options
 * @param onProgress - Optional callback for upload progress
 * @returns Object with promise and abort function
 */
export function uploadToCDNWithCancel(
  file: File,
  options: CDNUploadOptions,
  onProgress?: (progress: number) => void
): { promise: Promise<CDNUploadResult>; abort: () => void } {
  let currentXhr: XMLHttpRequest | null = null;
  let aborted = false;

  const promise = (async () => {
    let retryCount = 0;

    while (retryCount <= MAX_RETRIES && !aborted) {
      try {
        // Request presigned URL
        const presignedResponse = await generatePresignedUrlAction({
          filename: file.name,
          contentType: options.contentType || file.type,
          folder: options.folder,
        });

        if (!presignedResponse.success) {
          throw new Error(presignedResponse.error || 'Failed to generate presigned URL');
        }

        const { url: presignedUrl, key } = presignedResponse.data;

        // Upload with cancellation support
        await new Promise<void>((resolve, reject) => {
          if (aborted) {
            reject(new Error('Upload was cancelled'));
            return;
          }

          const xhr = new XMLHttpRequest();
          currentXhr = xhr;

          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable && onProgress) {
              const progress = Math.round((event.loaded / event.total) * 100);
              onProgress(progress);
            }
          });

          xhr.addEventListener('load', () => {
            currentXhr = null;
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              const error = new Error(`Upload failed with status ${xhr.status}`);
              (error as any).status = xhr.status;
              reject(error);
            }
          });

          xhr.addEventListener('error', () => {
            currentXhr = null;
            reject(new Error('Network error occurred during upload'));
          });

          xhr.addEventListener('abort', () => {
            currentXhr = null;
            reject(new Error('Upload was cancelled'));
          });

          xhr.open('PUT', presignedUrl);
          xhr.setRequestHeader('Content-Type', options.contentType || file.type);
          xhr.send(file);
        });

        // Construct CDN URL
        const cdnUrl = constructCDNUrl(key);

        return {
          id: key,
          url: cdnUrl,
          key,
        };
      } catch (error) {
        if (aborted) {
          throw new Error('Upload was cancelled');
        }

        const isTransientError = isTransientErrorRetryable(error);
        const shouldRetry = isTransientError && retryCount < MAX_RETRIES;

        if (shouldRetry) {
          retryCount++;
          console.warn(`CDN upload failed (attempt ${retryCount}/${MAX_RETRIES}), retrying...`, error);
          await delay(RETRY_DELAYS[retryCount - 1]);
          continue;
        }

        throw new Error(getUserFriendlyErrorMessage(error));
      }
    }

    throw new Error('Upload failed after maximum retry attempts');
  })();

  return {
    promise,
    abort: () => {
      aborted = true;
      if (currentXhr) {
        currentXhr.abort();
        currentXhr = null;
      }
    },
  };
}
