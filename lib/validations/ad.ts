import { z } from "zod";
import { AdPositions, AdTypes, PageTypes, TemplateTypes } from "@/lib/models/AdSnippet";

/**
 * Zod schemas for AdSnippet API endpoints.
 * AdSnippetCreateSchema enforces required positioning (pageType + position)
 * and provides sane defaults for all optional creative fields.
 * AdSnippetUpdateSchema is a full partial — any subset of fields is valid for PATCH.
 */

export const AdSnippetCreateSchema = z.object({
  name: z.string().min(1).max(120),
  label: z.string().max(200).optional().default(""),
  code: z.string().optional().default(""),
  pageType: z.enum(PageTypes),
  position: z.enum(AdPositions),
  enabled: z.boolean().optional().default(true),
  status: z.boolean().optional().default(true),
  
  // Legacy ad type (html/image/video/vast)
  type: z.enum(AdTypes).optional().default("html"),
  
  // New fields
  templateType: z.enum(TemplateTypes).optional().default("legacy"),
  creativeType: z.string().optional().default(""),
  
  mediaUrl: z.string().optional().default(""),
  url: z.string().optional().default(""),       // legacy — prefer mediaUrl for new snippets
  vastTagUrl: z.string().optional().default(""),
  clickThroughUrl: z.string().optional().default(""),
  fallbackMediaUrl: z.string().optional().default(""),
  
  width: z.string().optional().default(""),
  height: z.string().optional().default(""),
  padding: z.string().optional().default(""),
  margin: z.string().optional().default(""),
  
  responsiveRules: z.any().optional().default({}),
  previewConfig: z.any().optional().default({}),

  // Native Feed Ad content (used when templateType === 'native_feed')
  nativeContent: z.object({
    title: z.string().max(200).optional().default(""),
    excerpt: z.string().max(500).optional().default(""),
    image: z.string().optional().default(""),
    sponsorLabel: z.string().max(100).optional().default("Sponsored"),
    sponsorName: z.string().max(100).optional().default(""),
    sponsorLogo: z.string().optional().default(""),
    clickThroughUrl: z.string().optional().default(""),
    category: z.string().max(100).optional().default(""),
    categoryColor: z.string().optional().default(""),
    readTime: z.string().max(50).optional().default(""),
    author: z.string().max(100).optional().default(""),
    layout: z.enum(["column", "row"]).optional().default("column"),
    cardStyle: z.enum(["news-grid", "sidebar-list", "sidebar-featured", "latest-articles", "hero-side", "review-list", "carousel", "most-viewed"]).optional().default("news-grid"),
  }).optional(),

  // Tracking pixels for native/third-party ads
  trackingPixels: z.object({
    impression: z.string().optional().default(""),
    click: z.string().optional().default(""),
  }).optional(),

  // Marks this snippet as belonging to a specific article's adOverrides.
  // When true, it is excluded from global pageType+position queries so it
  // cannot bleed onto other article pages.
  isArticleOverride: z.boolean().optional().default(false),
});

/**
 * Cross-field refinement: ensure template type matches media content.
 * - html_banner should not have video/vast creativeType
 * - video_banner should not have image creativeType, needs mediaUrl or vastTagUrl
 * - native_feed should not have video creativeType
 */
export const AdSnippetCreateRefined = AdSnippetCreateSchema.refine((data) => {
  if (data.templateType === "html_banner" && (data.creativeType === "video" || data.creativeType === "vast")) return false;
  if (data.templateType === "video_banner" && data.creativeType === "image") return false;
  if (data.templateType === "video_banner" && !data.vastTagUrl && !data.mediaUrl) return false;
  if (data.templateType === "native_feed" && data.creativeType === "video") return false;
  return true;
}, {
  message: "Template type and media content mismatch — check that the uploaded media matches the selected template",
  path: ["creativeType"],
});

export const AdSnippetUpdateSchema = AdSnippetCreateSchema.partial();

