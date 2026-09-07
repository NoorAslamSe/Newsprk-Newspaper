import { Schema, model, models, type InferSchemaType } from "mongoose";

/** Which page type the snippet targets — controls where the ad is eligible to render */
export const PageTypes = ["homepage", "article", "category", "website"] as const;
export type PageType = (typeof PageTypes)[number];

/** Physical slot positions available in the page layout */
export const AdPositions = [
  "header-leaderboard",
  "top-leaderboard",
  "sticky-footer",
  "in-feed-1",
  "in-feed-2",
  "in-feed-3",
  "in-feed-4",
  "in-feed-5",
  "in-feed-6",
  "in-feed-7",
  "in-feed-8",
  "in-feed-9",
  "in-feed-10",
  "in-feed-11",
  "in-feed-12",
  "in-feed-13",
  "in-feed-14",
  "in-feed-15",
  "in-feed-x",
  "atf-rectangle",
  "in-content-1",
  "in-content-2",
  "sidebar-sticky",
  "sidebar-infeed",
  "bottom-leaderboard",
  "video-section"
] as const;
export type AdPosition = (typeof AdPositions)[number];

export const ValidationStatuses = ["valid", "invalid", "warning"] as const;
export type ValidationStatus = (typeof ValidationStatuses)[number];

/** Legacy ad type — prefer templateType for new snippets */
export const AdTypes = ["html", "image", "video", "vast"] as const;
export type AdType = (typeof AdTypes)[number];

/** Determines how the ad is assembled and rendered */
export const TemplateTypes = [
  "programmatic",  // Third-party script (e.g. Google Ad Manager tag)
  "html_banner",   // Image or HTML banner ad (static content)
  "video_banner",  // Video banner with optional VAST ads
  "direct_banner", // Legacy: kept for backward compatibility
  "direct_video",  // Legacy: kept for backward compatibility
  "vast_preroll",  // VAST/IMA video ad injected via Video.js
  "audio_ad",
  "native_feed",   // In-feed native ad styled like an ArticleCard
  "legacy"         // Raw HTML code snippet (backward-compat)
] as const;
export type TemplateType = (typeof TemplateTypes)[number];

const adSnippetSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    label: { type: String, default: "", trim: true, maxlength: 200 },
    type: { type: String, enum: AdTypes, default: "html" }, // legacy
    
    templateType: { type: String, enum: TemplateTypes, default: "legacy" },
    creativeType: { type: String, default: "" }, // 'image', 'video', 'gif', 'html'
    
    code: { type: String, default: "" }, // For programmatic/legacy
    mediaUrl: { type: String, default: "" }, // CDN url directly
    url: { type: String, default: "" }, // legacy url
    vastTagUrl: { type: String, default: "" },
    clickThroughUrl: { type: String, default: "" },
    fallbackMediaUrl: { type: String, default: "" },
    
    // Style configurations (legacy)
    width: { type: String, default: "" },
    height: { type: String, default: "" },
    padding: { type: String, default: "" },
    margin: { type: String, default: "" },
    responsiveRules: { type: Schema.Types.Mixed, default: {} },
    previewConfig: { type: Schema.Types.Mixed, default: {} },
    
    // Per-breakpoint pixel dimensions — the renderer picks the right size based on viewport
    slotSizing: {
      desktop: {
        width: { type: Number, default: 728 },
        height: { type: Number, default: 90 },
        maxWidth: { type: String, default: "100%" },
        maxHeight: { type: String, default: "auto" }
      },
      tablet: {
        width: { type: Number, default: 468 },
        height: { type: Number, default: 60 },
        maxWidth: { type: String, default: "100%" },
        maxHeight: { type: String, default: "auto" }
      },
      mobile: {
        width: { type: Number, default: 320 },
        height: { type: Number, default: 50 },
        maxWidth: { type: String, default: "100%" },
        maxHeight: { type: String, default: "auto" }
      },
      responsive: { type: Boolean, default: true },
      scaleToFit: { type: Boolean, default: true }
    },
    
    // Visual styling applied to the ad container (border, background, label visibility, etc.)
    appearance: {
      borderStyle: { type: String, default: "none" }, // none, solid, dashed, dotted
      borderWidth: { type: Number, default: 0 },
      borderColor: { type: String, default: "#e5e5e5" },
      backgroundColor: { type: String, default: "transparent" },
      borderRadius: { type: Number, default: 8 },
      boxShadow: { type: String, default: "none" },
      showLabel: { type: Boolean, default: true },
      labelText: { type: String, default: "Advertisement" },
      showInfoIcon: { type: Boolean, default: false },
      showCloseButton: { type: Boolean, default: false },
      closeButtonPosition: { type: String, default: "top-right" }, // top-right, top-left, bottom-right, bottom-left
      // Advanced Media Styling
      objectFit: { type: String, default: "cover" },
      mediaScale: { type: Number, default: 1 },
      containerScale: { type: Number, default: 1 },
      padding: {
        top: { type: Number, default: 0 },
        right: { type: Number, default: 0 },
        bottom: { type: Number, default: 0 },
        left: { type: Number, default: 0 }
      },
      margin: {
        top: { type: Number, default: 0 },
        right: { type: Number, default: 0 },
        bottom: { type: Number, default: 0 },
        left: { type: Number, default: 0 }
      }
    },

    // ── Native Feed Ad content (used when templateType === 'native_feed') ──
    nativeContent: {
      title: { type: String, default: "" },
      excerpt: { type: String, default: "" },
      image: { type: String, default: "" },
      sponsorLabel: { type: String, default: "Sponsored" },
      sponsorName: { type: String, default: "" },
      sponsorLogo: { type: String, default: "" },
      clickThroughUrl: { type: String, default: "" },
      category: { type: String, default: "" },
      categoryColor: { type: String, default: "" },
      readTime: { type: String, default: "" },
      author: { type: String, default: "" },
      layout: { type: String, enum: ["column", "row"], default: "column" },
      cardStyle: { type: String, enum: ["news-grid", "sidebar-list", "sidebar-featured", "latest-articles", "hero-side", "review-list", "carousel", "most-viewed"], default: "news-grid" },
    },

    // ── Tracking pixels for native/third-party ads ──
    trackingPixels: {
      impression: { type: String, default: "" },
      click: { type: String, default: "" },
    },
    
    // Live engagement counters — incremented by API calls from the client-side ad component
    analytics: {
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      closes: { type: Number, default: 0 },
      closeReasons: {
        inappropriate: { type: Number, default: 0 },
        coveredContent: { type: Number, default: 0 },
        seenMultiple: { type: Number, default: 0 },
        notInterested: { type: Number, default: 0 },
        other: { type: Number, default: 0 }
      },
      otherReasonDetails: [{
        text: { type: String, trim: true },
        date: { type: Date, default: Date.now }
      }],
      lastImpression: { type: Date },
      lastClick: { type: Date },
      lastClose: { type: Date },
      likes: { type: Number, default: 0 },
      lastLike: { type: Date },
      ctr: { type: Number, default: 0 } // Click-through rate (calculated)
    },
    
    pageType: { type: String, required: true, enum: PageTypes, index: true },
    position: { type: String, required: true, enum: AdPositions, index: true },
    status: { type: Boolean, default: true },
    enabled: { type: Boolean, default: true },
    
    /**
     * When true, this AdSnippet belongs to a specific article's adOverrides array.
     * It must NEVER appear in global pageType+position queries — it is only
     * fetched directly by its _id via the article's adOverrides reference.
     * This prevents per-article ads from bleeding onto all other article pages.
     */
    isArticleOverride: { type: Boolean, default: false, index: true },
    
    // Locale scoping — each deployment manages its own ad configurations
    locale: { type: String, default: "en", maxlength: 5, index: true },
    
    // Legacy Template integration fields
    templateId: { type: Schema.Types.ObjectId, ref: "AdTemplate", default: null, index: true },
    templateVariables: { type: Schema.Types.Mixed, default: {} },
    customCode: { type: Boolean, default: false },
    validationStatus: { type: String, enum: ValidationStatuses, default: "valid" },
    lastValidated: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

adSnippetSchema.index({ name: 1 }, { unique: true });

export type AdSnippetDoc = InferSchemaType<typeof adSnippetSchema>;

// In dev mode, hot-reload can leave stale cached models with old enum values.
// Delete the cached model so the updated schema (with new positions) is used.
if (process.env.NODE_ENV === "development" && models.AdSnippet) {
  delete models.AdSnippet;
}

export const AdSnippet = models.AdSnippet || model("AdSnippet", adSnippetSchema);

