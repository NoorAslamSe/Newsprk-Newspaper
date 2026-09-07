import type { Article, Category, ComparisonArticle, ContentType, PageClass, Product } from "@/types";
import { connectDB } from "@/lib/db";
import { Article as ArticleModel } from "@/lib/models/Article";
import { SimpleCategory } from "@/lib/models/SimpleCategory";
import { DEPLOYMENT_LOCALE, DEFAULT_LOCALE } from "@/lib/i18n";

const API_BASE =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : process.env.NEXTAUTH_URL?.replace(/\/$/, "") || "http://localhost:3000";

function stripMongoId(obj: any): any {
  if (Array.isArray(obj)) return obj.map(stripMongoId);
  // Convert MongoDB ObjectId instances to strings (they have _id + buffer)
  // but don't discard them — they're valid reference values
  if (obj && typeof obj === "object" && obj._id && obj.buffer && obj._bsontype === "ObjectId") {
    return obj.toString();
  }
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      if (key === "_id") continue;
      cleaned[key] = stripMongoId(obj[key]);
    }
    return cleaned;
  }
  return obj;
}

function mapArticle(article: any): Article {
  const heroMediaUrl =
    article.articleMedia?.heroCoverMedia?.url || article.image || article.entity_A?.image || "";

  // Backfill articleMedia.heroCoverMedia.url when empty so all components get images
  const articleMedia = { ...(article.articleMedia || {}) };
  if (!articleMedia.heroCoverMedia) {
    articleMedia.heroCoverMedia = {};
  }
  if (!articleMedia.heroCoverMedia.url && heroMediaUrl) {
    articleMedia.heroCoverMedia = { ...articleMedia.heroCoverMedia, url: heroMediaUrl };
  }

  return {
    id: article._id?.toString?.() || article.id || article.slug || "",
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    category: article.category,
    categoryLabel: article.categoryLabel,
    author: article.author,
    authorName: article.authorName,
    date: article.date,
    readTime: article.readTime,
    image: heroMediaUrl,
    featured: article.featured,
    tags: article.tags,
    views: article.views,
    status: article.status,
    articleMedia,
    bodyContent: article.bodyContent,
    keyTakeawaysContent: article.keyTakeawaysContent,
    finalThoughtsContent: article.finalThoughtsContent,
    adOverrides: stripMongoId(article.adOverrides) || [],
    // Product article fields
    is_product: article.is_product,
    product_name: article.product_name,
    product_brand: article.product_brand,
    product_price: article.product_price,
    product_subcategory: article.product_subcategory,
    // v2.0 comparison fields
    content_type: article.content_type,
    entity_A: stripMongoId(article.entity_A),
    entity_B: stripMongoId(article.entity_B),
    verdict_winner: article.verdict_winner,
    spec_comparison_matrix: stripMongoId(article.spec_comparison_matrix) || [],
    pros_cons_A: stripMongoId(article.pros_cons_A) || [],
    pros_cons_B: stripMongoId(article.pros_cons_B) || [],
    when_loser_wins: stripMongoId(article.when_loser_wins) || [],
    page_class: article.page_class,
    structural_blocks: stripMongoId(article.structural_blocks),
    last_verified_date: article.last_verified_date
      ? new Date(article.last_verified_date).toISOString()
      : null,
    refresh_due_date: article.refresh_due_date
      ? new Date(article.refresh_due_date).toISOString()
      : null,
    reviewer: article.reviewer,
    methodology_ref: article.methodology_ref,
    affiliate_offer_ids: article.affiliate_offer_ids || [],
    seo_metadata: stripMongoId(article.seo_metadata),
    locale: article.locale,
    hreflang_group_id: article.hreflang_group_id,
    videoAsset: article.videoAsset,
    createdAt: article.createdAt?.toISOString?.(),
    updatedAt: article.updatedAt?.toISOString?.(),
  };
}

async function fetchArticlesFromDB(params?: {
  status?: string;
  category?: string;
  author?: string;
  tag?: string;
  featured?: boolean;
  limit?: number;
  search?: string;
  sort?: string;
  locale?: string;
}): Promise<Article[]> {
  try {
    await connectDB();

    const locale = params?.locale || DEPLOYMENT_LOCALE;
    let query: any = {};
    // Match articles for this locale only, exclude comparisons (they have their own route)
    query.$and = [
      { locale: locale },
      { content_type: { $nin: ["comparison", "review"] } }
    ];
    if (params?.category) query.category = params.category;
    if (params?.author) query.author = params.author;
    if (params?.featured) query.featured = true;
    if (params?.tag) query.tags = { $in: [params.tag] };
    if (params?.search) {
      query.$or = [
        { title: { $regex: params.search, $options: "i" } },
        { excerpt: { $regex: params.search, $options: "i" } },
      ];
    }

    let sortOptions: any = { date: -1 };
    if (params?.sort === 'views') {
      sortOptions = { views: -1 };
    }

    const articles = await ArticleModel.find(query)
      .limit(params?.limit || 1000)
      .sort(sortOptions)
      .lean();

    return articles.map(mapArticle);
  } catch (error) {
    console.error("Error fetching articles from DB:", error);
    return [];
  }
}

async function fetchArticleBySlugFromDB(slug: string): Promise<Article | null> {
  try {
    await connectDB();
    const normalizedSlug = slug.normalize("NFC");
    let article = await ArticleModel.findOne({ slug: normalizedSlug, locale: DEPLOYMENT_LOCALE }).lean();
    if (!article && normalizedSlug !== slug) {
      article = await ArticleModel.findOne({ slug, locale: DEPLOYMENT_LOCALE }).lean();
    }
    if (!article) return null;
    return mapArticle(article);
  } catch (error) {
    console.error("Error fetching article from DB:", error);
    return null;
  }
}

async function fetchCategoriesFromDB(): Promise<Category[]> {
  try {
    await connectDB();

    // For EN: match old categories (no locale) + EN-specific categories, deduplicate by slug
    let categories = await SimpleCategory.find({
      locale: DEPLOYMENT_LOCALE
    }).lean();

    // Fallback to default locale if no categories found for the current locale
    if (categories.length === 0 && DEPLOYMENT_LOCALE !== DEFAULT_LOCALE) {
      categories = await SimpleCategory.find({
        locale: DEFAULT_LOCALE
      }).lean();
    }

    // Deduplicate by slug — prefer the entry that has a locale match
    const slugMap = new Map<string, any>();
    for (const cat of categories) {
      const existing = slugMap.get(cat.slug);
      if (!existing || cat.locale === DEPLOYMENT_LOCALE) {
        slugMap.set(cat.slug, cat);
      }
    }
    const uniqueCategories = Array.from(slugMap.values());

    const counts = await ArticleModel.aggregate([
      { $match: { status: { $ne: "draft" }, locale: DEPLOYMENT_LOCALE } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const countMap = new Map<string, number>();
    for (const c of counts) {
      countMap.set(c._id, c.count);
    }

    const slugs = uniqueCategories.map((c: any) => c.slug);

    let latestArticles = await ArticleModel.find({
      category: { $in: slugs },
      status: "published",
      locale: DEPLOYMENT_LOCALE,
    })
      .sort({ date: -1 })
      .select("category image articleMedia")
      .lean();

    // Fallback to default locale articles if no articles found for current locale
    if (latestArticles.length === 0 && DEPLOYMENT_LOCALE !== DEFAULT_LOCALE) {
      latestArticles = await ArticleModel.find({
        category: { $in: slugs },
        status: "published",
        locale: DEFAULT_LOCALE,
      })
        .sort({ date: -1 })
        .select("category image articleMedia")
        .lean();
    }

    const latestImageMap = new Map<string, string>();
    for (const a of latestArticles as any[]) {
      if (!latestImageMap.has(a.category)) {
        const url = a.articleMedia?.heroCoverMedia?.url || a.image || "";
        latestImageMap.set(a.category, url);
      }
    }

    const categoriesWithCounts = uniqueCategories.map((cat: any) => ({
      slug: cat.slug,
      label: cat.label,
      color: cat.color || "#E53E3E",
      count: countMap.get(cat.slug) || 0,
      footerLabel: cat.footerLabel || "",
      latestImage: latestImageMap.get(cat.slug) || "",
    }));

    categoriesWithCounts.sort((a, b) => b.count - a.count);
    return categoriesWithCounts;
  } catch (error) {
    console.error("Error fetching categories from DB:", error);
    return [];
  }
}

export async function fetchArticles(params?: {
  status?: string;
  category?: string;
  author?: string;
  tag?: string;
  featured?: boolean;
  limit?: number;
  page?: number;
  search?: string;
  sort?: string;
  locale?: string;
}): Promise<{ articles: Article[]; pagination?: any }> {
  const articles = await fetchArticlesFromDB(params);
  return { articles };
}

export async function fetchArticleBySlug(slug: string): Promise<Article | null> {
  return fetchArticleBySlugFromDB(slug);
}

export async function fetchCategories(): Promise<Category[]> {
  return fetchCategoriesFromDB();
}

// ── Product catalog (megamenu + compare view) ─────────────────────

function mapProduct(article: any): Product {
  const heroImage =
    article.articleMedia?.heroCoverMedia?.url || article.image || article.entity_A?.image || "";
  return {
    slug: article.slug,
    name: article.product_name || article.title,
    brand: article.product_brand || "",
    image: heroImage,
    price: article.product_price || "",
    description: article.excerpt || "",
    category: article.category || "",
    categoryLabel: article.categoryLabel || "",
    subcategory: article.product_subcategory || "",
    locale: article.locale || DEPLOYMENT_LOCALE,
    articleSlug: article.slug,
    comparisonSlug: article.slug,
  };
}

async function fetchProductsFromDB(): Promise<Product[]> {
  try {
    await connectDB();
    const { Product } = await import("@/lib/models/Product");
    const docs = await Product.find({
      locale: DEPLOYMENT_LOCALE,
      status: "active",
    })
      .sort({ featured: -1, createdAt: -1 })
      .lean();

    return docs.map((d: any) => ({
      slug: d.slug,
      name: d.name,
      brand: d.brand || "",
      image: d.image || "",
      price: d.price || "",
      description: d.description || "",
      category: d.category || "",
      categoryLabel: d.categoryLabel || "",
      subcategory: d.subcategory || "",
      locale: d.locale || DEPLOYMENT_LOCALE,
      articleSlug: d.articleSlug || d.slug,
      comparisonSlug: d.comparisonSlug || d.slug,
    }));
  } catch (error) {
    console.error("Error fetching products from DB:", error);
    return [];
  }
}

export async function fetchProducts(): Promise<Product[]> {
  return fetchProductsFromDB();
}

// ── v2.0 Comparison-specific queries ──────────────────────────

async function fetchComparisonsFromDB(params?: {
  category?: string;
  featured?: boolean;
  limit?: number;
  page?: number;
  sort?: string;
  page_class?: PageClass;
  stale?: boolean;
  locale?: string;
}): Promise<{ articles: Article[]; pagination?: any }> {
  try {
    await connectDB();

    const locale = params?.locale || DEPLOYMENT_LOCALE;
    const query: any = {
      content_type: { $in: ["comparison", "review"] },
      status: "published",
      $and: [
        { locale: locale }
      ],
    };
    if (params?.category) query.category = params.category;
    if (params?.featured) query.featured = true;
    if (params?.page_class) query.page_class = params.page_class;
    if (params?.stale) {
      query.refresh_due_date = { $lte: new Date() };
      query.refresh_due_date = { $ne: null };
    }

    let sortOptions: any = { date: -1 };
    if (params?.sort === "views") sortOptions = { views: -1 };

    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const [articles, total] = await Promise.all([
      ArticleModel.find(query).sort(sortOptions).skip(skip).limit(limit).lean(),
      ArticleModel.countDocuments(query),
    ]);

    return {
      articles: articles.map(mapArticle),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalCount: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  } catch (error) {
    console.error("Error fetching comparisons from DB:", error);
    return { articles: [], pagination: undefined };
  }
}

async function fetchComparisonBySlugFromDB(slug: string): Promise<Article | null> {
  try {
    await connectDB();
    const article = await ArticleModel.findOne({
      slug,
      locale: DEPLOYMENT_LOCALE,
      content_type: { $in: ["comparison", "review"] },
    }).lean();
    if (!article) return null;
    return mapArticle(article);
  } catch (error) {
    console.error("Error fetching comparison from DB:", error);
    return null;
  }
}

async function fetchStaleComparisonsFromDB(): Promise<Article[]> {
  try {
    await connectDB();
    const articles = await ArticleModel.find({
      content_type: { $in: ["comparison", "review"] },
      status: "published",
      refresh_due_date: { $lte: new Date(), $ne: null },
    })
      .sort({ refresh_due_date: 1 })
      .lean();
    return articles.map(mapArticle);
  } catch (error) {
    console.error("Error fetching stale comparisons:", error);
    return [];
  }
}

export async function fetchComparisons(params?: {
  category?: string;
  featured?: boolean;
  limit?: number;
  page?: number;
  sort?: string;
  page_class?: PageClass;
  stale?: boolean;
  locale?: string;
}): Promise<{ articles: Article[]; pagination?: any }> {
  const dbResult = await fetchComparisonsFromDB(params);
  return dbResult;
}

export async function fetchComparisonBySlug(slug: string): Promise<Article | null> {
  const dbResult = await fetchComparisonBySlugFromDB(slug);
  return dbResult;
}

export async function fetchStaleComparisons(): Promise<Article[]> {
  return fetchStaleComparisonsFromDB();
}

// ── Homepage Settings ────────────────────────────────────────────────

const FEATURED_IDS_KEY = "homepage.featuredComparisons";
const MAX_COUNT_KEY = "homepage.featuredComparisonsMaxCount";
const DEFAULT_MAX_COUNT = 6;

export async function fetchHomepageSettings(): Promise<{
  featuredComparisonIds: string[];
  maxCount: number;
}> {
  try {
    const { Setting } = await import("@/lib/models/Setting");
    await connectDB();

    const [idsSetting, maxCountSetting] = await Promise.all([
      Setting.findOne({ key: FEATURED_IDS_KEY, locale: DEPLOYMENT_LOCALE }).lean(),
      Setting.findOne({ key: MAX_COUNT_KEY, locale: DEPLOYMENT_LOCALE }).lean(),
    ]);

    const featuredComparisonIds = Array.isArray(idsSetting?.value)
      ? (idsSetting.value as string[])
      : [];
    const maxCount = typeof maxCountSetting?.value === "number"
      ? (maxCountSetting.value as number)
      : DEFAULT_MAX_COUNT;

    return { featuredComparisonIds, maxCount };
  } catch (error) {
    console.error("Error fetching homepage settings:", error);
    return { featuredComparisonIds: [], maxCount: DEFAULT_MAX_COUNT };
  }
}

export function resolveFeaturedComparisons(
  allComparisons: ComparisonArticle[],
  ids: string[],
  maxCount: number
): ComparisonArticle[] {
  // When no admin-set IDs, show top comparisons sorted by views
  if (!ids.length) {
    return [...allComparisons]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, maxCount);
  }

  const byId = new Map(allComparisons.map((c) => [c.id, c]));
  const resolved: ComparisonArticle[] = [];

  for (const id of ids) {
    if (resolved.length >= maxCount) break;
    const found = byId.get(id);
    if (found) resolved.push(found);
  }

  return resolved;
}
