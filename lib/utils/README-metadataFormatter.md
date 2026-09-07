# Metadata Formatter

## Overview

The Metadata Formatter provides utility functions to format media metadata into human-readable strings for display in the UI. This module is part of the Hybrid Media Upload System and implements Requirements 29.2 and 29.4.

## Location

- **Implementation**: `lib/utils/metadataFormatter.ts`
- **Tests**: `tests/unit/metadataFormatter.test.ts`
- **Examples**: `lib/utils/metadataFormatter.example.ts`

## Functions

### `formatFileSize(bytes: number): string`

Formats file size in bytes to human-readable string with appropriate units.

**Parameters:**
- `bytes` - File size in bytes

**Returns:**
- Formatted string with unit (e.g., "1.50 MB", "250 KB", "5.00 GB")

**Examples:**
```typescript
formatFileSize(1024)       // "1.00 KB"
formatFileSize(1572864)    // "1.50 MB"
formatFileSize(5368709120) // "5.00 GB"
```

**Requirements:** 29.4

---

### `formatDuration(seconds: number): string`

Formats duration in seconds to human-readable time string.

**Parameters:**
- `seconds` - Duration in seconds

**Returns:**
- Formatted time string in HH:MM:SS or MM:SS format

**Examples:**
```typescript
formatDuration(90)   // "1:30"
formatDuration(3665) // "1:01:05"
formatDuration(125)  // "2:05"
```

**Requirements:** 29.2

---

### `formatMetadata(media: MediaItem): object`

Formats complete metadata object for human-readable display.

**Parameters:**
- `media` - The MediaItem object containing metadata

**Returns:**
- Object with formatted metadata strings:
  - `size` - Formatted file size
  - `dimensions?` - Image/video dimensions (e.g., "1920 × 1080")
  - `duration?` - Video/audio duration (e.g., "3:05")
  - `type` - Media type (e.g., "Image (JPEG)")
  - `uploaded` - Upload date (e.g., "Jan 15, 2024")
  - `provider` - Provider name ("Cloudinary" or "CDN")
  - `format?` - File format (e.g., "JPEG")

**Examples:**
```typescript
const metadata = formatMetadata(imageMedia);
// {
//   size: "2.50 MB",
//   dimensions: "1920 × 1080",
//   type: "Image (JPEG)",
//   uploaded: "Jan 15, 2024",
//   provider: "Cloudinary",
//   format: "JPEG"
// }
```

**Requirements:** 29.2, 29.4

---

### `formatCompactMetadata(media: MediaItem): string`

Formats metadata for compact display (e.g., in grid cards).

**Parameters:**
- `media` - The MediaItem object

**Returns:**
- Single-line summary string with bullet separators

**Examples:**
```typescript
formatCompactMetadata(imageMedia) // "2.50 MB • 1920×1080 • JPEG"
formatCompactMetadata(videoMedia) // "50.00 MB • 1920×1080 • 3:05 • MP4"
```

## Usage in Components

### Media Card Component
```typescript
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
```

### Media Detail View
```typescript
import { formatMetadata } from '@/lib/utils/metadataFormatter';

export function MediaDetailView({ media }: { media: MediaItem }) {
  const metadata = formatMetadata(media);
  
  return (
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
    </dl>
  );
}
```

### Upload Progress Component
```typescript
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
    </div>
  );
}
```

## Testing

All functions are thoroughly tested with unit tests covering:
- Various file sizes (bytes, KB, MB, GB)
- Different duration formats (seconds, minutes, hours)
- Complete metadata formatting for images, videos, and audio
- Edge cases (zero values, negative values, invalid inputs)
- Compact metadata formatting

Run tests:
```bash
npm test -- metadataFormatter.test.ts --run
```

## Related Files

- `lib/utils/metadataParser.ts` - Parses provider-specific metadata to standardized format
- `lib/types/media.ts` - TypeScript types for MediaItem and metadata
- `lib/types/upload.ts` - TypeScript types for upload-related data

## Requirements Validation

This implementation validates the following requirements:
- **Requirement 29.2**: Format metadata into human-readable strings
- **Requirement 29.4**: Format file sizes using appropriate units (KB, MB, GB)
