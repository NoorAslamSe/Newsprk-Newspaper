import { z } from "zod";

/**
 * Zod schemas for the hybrid media upload system.
 * ProviderSchema retains 'cloudinary' for backward-compat type coverage;
 * in practice getProviderRecommendation() always returns 'cdn'.
 * PresignedUrlRequestSchema validates the body sent to the pre-sign API before
 * issuing a short-lived S3/R2 pre-signed upload URL to the client.
 */

/** Upload provider — 'cloudinary' is legacy; all new uploads use 'cdn'. */
export const ProviderSchema = z.enum(["cloudinary", "cdn"]);

/**
 * Schema for file metadata during upload
 * Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5
 */
export const FileMetadataSchema = z.object({
  filename: z.string().min(1).max(260),
  mimeType: z.string().min(1).max(120),
  size: z.number().positive(),
  folder: z.string().max(200).default("uploads"),
  tags: z.array(z.string().max(50)).default([]),
  alt: z.string().max(300).default(""),
  vastTag: z.string().max(2048).optional(),
  adTiming: z.enum(["pre-roll", "mid-roll", "post-roll"]).optional(),
});

/**
 * Schema for Cloudinary upload result
 * Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5
 */
export const CloudinaryResultSchema = z.object({
  public_id: z.string(),
  secure_url: z.string().url(),
  resource_type: z.string(),
  format: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
  duration: z.number().optional(),
  bytes: z.number(),
});

/**
 * Schema for CDN (S3/R2) upload result
 * Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5
 */
export const CDNResultSchema = z.object({
  key: z.string(),
  bucket: z.string(),
  url: z.string().url(),
  size: z.number(),
});

/**
 * Schema for presigned URL request
 * Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5
 */
export const PresignedUrlRequestSchema = z.object({
  filename: z.string().min(1).max(260),
  contentType: z.string().min(1).max(120),
  folder: z.string().max(200).default("uploads"),
});

// Type exports for TypeScript
export type Provider = z.infer<typeof ProviderSchema>;
export type FileMetadata = z.infer<typeof FileMetadataSchema>;
export type CloudinaryResult = z.infer<typeof CloudinaryResultSchema>;
export type CDNResult = z.infer<typeof CDNResultSchema>;
export type PresignedUrlRequest = z.infer<typeof PresignedUrlRequestSchema>;
