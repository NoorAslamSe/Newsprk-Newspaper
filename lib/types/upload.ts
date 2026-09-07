/**
 * Upload Types for Hybrid Media Upload System
 * 
 * Defines types for the upload process including file state,
 * provider selection, and pre-upload editing capabilities.
 */

/**
 * Upload provider options
 */
export type UploadProvider = 'cdn' | 'supabase' | 'cloudinary';

/**
 * Upload status states
 */
export type UploadStatus = 'pending' | 'uploading' | 'success' | 'error' | 'cancelled';

/**
 * File type categories
 */
export type FileType = 'image' | 'video' | 'audio' | 'file';

/**
 * Ad timing options for advertisement media
 */
export type AdTiming = 'pre-roll' | 'mid-roll' | 'post-roll';

/**
 * Crop configuration for image editing
 */
export interface CropConfig {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Resize configuration for image editing
 */
export interface ResizeConfig {
  width: number;
  height: number;
}

/**
 * Trim configuration for video editing
 */
export interface TrimConfig {
  start: number;
  end: number;
}

/**
 * Video playback controls configuration
 */
export interface VideoControls {
  autoplay: boolean;
  mute: boolean;
  loop: boolean;
}

/**
 * Pre-upload edits configuration
 */
export interface UploadEdits {
  crop?: CropConfig;
  resize?: ResizeConfig;
  trim?: TrimConfig;
  videoControls?: VideoControls;
  thumbnailTime?: number;
}

/**
 * Upload result from CDN (S3/R2)
 */
export interface CDNUploadResult {
  id: string;
  url: string;
  key: string;
}

/**
 * Generic upload result
 */
export type UploadResult = CDNUploadResult;

/**
 * Main UploadFile interface representing a file in the upload queue
 * 
 * This interface tracks the complete state of a file through the upload process,
 * including metadata, progress, status, and any pre-upload edits.
 */
export interface UploadFile {
  /** Unique identifier for this upload */
  id: string;
  
  /** The actual File object to be uploaded */
  file: File;
  
  /** Selected upload provider */
  provider: UploadProvider;
  
  /** Upload progress percentage (0-100) */
  progress: number;
  
  /** Current upload status */
  status: UploadStatus;
  
  /** Error message if status is 'error' */
  error?: string;
  
  /** Upload result after successful completion */
  result?: {
    id: string;
    url: string;
    key?: string; // CDN
  };
  
  /** Preview URL for displaying file before upload */
  preview?: string;
  
  // Metadata fields
  
  /** Tags for categorization */
  tags: string[];
  
  /** Alt text for accessibility */
  alt: string;
  
  /** Folder path for organization */
  folder: string;
  
  // Pre-upload edits
  
  /** Optional pre-upload modifications */
  edits?: UploadEdits;
  
  // Ad-specific fields
  
  /** VAST tag for advertisement media */
  vastTag?: string;
  
  /** Ad timing configuration */
  adTiming?: AdTiming;
  
  // Retry tracking
  
  /** Number of retry attempts made */
  retryCount: number;
  
  /** Maximum number of retry attempts allowed */
  maxRetries: number;
}

/**
 * Options for CDN upload
 */
export interface CDNUploadOptions {
  folder: string;
  contentType: string;
  metadata?: Record<string, string>;
}

/**
 * Presigned URL response from server
 */
export interface PresignedUrlResponse {
  url: string;
  key: string;
  expiresIn: number;
}

/**
 * File validation result
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Upload progress event
 */
export interface UploadProgressEvent {
  fileId: string;
  progress: number;
  loaded: number;
  total: number;
}
