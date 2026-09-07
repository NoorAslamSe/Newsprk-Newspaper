import { z } from "zod";

/**
 * Zod schemas for the Media library API endpoints.
 * MediaQuerySchema validates the filter/pagination params for the media browser.
 * The `type` enum (image/video/audio/ads) matches the tab structure in the dashboard UI.
 * MediaUpdateSchema is intentionally narrow — only alt and metadata are user-editable after upload.
 */

export const MediaQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
  q: z.string().trim().max(200).optional(),
  type: z.enum(["image", "video", "audio", "ads"]).optional(),
});

export const MediaUpdateSchema = z.object({
  alt: z.string().max(300).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

