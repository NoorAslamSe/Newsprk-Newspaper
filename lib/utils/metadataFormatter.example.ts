/**
 * Example Usage of Metadata Formatter
 * 
 * This file demonstrates how to use the metadata formatter functions
 * in various UI components.
 */

import {
  formatFileSize,
  formatDuration,
  formatMetadata,
  formatCompactMetadata,
} from './metadataFormatter';
import type { MediaItem } from '@/lib/types/media';

// Example 1: Format file size for display
console.log('=== File Size Formatting ===');
console.log(formatFileSize(1024)); // "1.00 KB"
console.log(formatFileSize(1572864)); // "1.50 MB"
console.log(formatFileSize(5368709120)); // "5.00 GB"

// Example 2: Format video duration
console.log('\n=== Duration Formatting ===');
console.log(formatDuration(90)); // "1:30"
console.log(formatDuration(3665)); // "1:01:05"
console.log(formatDuration(125)); // "2:05"

// Example 3: Format complete metadata for a media card
console.log('\n=== Complete Metadata Formatting ===');

const exampleImage: MediaItem = {
  _id: '123',
  filename: 'hero-banner.jpg',
  mimeType: 'image/jpeg',
  size: 2621440, // 2.5 MB
  url: 'https://cdn.example.com/hero-banner.jpg',
  provider: 'cdn',
  variants: {
    original: 'https://cdn.example.com/hero-banner.jpg',
    thumbnail: 'https://cdn.example.com/hero-banner-thumb.jpg',
    medium: 'https://cdn.example.com/hero-banner-medium.jpg',
  },
  alt: 'Hero banner image',
  metadata: {
    width: 1920,
    height: 1080,
    format: 'jpeg',
  },
  tags: ['banner', 'hero'],
  folder: 'uploads/images',
  usage: [],
  uploadedBy: {
    _id: 'user123',
    name: 'John Doe',
    email: 'john@example.com',
  },
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-01-15T10:30:00Z',
  fileType: 'image',
};

const imageMetadata = formatMetadata(exampleImage);
console.log('Image Metadata:', imageMetadata);
// {
//   size: "2.50 MB",
//   dimensions: "1920 × 1080",
//   type: "Image (JPEG)",
//   uploaded: "Jan 15, 2024",
//   provider: "Cloudinary",
//   format: "JPEG"
// }

// Example 4: Format compact metadata for grid cards
console.log('\n=== Compact Metadata Formatting ===');

const compactImage = formatCompactMetadata(exampleImage);
console.log('Compact Image:', compactImage);
// "2.50 MB • 1920×1080 • JPEG"

const exampleVideo: MediaItem = {
  _id: '456',
  filename: 'promo-video.mp4',
  mimeType: 'video/mp4',
  size: 52428800, // 50 MB
  url: 'https://cdn.example.com/promo-video.mp4',
  provider: 'cdn',
  variants: {
    original: 'https://cdn.example.com/promo-video.mp4',
    thumbnail: 'https://cdn.example.com/promo-video-thumb.jpg',
    medium: null,
  },
  alt: 'Promotional video',
  metadata: {
    width: 1920,
    height: 1080,
    duration: 185, // 3:05
    format: 'mp4',
  },
  tags: ['promo', 'video'],
  folder: 'uploads/videos',
  usage: [],
  uploadedBy: {
    _id: 'user123',
    name: 'John Doe',
    email: 'john@example.com',
  },
  createdAt: '2024-02-20T14:45:00Z',
  updatedAt: '2024-02-20T14:45:00Z',
  fileType: 'video',
};

const videoMetadata = formatMetadata(exampleVideo);
console.log('Video Metadata:', videoMetadata);
// {
//   size: "50.00 MB",
//   dimensions: "1920 × 1080",
//   duration: "3:05",
//   type: "Video (MP4)",
//   uploaded: "Feb 20, 2024",
//   provider: "CDN",
//   format: "MP4"
// }

const compactVideo = formatCompactMetadata(exampleVideo);
console.log('Compact Video:', compactVideo);
// "50.00 MB • 1920×1080 • 3:05 • MP4"

// Example 5: Usage in React component (pseudo-code)
console.log('\n=== React Component Usage Example ===');

/*
// In a MediaCard component:
import { formatCompactMetadata } from '@/lib/utils/metadataFormatter';

export function MediaCard({ media }: { media: MediaItem }) {
  const metadata = formatCompactMetadata(media);
  
  return (
    <div className="media-card">
      <img src={media.variants.thumbnail || media.url} alt={media.alt} />
      <div className="media-info">
        <h3>{media.filename}</h3>
        <p className="text-sm text-muted-foreground">{metadata}</p>
      </div>
    </div>
  );
}

// In a MediaDetailView component:
import { formatMetadata } from '@/lib/utils/metadataFormatter';

export function MediaDetailView({ media }: { media: MediaItem }) {
  const metadata = formatMetadata(media);
  
  return (
    <div className="media-details">
      <dl>
        <dt>Size:</dt>
        <dd>{metadata.size}</dd>
        
        {metadata.dimensions && (
          <>
            <dt>Dimensions:</dt>
            <dd>{metadata.dimensions}</dd>
          </>
        )}
        
        {metadata.duration && (
          <>
            <dt>Duration:</dt>
            <dd>{metadata.duration}</dd>
          </>
        )}
        
        <dt>Type:</dt>
        <dd>{metadata.type}</dd>
        
        <dt>Uploaded:</dt>
        <dd>{metadata.uploaded}</dd>
        
        <dt>Provider:</dt>
        <dd>{metadata.provider}</dd>
      </dl>
    </div>
  );
}

// In a file upload progress component:
import { formatFileSize } from '@/lib/utils/metadataFormatter';

export function UploadProgress({ file, progress }: { file: File; progress: number }) {
  return (
    <div className="upload-progress">
      <div className="flex justify-between">
        <span>{file.name}</span>
        <span>{formatFileSize(file.size)}</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <span>{progress}%</span>
    </div>
  );
}
*/

console.log('See comments above for React component usage examples');
