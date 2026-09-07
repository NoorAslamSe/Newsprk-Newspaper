/**
 * Returns the storage folder path for a file based on provider, MIME type, and purpose.
 * Centralises path conventions so all uploaders write to consistent locations.
 */
export function getFolderPath(
  provider: 'cloudinary' | 'cdn',
  mimeType: string,
  purpose: 'ad' | 'standard' = 'standard'
): string {
  if (provider === 'cloudinary') {
    if (purpose === 'ad') return 'Trendsposts/ads';
    return 'Trendsposts/images';
  } else {
    // CDN: organised by purpose first, then by media type for standard uploads
    if (purpose === 'ad') return '/uploads/ads';
    if (mimeType.startsWith('video/')) return '/uploads/videos';
    return '/uploads/images'; // Default CDN path for images and other types
  }
}
