/**
 * Media Types for Hybrid Media Upload System
 * 
 * Defines types for media items stored in MongoDB,
 * matching the Media model schema.
 */

import { UploadProvider, FileType, AdTiming } from './upload';

/**
 * Media variants for different sizes
 */
export interface MediaVariants {
  original: string;
  thumbnail: string | null;
  medium: string | null;
}

/**
 * Media metadata containing technical information
 */
export interface MediaMetadata {
  width?: number;
  height?: number;
  duration?: number;
  format?: string;
  colorSpace?: string;
  hasAlpha?: boolean;
}

/**
 * Media usage tracking entry
 */
export interface MediaUsage {
  type: 'ad' | 'post' | 'template';
  referenceId: string;
  usedAt: Date;
}

/**
 * User reference for uploadedBy field
 */
export interface MediaUploader {
  _id: string;
  name?: string;
  email?: string;
}

/**
 * Main MediaItem interface representing a media document in MongoDB
 * 
 * This interface matches the Media model schema and includes all fields
 * for both Cloudinary and CDN uploads, with provider-specific fields
 * being optional.
 */
export interface MediaItem {
  /** MongoDB document ID */
  _id: string;
  
  // Basic file information
  
  /** Original filename */
  filename: string;
  
  /** MIME type (e.g., 'image/jpeg', 'video/mp4') */
  mimeType: string;
  
  /** File size in bytes */
  size: number;
  
  /** Primary URL for accessing the media */
  url: string;
  
  /** Upload provider used */
  provider: UploadProvider;
  
  // Variants
  
  /** Different size variants of the media */
  variants: MediaVariants;
  
  // Metadata
  
  /** Alt text for accessibility */
  alt: string;
  
  /** Technical metadata about the media */
  metadata: MediaMetadata;
  
  // Organization
  
  /** Tags for categorization */
  tags: string[];
  
  /** Folder path for organization */
  folder: string;
  
  // Provider-specific fields
  
  /** Cloudinary public ID (only for Cloudinary uploads) */
  cloudinaryPublicId?: string;
  
  /** Cloudinary version (only for Cloudinary uploads) */
  cloudinaryVersion?: string;
  
  /** CDN object key (only for CDN uploads) */
  cdnKey?: string;
  
  /** CDN bucket name (only for CDN uploads) */
  cdnBucket?: string;

  /** Supabase storage object path (only for Supabase uploads) */
  objectPath?: string;

  /** Supabase storage bucket name (only for Supabase uploads) */
  bucket?: string;

  /** Supabase public CDN URL (only for Supabase uploads) */
  publicUrl?: string;
  
  // Ad-specific fields
  
  /** VAST tag for advertisement media */
  vastTag?: string;
  
  /** Ad timing configuration */
  adTiming?: AdTiming;
  
  // Usage tracking
  
  /** Array of usage references */
  usage: MediaUsage[];
  
  // Audit fields
  
  /** User who uploaded the media */
  uploadedBy: MediaUploader | null;
  
  /** Creation timestamp */
  createdAt: string;
  
  /** Last update timestamp */
  updatedAt: string;
  
  /** Virtual field for file type category */
  fileType: FileType;
}

/**
 * Input type for creating media metadata
 * Used when saving media after upload
 */
export interface MediaMetadataInput {
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  provider: UploadProvider;
  variants?: Partial<MediaVariants>;
  alt?: string;
  metadata?: Partial<MediaMetadata>;
  tags?: string[];
  folder?: string;
  cloudinaryPublicId?: string;
  cloudinaryVersion?: string;
  cdnKey?: string;
  cdnBucket?: string;
  vastTag?: string;
  adTiming?: AdTiming;
  uploadedBy?: string;
}

/**
 * Media filter options for querying
 */
export interface MediaFilterOptions {
  type?: 'all' | 'image' | 'video' | 'ad';
  search?: string;
  folder?: string;
  tags?: string[];
  provider?: UploadProvider;
  uploadedBy?: string;
}

/**
 * Media query result with pagination
 */
export interface MediaQueryResult {
  items: MediaItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Media deletion result
 */
export interface MediaDeletionResult {
  success: boolean;
  message?: string;
}

/**
 * Bulk deletion result
 */
export interface BulkDeletionResult {
  success: boolean;
  deletedCount: number;
  failedIds?: string[];
  message?: string;
}

/**
 * Storage statistics per provider
 */
export interface StorageStats {
  cdn: {
    count: number;
    totalSize: number;
  };
  total: {
    count: number;
    totalSize: number;
  };
}

/**
 * Upload analytics data
 */
export interface UploadAnalytics {
  dailyUploads: number;
  storageByProvider: StorageStats;
  averageUploadTime: Record<FileType, number>;
  failureRate: number;
  commonErrors: Array<{
    error: string;
    count: number;
  }>;
}
