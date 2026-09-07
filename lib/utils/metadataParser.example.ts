/**
 * Metadata Parser Usage Examples
 * 
 * This file demonstrates how to use the metadata parser functions
 * to transform upload results into standardized format before saving
 * to the database.
 */

import { parseCloudinaryMetadata, parseCDNMetadata } from './metadataParser';
import { saveMediaMetadataAction } from '@/lib/actions/media';

/**
 * Example 1: Parse Cloudinary upload result and save to database
 * 
 * This example shows how to use parseCloudinaryMetadata after a successful
 * Cloudinary upload to transform the result into the standardized format
 * before saving to MongoDB.
 */
export async function exampleCloudinaryUploadFlow() {
  // Step 1: Upload to Cloudinary (using cloudinaryUploader)
  const cloudinaryResponse = {
    public_id: 'Trendsposts/images/sample-photo',
    secure_url: 'https://res.cloudinary.com/demo/image/upload/v1234567890/Trendsposts/images/sample-photo.jpg',
    format: 'jpg',
    resource_type: 'image',
    bytes: 2048000,
    width: 1920,
    height: 1080,
    asset_id: 'abc123',
    version: 1234567890,
  };

  // Step 2: Parse the Cloudinary result into standardized format
  const metadata = parseCloudinaryMetadata(cloudinaryResponse, {
    tags: ['sample', 'photo'],
    alt: 'Sample photo description',
    folder: 'Trendsposts/images',
    uploadedBy: 'user123',
  });

  // Step 3: Save to database using server action
  const result = await saveMediaMetadataAction(metadata);

  if (result.success) {
    console.log('Media saved successfully:', result.data._id);
    return result.data;
  } else {
    console.error('Failed to save media:', result.error);
    throw new Error(result.error);
  }
}

/**
 * Example 2: Parse CDN upload result and save to database
 * 
 * This example shows how to use parseCDNMetadata after a successful
 * CDN (S3/R2) upload to transform the result into the standardized format
 * before saving to MongoDB.
 */
export async function exampleCDNUploadFlow() {
  // Step 1: Upload to CDN (using cdnUploader)
  const cdnResponse = {
    key: 'uploads/videos/sample-video.mp4',
    url: 'https://cdn.example.com/uploads/videos/sample-video.mp4',
    size: 10485760,
    bucket: 'Trendsposts-media',
  };

  // Original File object (needed for filename and MIME type)
  const file = new File([''], 'sample-video.mp4', { type: 'video/mp4' });

  // Step 2: Parse the CDN result into standardized format
  const metadata = parseCDNMetadata(cdnResponse, file, {
    tags: ['video', 'sample'],
    alt: 'Sample video description',
    folder: 'uploads/videos',
    uploadedBy: 'user456',
  });

  // Step 3: Save to database using server action
  const result = await saveMediaMetadataAction(metadata);

  if (result.success) {
    console.log('Media saved successfully:', result.data._id);
    return result.data;
  } else {
    console.error('Failed to save media:', result.error);
    throw new Error(result.error);
  }
}

/**
 * Example 3: Parse advertisement media with VAST tag
 * 
 * This example shows how to include ad-specific metadata when parsing
 * upload results for advertisement media.
 */
export async function exampleAdUploadFlow() {
  // Cloudinary upload result for video ad
  const cloudinaryResponse = {
    public_id: 'Trendsposts/ads/promo-ad',
    secure_url: 'https://res.cloudinary.com/demo/video/upload/v1234567890/Trendsposts/ads/promo-ad.mp4',
    format: 'mp4',
    resource_type: 'video',
    bytes: 5242880,
    width: 1920,
    height: 1080,
    duration: 30,
  };

  // Parse with ad-specific metadata
  const metadata = parseCloudinaryMetadata(cloudinaryResponse, {
    tags: ['ad', 'promo'],
    alt: 'Promotional advertisement',
    folder: 'Trendsposts/ads',
    vastTag: 'https://example.com/vast/promo-ad.xml',
    adTiming: 'pre-roll',
    uploadedBy: 'admin123',
  });

  // Save to database
  const result = await saveMediaMetadataAction(metadata);

  if (result.success) {
    console.log('Ad media saved successfully:', result.data._id);
    return result.data;
  } else {
    console.error('Failed to save ad media:', result.error);
    throw new Error(result.error);
  }
}

/**
 * Example 4: Error handling for missing required fields
 * 
 * This example demonstrates how the parser validates required fields
 * and throws errors when they are missing.
 */
export function exampleErrorHandling() {
  try {
    // Invalid Cloudinary response (missing secure_url)
    const invalidResponse = {
      public_id: 'test',
      format: 'jpg',
      resource_type: 'image',
      bytes: 1024,
    } as any;

    // This will throw an error
    parseCloudinaryMetadata(invalidResponse);
  } catch (error) {
    console.error('Validation error:', error);
    // Error: Missing required field: secure_url (url)
  }
}

/**
 * Integration with Upload Components
 * 
 * In practice, the metadata parser would be used within the upload handlers:
 * 
 * 1. In cloudinaryUploader.ts:
 *    - After successful upload, call parseCloudinaryMetadata
 *    - Pass the parsed metadata to saveMediaMetadataAction
 * 
 * 2. In cdnUploader.ts:
 *    - After successful upload, call parseCDNMetadata
 *    - Pass the parsed metadata to saveMediaMetadataAction
 * 
 * This ensures all media records in the database have a consistent structure
 * regardless of which provider was used for the upload.
 */
