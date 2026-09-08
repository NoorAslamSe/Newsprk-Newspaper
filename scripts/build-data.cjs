/*
 * build-data.cjs — Data population pipeline, step 1+2 (Extract & Format).
 *
 * Reads the downloaded Newsprk reference site (local static export) and the
 * Nowvirals/trendsposts dataset, normalizes every record to the project's
 * article/category schema, de-duplicates by slug, and writes:
 *   - data/articles.json
 *   - data/categories.json
 *
 * The frontend is purely DB-driven; these JSON files are the canonical seed
 * source consumed by scripts/seed.cjs.
 *
 * Usage: node scripts/build-data.cjs
 */
const fs = require("fs");
const path = require("path");

const CLONE = path.join(__dirname, "..");
const DATA_DIR = path.join(CLONE, "data");
const REF_DIR = "C:/Users/jam/Desktop/Dailytips/ref-static-full-website/wp.quomodosoft.com/newsprk";

// ── Helpers ────────────────────────────────────────────────────────────────
function loadJSON(file) {
  const full = path.join(DATA_DIR, file);
  if (!fs.existsSync(full)) return [];
  const d = JSON.parse(fs.readFileSync(full, "utf8"));
  return Array.isArray(d) ? d : d.articles || [];
}

function clean(t) {
  return String(t || "")
    .replace(/&#8211;/g, "–")
    .replace(/&hellip;/g, "…")
    .replace(/&#8217;/g, "’")
    .replace(/&#8216;/g, "‘")
    .replace(/&amp;/g, "&")
    .trim();
}

function rewriteMedia(u) {
  return String(u || "")
    .replace(/https:\/\/wp\.quomodosoft\.com\/newsprk(?:meta)?\/uploads\//g, "/uploads/")
    .replace(/https:\/\/wp\.quomodosoft\.com\/newsprk\/wp-content\/uploads\//g, "/uploads/")
    .replace(/\/wp-content\/uploads\//g, "/uploads/")
    .replace(/https:\/\/wp\.quomodosoft\.com\/newsprk\//g, "/");
}

function stripScripts(h) {
  return String(h || "").replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<\/?[^>]+(>|$)/g, " ");
}

function normalizeDate(raw) {
  if (!raw) return new Date("2020-06-14T09:00:00Z").toISOString();
  const parsed = Date.parse(raw);
  return isNaN(parsed) ? new Date("2020-06-14T09:00:00Z").toISOString() : new Date(parsed).toISOString();
}

function readTime(text) {
  const words = stripScripts(text).trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

// ── 1) Nowvirals / trendsposts dataset ─────────────────────────────────────
function normalizeNowvirals() {
  const rows = loadJSON("Nowvirals.articles.json");
  return rows
    .filter((a) => a && a.slug)
    .map((a) => {
      const hero = a.articleMedia && a.articleMedia.heroCoverMedia;
      const imageUrl = rewriteMedia(hero && hero.url ? hero.url : a.image || a.thumb || "");
      return {
        slug: a.slug,
        title: clean(a.title),
        date: normalizeDate(a.date),
        status: a.status || "published",
        locale: a.locale || "en",
        excerpt: clean(a.excerpt),
        category: a.category || "business",
        categoryLabel: a.categoryLabel || "Business",
        authorName: a.authorName || a.author || "TrendsPosts",
        views: Number(a.views) || 0,
        commentsCount: Number(a.commentsCount) || 0,
        featured: !!a.featured,
        tags: Array.isArray(a.tags) ? a.tags : [],
        readTime: Number(a.readTime) || readTime(a.bodyContent || ""),
        articleMedia: {
          heroCoverMedia: {
            url: imageUrl,
            altText: clean((hero && hero.altText) || a.title),
            fileName: path.basename(imageUrl) || "",
            mediaType: "image",
          },
        },
        bodyContent: a.bodyContent ? clean(a.bodyContent).replace(/\s+/g, " ") : "",
        bodyHtml: a.bodyHtml ? rewriteMedia(a.bodyHtml) : "",
        keyTakeawaysContent: a.keyTakeawaysContent || "",
        finalThoughtsContent: a.finalThoughtsContent || "",
        adOverrides: a.adOverrides || null,
        source: "nowvirals",
      };
    });
}

// ── 2) Newsprk reference site (local static export) ───────────────────────
function extractRefArticles(map) {
  const dirs = fs.readdirSync(REF_DIR);
  const added = [];
  for (const dir of dirs) {
    const idxPath = path.join(REF_DIR, dir, "index.htm");
    if (!fs.existsSync(idxPath)) continue;
    let h = fs.readFileSync(idxPath, "utf8");
    if (!h.includes('class="single_post_heading"')) continue;

    const slug = dir;
    if (map.has(slug)) continue; // dedupe, Nowvirals wins

    const titleM = h.match(/<h1>([\s\S]*?)<\/h1>/);
    if (!titleM) continue;
    const title = clean(titleM[1]);

    const headIdx = h.indexOf('<div class="single_post_heading">');
    const exM = headIdx === -1 ? null : h.slice(headIdx).match(/<p>([\s\S]*?)<\/p>/);
    const excerpt = exM ? clean(exM[1]) : "";

    const catM = h.match(/class="post-cat"\s+href="\/category\/([^\/"]+)\/"[\s\S]*?>([\s\S]*?)<\/a>/);
    const category = catM ? catM[1] : "business";
    const categoryLabel = catM ? clean(catM[2]) : "Business";

    const dateM = h.match(/<i class="fal fa-clock"><\/i>[\s\S]*?([A-Za-z]+ \d{1,2}, \d{4})<\/li>/);
    const date = normalizeDate(dateM ? dateM[1] : "");

    const viewsM = h.match(/<i class="fal fa-eye"><\/i>[\s\S]*?([\d,]+)<\/li>/);
    const views = viewsM ? parseInt(viewsM[1].replace(/,/g, ""), 10) || 0 : 0;

    const authM = h.match(/<div class="author__data">[\s\S]*?<a href="[^"]*"[^>]*>([^<]*)<\/a>/);
    const authorName = authM ? clean(authM[1]) || "TrendsPosts" : "TrendsPosts";

    const heroM = h.match(/<div class="video_img">[\s\S]*?<img[^>]*?src="([^"]+)"/);
    const heroUrl = heroM ? rewriteMedia(heroM[1]) : "";
    const altM = h.match(/<div class="video_img">[\s\S]*?alt="([^"]*)"/);
    const heroAlt = altM ? clean(altM[1]) : title;

    const bodyStart = h.indexOf('<div class="content">');
    const artEnd = h.indexOf("</article>");
    let bodyHtml = "";
    if (bodyStart !== -1 && artEnd !== -1) {
      const close = h.lastIndexOf("</div>", artEnd);
      if (close > bodyStart) {
        bodyHtml = rewriteMedia(h.slice(bodyStart + '<div class="content">'.length, close).replace(/<script[\s\S]*?<\/script>/gi, ""));
      }
    }

    map.set(slug, {
      slug,
      title,
      date,
      status: "published",
      locale: "en",
      excerpt,
      category,
      categoryLabel,
      authorName,
      views,
      commentsCount: 0,
      featured: false,
      tags: [],
      readTime: readTime(bodyHtml || title),
      articleMedia: {
        heroCoverMedia: {
          url: heroUrl,
          altText: heroAlt,
          fileName: path.basename(heroUrl) || "",
          mediaType: "image",
        },
      },
      bodyContent: "",
      bodyHtml,
      source: "newsprk-ref",
    });
    added.push(slug);
  }
  return added;
}

// ── 2b) Product reviews (trendsposts dataset, preserved from data/articles.json) ──
function normalizeReviews(map) {
  // Slugs that came from Nowvirals or the newsprk ref site are already keyed.
  const reviews = loadJSON("articles.json").filter((a) => a && a.slug && !map.has(a.slug));
  for (const a of reviews) {
    const hero = a.articleMedia && a.articleMedia.heroCoverMedia;
    const imageUrl = rewriteMedia(
      (hero && hero.url) || a.image || a.thumb || ""
    );
    map.set(a.slug, {
      slug: a.slug,
      title: clean(a.title),
      date: normalizeDate(a.date),
      status: a.status || "published",
      locale: a.locale || "en",
      excerpt: clean(a.excerpt),
      category: a.category || "business",
      categoryLabel: a.categoryLabel || "Business",
      authorName: a.authorName || a.author || "TrendsPosts",
      views: Number(a.views) || 0,
      commentsCount: Number(a.commentsCount) || 0,
      featured: !!a.featured,
      tags: Array.isArray(a.tags) ? a.tags : [],
      readTime: Number(a.readTime) || readTime(a.bodyContent || ""),
      articleMedia: {
        heroCoverMedia: {
          url: imageUrl,
          altText: clean((hero && hero.altText) || a.title),
          fileName: path.basename(imageUrl) || "",
          mediaType: "image",
        },
      },
      bodyContent: a.bodyContent ? String(a.bodyContent).replace(/\s+/g, " ").trim() : "",
      bodyHtml: a.bodyHtml ? rewriteMedia(a.bodyHtml) : "",
      keyTakeawaysContent: a.keyTakeawaysContent || "",
      finalThoughtsContent: a.finalThoughtsContent || "",
      product_name: a.product_name || "",
      product_brand: a.product_brand || "",
      product_price: a.product_price || "",
      product_subcategory: a.product_subcategory || "",
      content_type: a.content_type || "article",
      is_product: !!a.is_product,
      adOverrides: a.adOverrides || null,
      source: "trendsposts-reviews",
    });
  }
  return reviews.length;
}

// ── 3) Categories ─────────────────────────────────────────────────────────
function normalizeCategories() {
  const cats = loadJSON("categories.json")
    .filter((c) => c && c.slug)
    .map((c) => ({
      slug: c.slug,
      label: c.label || c.name || c.slug,
      color: c.color || "#1a8cb2",
      count: Number(c.count) || 0,
      footerLabel: c.footerLabel || "",
      locale: c.locale || "en",
    }));
  return cats;
}

const FALLBACK_COLORS = [
  "#1a8cb2", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899",
  "#ef4444", "#06b6d4", "#d946ef", "#f97316", "#3b82f6",
  "#84cc16", "#14b8a6", "#f43f5e", "#6366f1", "#eab308",
];

let fallbackIdx = 0;
function categoryColor() {
  const c = FALLBACK_COLORS[fallbackIdx % FALLBACK_COLORS.length];
  fallbackIdx++;
  return c;
}

function ensureReferencedCategories(cats, articles) {
  const known = new Set(cats.map((c) => c.slug));
  const labelBySlug = {};
  for (const a of articles) {
    if (!labelBySlug[a.category]) labelBySlug[a.category] = a.categoryLabel || a.category;
  }
  for (const slug of Object.keys(labelBySlug)) {
    if (known.has(slug)) continue;
    cats.push({
      slug,
      label: labelBySlug[slug],
      color: categoryColor(),
      count: 0,
      footerLabel: "",
      locale: "en",
    });
    known.add(slug);
  }
  return cats;
}

// ── Run ───────────────────────────────────────────────────────────────────
const bySlug = new Map();
let nowvirals = 0;
for (const a of normalizeNowvirals()) {
  bySlug.set(a.slug, a);
  nowvirals++;
}
const refAdded = extractRefArticles(bySlug);
const reviewsKept = normalizeReviews(bySlug);

const articles = [...bySlug.values()].sort((a, b) => (b.date || "").localeCompare(a.date || ""));

const categories = normalizeCategories();
ensureReferencedCategories(categories, articles);
const counts = {};
for (const a of articles) counts[a.category] = (counts[a.category] || 0) + 1;
for (const c of categories) if (counts[c.slug]) c.count = counts[c.slug];

fs.writeFileSync(path.join(DATA_DIR, "articles.json"), JSON.stringify(articles, null, 2), "utf8");
fs.writeFileSync(path.join(DATA_DIR, "categories.json"), JSON.stringify(categories, null, 2), "utf8");

console.log("✅ data/articles.json  :", articles.length, "articles");
console.log("   ├─ nowvirals :", nowvirals);
console.log("   ├─ newsprk-ref extracted :", refAdded.length, "(new slugs)");
console.log("   └─ trendsposts-reviews preserved :", reviewsKept);
console.log("✅ data/categories.json :", categories.length, "categories");
console.log("   Category counts (from articles):", JSON.stringify(counts));