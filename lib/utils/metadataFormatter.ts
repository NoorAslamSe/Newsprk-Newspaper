/**
 * Metadata Formatter - Format Media Metadata for Human-Readable Display
 * 
 * This module provides functions to format media metadata into user-friendly
 * strings for display in the UI. Handles file sizes, durations, and complete
 * metadata objects.
 * 
 * Requirements: 29.2, 29.4
 */

import type { MediaItem, MediaMetadata } from '@/lib/types/media';

/**
 * Format file size in bytes to human-readable string with appropriate units
 * 
 * Converts byte values to KB, MB, or GB with 2 decimal places for readability.
 * Uses 1024 as the conversion factor (binary units).
 * 
 * @param bytes - File size in bytes
 * @returns Formatted string with appropriate unit (e.g., "1.5 MB", "250 KB")
 * 
 * Requirement 29.2: Format file sizes using appropriate units (B, KB, MB, GB)
 * 
 * @example
 * formatFileSize(1024) // "1.00 KB"
 * formatFileSize(1536000) // "1.46 MB"
 * formatFileSize(5368709120) // "5.00 GB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 0) {
    return '0 B';
  }

  if (bytes === 0) {
    return '0 B';
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(2)} KB`;
  }

  const mb = kb / 1024;
  if (mb < 1024) {
    return `${mb.toFixed(2)} MB`;
  }

  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
}

/**
 * Format duration in seconds to human-readable time string
 * 
 * Converts duration to HH:MM:SS format for videos longer than 1 hour,
 * or MM:SS format for shorter videos. Handles edge cases like 0 duration.
 * 
 * @param seconds - Duration in seconds
 * @returns Formatted time string (e.g., "1:23:45", "5:30", "0:00")
 * 
 * Requirement 29.2: Format durations as HH:MM:SS or MM:SS
 * 
 * @example
 * formatDuration(90) // "1:30"
 * formatDuration(3665) // "1:01:05"
 * formatDuration(45) // "0:45"
 */
export function formatDuration(seconds: number): string {
  if (seconds < 0 || !isFinite(seconds)) {
    return '0:00';
  }

  if (seconds === 0) {
    return '0:00';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  // Format with leading zeros
  const paddedMinutes = minutes.toString().padStart(2, '0');
  const paddedSeconds = secs.toString().padStart(2, '0');

  if (hours > 0) {
    // HH:MM:SS format for videos longer than 1 hour
    return `${hours}:${paddedMinutes}:${paddedSeconds}`;
  }

  // MM:SS format for videos shorter than 1 hour
  return `${minutes}:${paddedSeconds}`;
}

/**
 * Format complete metadata object for human-readable display
 * 
 * Transforms technical metadata into user-friendly strings suitable for
 * display in tooltips, cards, or detail views. Handles different media types
 * (images, videos, audio) and includes relevant information for each.
 * 
 * @param media - The MediaItem object containing metadata
 * @returns Object with formatted metadata strings
 * 
 * Requirement 29.4: Format metadata into human-readable strings
 * 
 * @example
 * formatMetadata(imageMedia)
 * // {
 * //   size: "2.5 MB",
 * //   dimensions: "1920 × 1080",
 * //   type: "Image (JPEG)",
 * //   uploaded: "Jan 15, 2024",
 * //   provider: "Cloudinary"
 * // }
 */
export function formatMetadata(media: MediaItem): {
  size: string;
  dimensions?: string;
  duration?: string;
  type: string;
  uploaded: string;
  provider: string;
  format?: string;
} {
  const result: {
    size: string;
    dimensions?: string;
    duration?: string;
    type: string;
    uploaded: string;
    provider: string;
    format?: string;
  } = {
    size: formatFileSize(media.size),
    type: formatMediaType(media.mimeType),
    uploaded: formatUploadDate(media.createdAt),
    provider: formatProvider(media.provider as string),
  };

  // Add dimensions for images and videos
  if (media.metadata?.width && media.metadata?.height) {
    result.dimensions = `${media.metadata.width} × ${media.metadata.height}`;
  }

  // Add duration for videos and audio
  if (media.metadata?.duration) {
    result.duration = formatDuration(media.metadata.duration);
  }

  // Add format if available
  if (media.metadata?.format) {
    result.format = media.metadata.format.toUpperCase();
  }

  return result;
}

/**
 * Format MIME type to user-friendly media type string
 * 
 * @param mimeType - MIME type string (e.g., "image/jpeg", "video/mp4")
 * @returns Formatted media type (e.g., "Image (JPEG)", "Video (MP4)")
 */
function formatMediaType(mimeType: string): string {
  const [type, subtype] = mimeType.split('/');
  
  if (!type || !subtype) {
    return 'Unknown';
  }

  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
  const subtypeLabel = subtype.toUpperCase();

  return `${typeLabel} (${subtypeLabel})`;
}

/**
 * Format upload date to user-friendly string
 * 
 * @param dateString - ISO date string
 * @returns Formatted date (e.g., "Jan 15, 2024")
 */
function formatUploadDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return 'Unknown date';
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'Unknown date';
  }
}

/**
 * Format provider name to user-friendly string
 * 
 * @param provider - Provider identifier ('cloudinary' or 'cdn')
 * @returns Formatted provider name
 */
function formatProvider(provider: string): string {
  switch (provider) {
    case 'cloudinary': return 'Cloudinary';
    case 'cdn':        return 'CDN / R2';
    case 'supabase':   return 'Supabase';
    default:           return provider ?? 'Unknown';
  }
}

/**
 * Format metadata for compact display (e.g., in grid cards)
 * 
 * Returns a single-line summary of the most important metadata.
 * 
 * @param media - The MediaItem object
 * @returns Compact metadata string
 * 
 * @example
 * formatCompactMetadata(media) // "2.5 MB • 1920×1080 • JPEG"
 */
export function formatCompactMetadata(media: MediaItem): string {
  const parts: string[] = [];

  // Always include size
  parts.push(formatFileSize(media.size));

  // Add dimensions for images/videos
  if (media.metadata?.width && media.metadata?.height) {
    parts.push(`${media.metadata.width}×${media.metadata.height}`);
  }

  // Add duration for videos/audio
  if (media.metadata?.duration) {
    parts.push(formatDuration(media.metadata.duration));
  }

  // Add format
  if (media.metadata?.format) {
    parts.push(media.metadata.format.toUpperCase());
  }

  return parts.join(' • ');
}
