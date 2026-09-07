import { Schema, model, models, type InferSchemaType } from "mongoose";

/**
 * Per-article ad override — lets editors swap a specific slot's ad
 * without touching the global AdSnippet configuration.
 */
const adOverrideSchema = new Schema(
  {
    position: {
      type: String,
      required: true,
      enum: [
        "top-leaderboard",
        "atf-rectangle",
        "sticky-footer",
        "in-content-1",
        "in-content-2",
        "sidebar-sticky",
        "bottom-leaderboard"
      ],
    },
    adSnippetId: {
      type: Schema.Types.ObjectId,
      ref: "AdSnippet",
      required: true,
    },
    width: { type: Number, default: null },
    height: { type: Number, default: null },
  },
  { _id: false }
);

// A URL + optional VAST tag URL pair used inside each article media slot
const mediaItemSchema = new Schema(
  {
    url: { type: String, default: "" },
    vastTagUrl: { type: String, default: "" },
    poster: { type: String, default: "" },
  },
  { _id: false }
);

/**
 * External URL media & VAST Tags for each article section.
 */
const articleMediaSchema = new Schema(
  {
    heroCoverMedia: { type: mediaItemSchema, default: () => ({}) },
    postBodyMedia: { type: mediaItemSchema, default: () => ({}) },
    keyTakeawaysMedia: { type: mediaItemSchema, default: () => ({}) },
    finalThoughtsMedia: { type: mediaItemSchema, default: () => ({}) },
    vastAdSlotIds: { type: [Schema.Types.ObjectId], ref: "AdSnippet", default: [] },
  },
  { _id: false }
);

const articleSchema = new Schema(
  {
    slug: { type: String, required: true },
    title: { type: String, required: true },
    excerpt: { type: String, default: "" },
    category: { type: String, default: "uncategorized" },
    categoryLabel: { type: String, default: "Uncategorized" },
    author: { type: String, default: "unknown" },
    authorName: { type: String, default: "Unknown Author" },
    date: { type: String, required: true },
    readTime: { type: Number, default: 5 },
    image: { type: String, default: "" },
    featured: { type: Boolean, default: false },
    tags: [{ type: String }],
    views: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["draft", "staging", "review", "published", "scheduled", "archived"],
      default: "published",
    },
    articleMedia: { type: articleMediaSchema, default: () => ({}) },
    bodyContent: { type: String, default: "" },
    keyTakeawaysContent: { type: String, default: "" },
    finalThoughtsContent: { type: String, default: "" },
    adOverrides: { type: [adOverrideSchema], default: [] },

    // ── Product Article Fields ───────────────────────────────
    is_product: { type: Boolean, default: false },
    product_name: { type: String, default: "" },
    product_brand: { type: String, default: "" },
    product_price: { type: String, default: "" },
    product_subcategory: { type: String, default: "" },

    // ── v2.0 Content Type ────────────────────────────────────
    content_type: {
      type: String,
      enum: ["article", "comparison", "review", "sponsored"],
      default: "article",
    },

    // ── v2.0 Comparison Data ─────────────────────────────────
    entity_A: {
      name: { type: String, default: "" },
      image: { type: String, default: "" },
      priceRange: { type: String, default: "" },
      offerId: { type: String, default: "" },
    },
    entity_B: {
      name: { type: String, default: "" },
      image: { type: String, default: "" },
      priceRange: { type: String, default: "" },
      offerId: { type: String, default: "" },
    },
    verdict_winner: { type: String, default: "" },
    spec_comparison_matrix: [
      {
        feature: { type: String, required: true },
        val_A: { type: String, required: true },
        val_B: { type: String, required: true },
        winner: { type: String, enum: ["A", "B", "tie"], default: "tie" },
      },
    ],
    pros_cons_A: [{ type: String }],
    pros_cons_B: [{ type: String }],
    when_loser_wins: [{ type: String }],

    // ── v2.0 Page Classification ────────────────────────────
    page_class: {
      type: String,
      enum: ["money", "support", "authority", "sponsored"],
      default: "support",
    },

    // ── v2.0 Structural Content Enforcement ──────────────────
    structural_blocks: {
      question_answered: { type: String, default: "" },
      context: { type: String, default: "" },
      comparison: { type: String, default: "" },
      action: { type: String, default: "" },
    },

    // ── v2.0 Freshness ──────────────────────────────────────
    last_verified_date: { type: Date, default: null },
    refresh_due_date: { type: Date, default: null },

    // ── v2.0 Compliance ─────────────────────────────────────
    reviewer: { type: String, default: "" },
    methodology_ref: { type: String, default: "" },
    affiliate_offer_ids: [{ type: String }],

    // ── v2.0 SEO ────────────────────────────────────────────
    seo_metadata: {
      metaTitle: { type: String, default: "" },
      metaDescription: { type: String, default: "" },
      ogImage: { type: String, default: "" },
      jsonLd: { type: Schema.Types.Mixed, default: null },
    },

    // ── v2.0 Locale (built now, EN-only per D2) ─────────────
    locale: { type: String, default: "en" },
    hreflang_group_id: { type: String, default: "" },

    // ── v2.0 Video Readiness (D4 — schema-ready) ────────────
    videoAsset: {
      cdnUrl: { type: String, default: "" },
      poster: { type: String, default: "" },
      duration: { type: Number, default: 0 },
      provenance: { type: String, default: "" },
    },
  },
  {
    timestamps: true,
  }
);

articleSchema.index({ status: 1 });
articleSchema.index({ category: 1 });
articleSchema.index({ featured: 1 });
articleSchema.index({ title: "text", slug: "text" });
articleSchema.index({ content_type: 1 });
articleSchema.index({ page_class: 1 });
articleSchema.index({ refresh_due_date: 1 });
articleSchema.index({ "entity_A.name": "text", "entity_B.name": "text" });
articleSchema.index({ locale: 1, date: -1 });
articleSchema.index({ slug: 1, locale: 1 }, { unique: true });

// `models.Article` check prevents Mongoose from re-registering the model on hot-reload in dev

export type ArticleDoc = InferSchemaType<typeof articleSchema>;

export const Article = models.Article || model("Article", articleSchema); // singleton guard