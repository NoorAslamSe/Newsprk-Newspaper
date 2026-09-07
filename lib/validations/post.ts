import { z } from "zod";
import { AdPositions } from "@/lib/models/AdSnippet";

/**
 * Zod schemas for article/post API endpoints.
 * PostCreateSchema matches the actual shape the frontend PostEditor sends.
 * PostUpdateSchema is a full partial for PATCH calls.
 */

// ── Sub-schemas ─────────────────────────────────────────────

const MediaItemSchema = z.object({
  url: z.string().optional().default(""),
  vastTagUrl: z.string().optional().default(""),
  poster: z.string().optional().default(""),
});

const ArticleMediaSchema = z.object({
  heroCoverMedia: MediaItemSchema.optional(),
  postBodyMedia: MediaItemSchema.optional(),
  keyTakeawaysMedia: MediaItemSchema.optional(),
  finalThoughtsMedia: MediaItemSchema.optional(),
}).optional();

const PostAdOverrideSchema = z.object({
  position: z.enum(AdPositions),
  adSnippetId: z.string().min(1),
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
});

// ── v2.0 Comparison sub-schemas (optional, for API use) ─────

const EntitySchema = z.object({
  name: z.string().optional().default(""),
  image: z.string().optional().default(""),
  priceRange: z.string().optional().default(""),
  offerId: z.string().optional().default(""),
});

const SpecRowSchema = z.object({
  feature: z.string(),
  val_A: z.string(),
  val_B: z.string(),
  winner: z.enum(["A", "B", "tie"]),
});

const StructuralBlocksSchema = z.object({
  question_answered: z.string().optional().default(""),
  context: z.string().optional().default(""),
  comparison: z.string().optional().default(""),
  action: z.string().optional().default(""),
});

const SeoMetadataSchema = z.object({
  metaTitle: z.string().max(60).optional().default(""),
  metaDescription: z.string().max(160).optional().default(""),
  ogImage: z.string().optional().default(""),
});

const VideoAssetSchema = z.object({
  cdnUrl: z.string().optional().default(""),
  poster: z.string().optional().default(""),
  duration: z.number().optional().default(0),
  provenance: z.string().optional().default(""),
});

// ── Main create schema (matches PostEditor payload) ────────

export const PostCreateSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  excerpt: z.string().max(500).optional().default(""),
  category: z.string().min(1),
  categoryLabel: z.string().optional().default(""),
  author: z.string().optional().default("admin"),
  authorName: z.string().optional().default("Admin"),
  date: z.string().optional().default(""),
  readTime: z.number().int().min(1).max(600).optional().default(5),
  featured: z.boolean().optional().default(false),
  tags: z.array(z.string()).optional().default([]),
  views: z.number().int().min(0).optional().default(0),
  status: z.enum(["draft", "staging", "review", "published", "scheduled", "archived"]).optional().default("draft"),
  locale: z.string().max(10).optional().default("en"),

  articleMedia: ArticleMediaSchema,
  bodyContent: z.string().optional().default(""),
  keyTakeawaysContent: z.string().optional().default(""),
  finalThoughtsContent: z.string().optional().default(""),
  adOverrides: z.array(PostAdOverrideSchema).optional().default([]),

  // v2.0 fields (optional — not in dashboard UI yet but supported by API)
  content_type: z.enum(["article", "comparison", "review", "sponsored"]).optional().default("article"),
  entity_A: EntitySchema.optional(),
  entity_B: EntitySchema.optional(),
  verdict_winner: z.enum(["A", "B", ""]).optional().default(""),
  spec_comparison_matrix: z.array(SpecRowSchema).optional().default([]),
  pros_cons_A: z.array(z.string()).optional().default([]),
  pros_cons_B: z.array(z.string()).optional().default([]),
  when_loser_wins: z.array(z.string()).optional().default([]),
  page_class: z.enum(["money", "support", "authority", "sponsored"]).optional().default("support"),
  structural_blocks: StructuralBlocksSchema.optional(),
  reviewer: z.string().optional().default(""),
  methodology_ref: z.string().optional().default(""),
  affiliate_offer_ids: z.array(z.string()).optional().default([]),
  seo_metadata: SeoMetadataSchema.optional(),
  hreflang_group_id: z.string().optional().default(""),
  videoAsset: VideoAssetSchema.optional(),
  is_product: z.boolean().optional().default(false),
  product_name: z.string().optional().default(""),
  product_brand: z.string().optional().default(""),
  product_price: z.string().optional().default(""),
  product_subcategory: z.string().optional().default(""),
});

export const PostUpdateSchema = PostCreateSchema.partial().extend({
  title: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(200).optional(),
});

export const PostListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(200).optional(),
  category: z.string().optional(),
  author: z.string().optional(),
  status: z.enum(["draft", "staging", "review", "published", "scheduled", "archived"]).optional(),
  tags: z.string().trim().max(200).optional(),
  sort: z.enum(["date", "views", "title"]).optional().default("date"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
  content_type: z.enum(["article", "comparison", "review", "sponsored"]).optional(),
  page_class: z.enum(["money", "support", "authority", "sponsored"]).optional(),
  stale: z.coerce.boolean().optional(),
});
