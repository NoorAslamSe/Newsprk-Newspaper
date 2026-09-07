/**
 * Template Media Rules
 * Defines which media types (image, video, vast, html) are allowed/denied
 * for each ad template type. Used for client-side and server-side validation.
 */

export type MediaType = "image" | "video" | "vast" | "html";

export interface TemplateMediaRule {
  allowed: MediaType[];
  deny: MediaType[];
  description: string;
}

export const TEMPLATE_MEDIA_RULES: Record<string, TemplateMediaRule> = {
  image: {
    allowed: ["image"],
    deny: ["video", "vast"],
    description: "Simple responsive image advertisement — only image files allowed",
  },
  video: {
    allowed: ["video"],
    deny: ["image", "vast"],
    description: "Responsive video advertisement — only video files allowed",
  },
  vast_preroll: {
    allowed: ["vast", "video"],
    deny: ["image"],
    description: "Autoplay silent video with VAST ads — video or VAST tag URL required",
  },
  native_feed: {
    allowed: ["image"],
    deny: ["video", "vast"],
    description: "Content-style ad that blends with article cards — only image files allowed",
  },
  html_banner: {
    allowed: ["image", "html"],
    deny: ["video", "vast"],
    description: "Image or HTML banner ad — static content only, no video",
  },
  video_banner: {
    allowed: ["video", "vast"],
    deny: ["image"],
    description: "Video banner with optional VAST ads — video or VAST tag URL required",
  },
  audio: {
    allowed: ["html"],
    deny: ["video", "vast", "image"],
    description: "Audio advertisement — audio files only",
  },
  vast: {
    allowed: ["vast", "video"],
    deny: ["image"],
    description: "VAST video ad — VAST tag URL required",
  },
};

/**
 * Detect media type from file URL or MIME type.
 */
export function detectMediaType(url: string): MediaType {
  if (!url) return "html";
  const lower = url.toLowerCase();
  if (/\.(mp4|webm|mov|avi)$/i.test(lower) || lower.includes("video/")) return "video";
  if (/\.(mp3|wav|ogg|m4a)$/i.test(lower) || lower.includes("audio/")) return "html";
  if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(lower) || lower.includes("image/")) return "image";
  if (lower.includes("vast") || lower.includes("dailymotion") || lower.includes("googletagmanager")) return "vast";
  return "html";
}

/**
 * Validate that a media URL is compatible with a given template type.
 * Returns { valid, error } where error describes the mismatch.
 */
export function validateMediaForTemplate(
  templateType: string,
  mediaUrl: string
): { valid: boolean; error?: string } {
  const rules = TEMPLATE_MEDIA_RULES[templateType];
  if (!rules) return { valid: true }; // Unknown template — skip validation

  const mediaType = detectMediaType(mediaUrl);
  if (rules.deny.includes(mediaType)) {
    return {
      valid: false,
      error: `Template "${templateType}" does not support ${mediaType} files. Allowed: ${rules.allowed.join(", ")}`,
    };
  }
  return { valid: true };
}

/**
 * Validate creativeType against template type.
 */
export function validateCreativeTypeForTemplate(
  templateType: string,
  creativeType: string
): { valid: boolean; error?: string } {
  if (!creativeType) return { valid: true }; // No creative type set — skip
  const rules = TEMPLATE_MEDIA_RULES[templateType];
  if (!rules) return { valid: true };

  if (rules.deny.includes(creativeType as MediaType)) {
    return {
      valid: false,
      error: `Template "${templateType}" does not support ${creativeType} creative type. Allowed: ${rules.allowed.join(", ")}`,
    };
  }
  return { valid: true };
}
