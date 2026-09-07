/**
 * File Router Utility for Hybrid Media Upload System
 * 
 * Provides automatic file routing logic to recommend the optimal upload provider
 * based on file type and size.
 * 
 * Implements Requirements 4.1, 4.2, 4.3, 4.5
 */

import { UploadProvider } from '@/lib/types/upload';

/**
 * Size threshold for recommending CDN provider (10MB in bytes)
 */
const CDN_SIZE_THRESHOLD = 10 * 1024 * 1024; // 10MB

/**
 * Gets the recommended upload provider for a file based on its type and size
 * 
 * Routing Logic:
 * - Files larger than 10MB → CDN (regardless of type)
 * - Images (MIME type starts with 'image/') → Cloudinary
 * - Videos (MIME type starts with 'video/') → CDN
 * - All other files → CDN (default)
 * 
 * @param file - The File object to analyze
 * @returns Recommended upload provider ('cloudinary' | 'cdn')
 * 
 * @example
 * ```typescript
 * const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
 * const provider = getProviderRecommendation(file);
 * // Returns: 'cloudinary'
 * ```
 * 
 * @example
 * ```typescript
 * const largeFile = new File([new ArrayBuffer(15 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
 * const provider = getProviderRecommendation(largeFile);
 * // Returns: 'cdn' (because size > 10MB)
 * ```
 */
/**
 * Gets the recommended upload provider for a file based on its type and size.
 *
 * NOTE: Routing logic described in JSDoc above is the original design.
 * Cloudinary has since been removed; this function always returns 'cdn'.
 * The comment block is retained as documentation of the original intent.
 */
export function getProviderRecommendation(file: File | any): UploadProvider {
  return 'cdn'; // Always CDN — Cloudinary has been removed from this project
}
