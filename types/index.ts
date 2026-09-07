export interface MediaItem {
  url: string;
  vastTagUrl: string;
  poster: string;
}

export interface ArticleMedia {
  heroCoverMedia?: MediaItem;
  postBodyMedia?: MediaItem;
  keyTakeawaysMedia?: MediaItem;
  finalThoughtsMedia?: MediaItem;
  vastAdSlotIds?: string[];
}

export type ContentType = "article" | "comparison" | "review" | "sponsored";
export type PageClass = "money" | "support" | "authority" | "sponsored";

export interface Entity {
  name: string;
  image: string;
  priceRange: string;
  offerId: string;
}

export interface SpecRow {
  feature: string;
  val_A: string;
  val_B: string;
  winner: "A" | "B" | "tie";
}

export interface StructuralBlocks {
  question_answered: string;
  context: string;
  comparison: string;
  action: string;
}

export interface VideoAsset {
  cdnUrl: string;
  poster: string;
  duration: number;
  provenance: string;
}

export interface SeoMetadata {
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  jsonLd?: Record<string, unknown> | null;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  categoryLabel: string;
  author: string;
  authorName: string;
  date: string;
  readTime: number;
  image?: string;
  featured: boolean;
  tags: string[];
  views: number;
  status?: string;
  articleMedia?: ArticleMedia;
  bodyContent?: string;
  keyTakeawaysContent?: string;
  finalThoughtsContent?: string;
  adOverrides?: { position: string; adSnippetId: string; width?: number; height?: number }[];
  // Product article fields
  is_product?: boolean;
  product_name?: string;
  product_brand?: string;
  product_price?: string;
  product_subcategory?: string;
  // Comparison fields (v2.0)
  content_type?: ContentType;
  entity_A?: Entity;
  entity_B?: Entity;
  verdict_winner?: "A" | "B" | "";
  spec_comparison_matrix?: SpecRow[];
  pros_cons_A?: string[];
  pros_cons_B?: string[];
  when_loser_wins?: string[];
  page_class?: PageClass;
  structural_blocks?: StructuralBlocks;
  last_verified_date?: string | null;
  refresh_due_date?: string | null;
  reviewer?: string;
  methodology_ref?: string;
  affiliate_offer_ids?: string[];
  seo_metadata?: SeoMetadata;
  locale?: string;
  hreflang_group_id?: string;
  videoAsset?: VideoAsset;
  createdAt?: string;
  updatedAt?: string;
}

export interface ComparisonArticle extends Article {
  content_type: "comparison" | "review";
  entity_A: Entity;
  entity_B: Entity;
  entity_C?: Entity;
  verdict_winner: "A" | "B" | "";
  spec_comparison_matrix: SpecRow[];
  pros_cons_A: string[];
  pros_cons_B: string[];
  when_loser_wins: string[];
  page_class: PageClass;
  structural_blocks: StructuralBlocks;
  last_verified_date: string | null;
  refresh_due_date: string | null;
  reviewer: string;
  methodology_ref: string;
  affiliate_offer_ids: string[];
  locale: string;
  hreflang_group_id: string;
  videoAsset?: VideoAsset;
}

export interface Category {
  slug: string;
  label: string;
  color: string;
  count: number;
  locale?: string;
  footerLabel?: string;
  latestImage?: string;
}

export interface Product {
  slug: string;
  name: string;
  brand: string;
  image: string;
  price: string;
  description: string;
  category: string;
  categoryLabel: string;
  subcategory: string;
  locale: string;
  articleSlug: string;
  comparisonSlug: string;
}

export interface AuthorCredentials {
  experience: string;
  specializations: string[];
  education: string;
  previousPublications: string[];
  linkedin: string;
  verified: boolean;
}

export interface Author {
  slug: string;
  name: string;
  role: string;
  bio: string;
  avatar: string;
  credentials?: AuthorCredentials;
  social: Partial<Record<string, string>>;
}

export interface HomepageSettings {
  featuredComparisonIds: string[];
  maxCount: number;
}

export interface Comment {
  id: string;
  articleSlug: string;
  authorName: string;
  content: string;
  rating: number;
  parentCommentId?: string;
  createdAt: string;
}
