/**
 * Metadata Parser - Transform Provider-Specific Metadata to Standardized Format
 * 
 * This module provides functions to parse upload results from Cloudinary and CDN
 * into the standardized Media_Record format for database storage.
 * 
 * Requirements: 29.1, 29.3
 */

import type { MediaMetadataInput } from '@/lib/types/media';

/**
 * Cloudinary API response structure
 * This represents the actual response from Cloudinary's upload API
 */
export interface CloudinaryApiResponse {
  public_id: string;
  secure_url: string;
  format: string;
  resource_type: string;
  bytes: number;
  width?: number;
  height?: number;
  duration?: number;
  asset_id?: string;
  version?: number;
}

/**
 * CDN upload result with file metadata
 * This represents the data available after a CDN upload
 */
export interface CDNApiResponse {
  key: string;
  url: string;
  size: number;
  contentType?: string;
  bucket?: string;
}

/**
 * Parse Cloudinary upload result into standardized Media_Record format
 * 
 * Transforms Cloudinary-specific fields into the standardized metadata format
 * used throughout the application. Validates that required fields are present.
 * 
 * @param cloudinaryResult - The response from Cloudinary upload API
 * @param additionalMetadata - Optional additional metadata (tags, alt, folder, etc.)
 * @returns Standardized MediaMetadataInput for database storage
 * @throws Error if required fields are missing
 * 
 * Requirements:
 * - 29.1: Parse Cloudinary metadata into standardized Media_Record format
 * - 29.3: Validate required fields (url, mimeType, size) are present
 */
export function parseCloudinaryMetadata(
  cloudinaryResult: CloudinaryApiResponse,
  additionalMetadata?: {
    tags?: string[];
    alt?: string;
    folder?: string;
    vastTag?: string;
    adTiming?: 'pre-roll' | 'mid-roll' | 'post-roll';
    uploadedBy?: string;
  }
): MediaMetadataInput {
  // Requirement 29.3: Validate required fields are present
  if (!cloudinaryResult.secure_url) {
    throw new Error('Missing required field: secure_url (url)');
  }

  if (!cloudinaryResult.format) {
    throw new Error('Missing required field: format (mimeType)');
  }

  if (typeof cloudinaryResult.bytes !== 'number') {
    throw new Error('Missing required field: bytes (size)');
  }

  // Extract filename from public_id (last segment after /)
  const filename = cloudinaryResult.public_id.split('/').pop() || cloudinaryResult.public_id;

  // Construct MIME type from resource_type and format
  const mimeType = constructMimeType(cloudinaryResult.resource_type, cloudinaryResult.format);

  // Build standardized metadata
  const metadata: MediaMetadataInput = {
    // Required fields
    filename: filename,
    mimeType: mimeType,
    size: cloudinaryResult.bytes,
    url: cloudinaryResult.secure_url,
    provider: 'cdn',

    // Cloudinary-specific fields
    cloudinaryPublicId: cloudinaryResult.public_id,
    cloudinaryVersion: cloudinaryResult.version?.toString(),

    // Variants (Cloudinary provides transformations via URL)
    variants: {
      original: cloudinaryResult.secure_url,
      thumbnail: null,
      medium: null,
    },

    // Technical metadata
    metadata: {
      width: cloudinaryResult.width,
      height: cloudinaryResult.height,
      duration: cloudinaryResult.duration,
      format: cloudinaryResult.format,
    },

    // Additional metadata
    tags: additionalMetadata?.tags || [],
    alt: additionalMetadata?.alt || '',
    folder: additionalMetadata?.folder || 'uploads',
    vastTag: additionalMetadata?.vastTag,
    adTiming: additionalMetadata?.adTiming,
    uploadedBy: additionalMetadata?.uploadedBy,
  };

  return metadata;
}

/**
 * Parse CDN upload result into standardized Media_Record format
 * 
 * Transforms CDN-specific fields into the standardized metadata format
 * used throughout the application. Validates that required fields are present.
 * 
 * @param cdnResult - The result from CDN upload (S3/R2)
 * @param file - The original File object (for MIME type and filename)
 * @param additionalMetadata - Optional additional metadata (tags, alt, folder, etc.)
 * @returns Standardized MediaMetadataInput for database storage
 * @throws Error if required fields are missing
 * 
 * Requirements:
 * - 29.1: Parse CDN metadata into standardized Media_Record format
 * - 29.3: Validate required fields (url, mimeType, size) are present
 */
export function parseCDNMetadata(
  cdnResult: CDNApiResponse,
  file: File,
  additionalMetadata?: {
    tags?: string[];
    alt?: string;
    folder?: string;
    vastTag?: string;
    adTiming?: 'pre-roll' | 'mid-roll' | 'post-roll';
    uploadedBy?: string;
  }
): MediaMetadataInput {
  // Requirement 29.3: Validate required fields are present
  if (!cdnResult.url) {
    throw new Error('Missing required field: url');
  }

  if (!file.type) {
    throw new Error('Missing required field: mimeType (from File object)');
  }

  if (typeof cdnResult.size !== 'number') {
    throw new Error('Missing required field: size');
  }

  // Build standardized metadata
  const metadata: MediaMetadataInput = {
    // Required fields
    filename: file.name,
    mimeType: file.type,
    size: cdnResult.size,
    url: cdnResult.url,
    provider: 'cdn',

    // CDN-specific fields
    cdnKey: cdnResult.key,
    cdnBucket: cdnResult.bucket,

    // Variants (CDN doesn't provide automatic variants)
    variants: {
      original: cdnResult.url,
      thumbnail: null,
      medium: null,
    },

    // Technical metadata (limited for CDN uploads)
    metadata: {},

    // Additional metadata
    tags: additionalMetadata?.tags || [],
    alt: additionalMetadata?.alt || '',
    folder: additionalMetadata?.folder || 'uploads',
    vastTag: additionalMetadata?.vastTag,
    adTiming: additionalMetadata?.adTiming,
    uploadedBy: additionalMetadata?.uploadedBy,
  };

  return metadata;
}

/**
 * Construct MIME type from Cloudinary resource_type and format
 * 
 * @param resourceType - Cloudinary resource type (image, video, raw, etc.)
 * @param format - File format (jpg, png, mp4, etc.)
 * @returns MIME type string
 */
function constructMimeType(resourceType: string, format: string): string {
  // Handle common resource types
  if (resourceType === 'image') {
    return `image/${format}`;
  }

  if (resourceType === 'video') {
    return `video/${format}`;
  }

  if (resourceType === 'audio') {
    return `audio/${format}`;
  }

  // For raw files, try to infer MIME type from format
  const mimeTypeMap: Record<string, string> = {
    pdf: 'application/pdf',
    json: 'application/json',
    xml: 'application/xml',
    zip: 'application/zip',
    txt: 'text/plain',
    html: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
  };

  return mimeTypeMap[format.toLowerCase()] || `application/${format}`;
}

/**
 * Validate that a metadata object has all required fields
 * 
 * @param metadata - The metadata object to validate
 * @returns True if valid, throws Error if invalid
 * @throws Error if required fields are missing
 * 
 * Requirement 29.3: Validate required fields (url, mimeType, size) are present
 */
export function validateRequiredFields(metadata: MediaMetadataInput): boolean {
  if (!metadata.url || metadata.url.trim() === '') {
    throw new Error('Missing required field: url');
  }

  if (!metadata.mimeType || metadata.mimeType.trim() === '') {
    throw new Error('Missing required field: mimeType');
  }

  if (typeof metadata.size !== 'number' || metadata.size <= 0) {
    throw new Error('Missing or invalid required field: size');
  }

  if (!metadata.provider || (metadata.provider !== 'cdn')) {
    throw new Error('Missing or invalid required field: provider');
  }

  return true;
}
