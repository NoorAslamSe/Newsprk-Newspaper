/**
 * File Validator Utility for Hybrid Media Upload System
 * 
 * Validates files against MIME type and size constraints based on upload provider.
 * Implements Requirements 11.1, 11.2, 11.3, 11.4, 11.5
 */

import { FileValidationResult, UploadProvider } from '@/lib/types/upload';
import { getProviderRecommendation } from './fileRouter';

/**
 * Allowed MIME types for media uploads
 */
const ALLOWED_MIME_TYPES = {
  images: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ],
  videos: [
    'video/mp4',
    'video/webm',
  ],
  audio: [
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
  ],
} as const;

/**
 * File size limits in bytes
 */
const SIZE_LIMITS = {
  cloudinary: 26214400,  // 25MB in bytes
  cdn: 524288000,        // 500MB in bytes
  supabase: 524288000,   // 500MB in bytes
} as const;

/**
 * All allowed MIME types (flattened)
 */
const ALL_ALLOWED_MIME_TYPES = [
  ...ALLOWED_MIME_TYPES.images,
  ...ALLOWED_MIME_TYPES.videos,
  ...ALLOWED_MIME_TYPES.audio,
];

/**
 * Validates a file against MIME type and size constraints
 * 
 * @param file - The File object to validate
 * @param provider - The upload provider ('cloudinary' | 'cdn')
 * @returns FileValidationResult with valid boolean and optional error message
 */
export function validateFile(
  file: File,
  provider: UploadProvider
): FileValidationResult {
  // Validate MIME type
  if (!ALL_ALLOWED_MIME_TYPES.includes(file.type as any)) {
    return {
      valid: false,
      error: `File type "${file.type}" is not supported. Allowed types: JPEG, PNG, GIF, WebP images, MP4, WebM videos, and MP3, WAV, OGG audio.`,
    };
  }

  // Validate file size based on provider
  const sizeLimit = SIZE_LIMITS[provider];
  if (file.size > sizeLimit) {
    const limitMB = Math.round(sizeLimit / 1024 / 1024);
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    
    return {
      valid: false,
      error: `File size (${fileSizeMB}MB) exceeds the ${limitMB}MB limit for ${provider} uploads.`,
    };
  }

  // File is valid
  return {
    valid: true,
  };
}

/**
 * Checks if a MIME type is an image
 * 
 * @param mimeType - The MIME type to check
 * @returns true if the MIME type is an image
 */
export function isImageMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.images.includes(mimeType as any);
}

/**
 * Checks if a MIME type is a video
 * 
 * @param mimeType - The MIME type to check
 * @returns true if the MIME type is a video
 */
export function isVideoMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.videos.includes(mimeType as any);
}

/**
 * Checks if a MIME type is an audio file
 * 
 * @param mimeType - The MIME type to check
 * @returns true if the MIME type is an audio file
 */
export function isAudioMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.audio.includes(mimeType as any);
}

/**
 * Gets the recommended provider for a file based on type and size
 * 
 * @deprecated Use getProviderRecommendation from fileRouter.ts instead
 * @param file - The File object to analyze
 * @returns Recommended upload provider
 */
export function getRecommendedProvider(file: File): UploadProvider {
  return getProviderRecommendation(file);
}

/**
 * Formats file size in human-readable format
 * 
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
