import { z } from "zod";

/**
 * Zod schema for the site settings PATCH endpoint.
 * The DB stores settings as Schema.Types.Mixed under a single 'site' key,
 * so this schema provides the typed overlay for controlled updates.
 * All fields are optional — callers send only the fields they are changing.
 */

export const SettingsUpdateSchema = z.object({
  siteTitle: z.string().min(1).max(120).optional(),
  defaultSeo: z
    .object({
      metaTitle: z.string().max(60).optional(),
      metaDescription: z.string().max(160).optional(),
    })
    .optional(),
  analyticsKey: z.string().max(200).optional(),
  adsEnabled: z.boolean().optional(),
  s3: z
    .object({
      accessKeyId: z.string().max(200).optional(),
      secretAccessKey: z.string().max(200).optional(),
      bucket: z.string().max(200).optional(),
    })
    .optional(),
  adAppearance: z.any().optional(),
  adSlotSizing: z.any().optional(),
  socialLinks: z.array(z.object({
    name: z.string(),
    network: z.string(),
    url: z.string().url(),
    count: z.string().optional(),
    label: z.string().optional(),
  })).optional(),
});

