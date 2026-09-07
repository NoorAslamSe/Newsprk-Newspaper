/* Seed data/articles.json with the reference Newsprk article posts so that
   homepage/feed/sidebar cards (which link to /slug/) no longer 404.
   Idempotent: skips slugs already present in articles.json. */
const fs = require("fs");
const path = require("path");

const REF_DIR = "C:/Users/jam/Desktop/Dailytips/ref-static-full-website/wp.quomodosoft.com/newsprk";
const DATA_FILE = path.join(__dirname, "..", "data", "articles.json");

const articles = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
const existing = new Set(articles.map((a) => a.slug));
const seeded = [];

function rewriteMedia(u) {
  return String(u)
    .replace(/https:\/\/wp\.quomodosoft\.com\/newsprk(?:meta)?\/uploads\//g, "/uploads/")
    .replace(/https:\/\/wp\.quomodosoft\.com\/newsprk\/wp-content\/uploads\//g, "/uploads/")
    .replace(/\/wp-content\/uploads\//g, "/uploads/");
}
function stripScripts(h) {
  return h.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/\/wp-content\/uploads\//g, "/uploads/");
}
function clean(t) {
  return (t || "").replace(/&#8211;/g, "–").replace(/&hellip;/g, "…").replace(/&#8217;/g, "’").trim();
}
function extractWithWindow(s, startTag) {
  const i = s.indexOf(startTag);
  if (i === -1) return "";
  const sub = s.slice(i);
  const j = sub.search(/<\/div>/);
  return j === -1 ? "" : sub.slice(0, j + 6);
}

const dirs = fs.readdirSync(REF_DIR);
let scanned = 0;
for (const dir of dirs) {
  const slug = dir;
  const idxPath = path.join(REF_DIR, dir, "index.htm");
  if (!fs.existsSync(idxPath)) continue;
  let h = fs.readFileSync(idxPath, "utf8");
  if (!h.includes('class="single_post_heading"')) continue;
  scanned++;
  if (existing.has(slug)) continue;

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
  const dateRaw = dateM ? dateM[1] : "";
  const parsed = dateRaw ? Date.parse(dateRaw) : NaN;
  const date = !isNaN(parsed) ? new Date(parsed).toISOString() : new Date("2020-06-14T09:00:00Z").toISOString();

  const viewsM = h.match(/<i class="fal fa-eye"><\/i>[\s\S]*?([\d,]+)<\/li>/);
  const views = viewsM ? parseInt(viewsM[1].replace(/,/g, ""), 10) || 0 : 0;

  const authM = h.match(/<div class="author__data">[\s\S]*?<a href="[^"]*">[\s\S]*?>([\s\S]*?)<\/a>/);
  const authorName = authM ? clean(authM[1]) || "TrendsPosts" : "TrendsPosts";

  const heroM = h.match(/<div class="video_img">[\s\S]*?<img[^>]*?src="([^"]+)"/);
  let heroUrl = heroM ? rewriteMedia(heroM[1]) : "";
  const altM = h.match(/<div class="video_img">[\s\S]*?alt="([^"]*)"/);
  const heroAlt = altM ? altM[1].trim() : title;

  const bodyStart = h.indexOf('<div class="content">');
  const artEnd = h.indexOf("</article>");
  let bodyHtml = "";
  if (bodyStart !== -1 && artEnd !== -1) {
    const close = h.lastIndexOf("</div>", artEnd);
    if (close > bodyStart) {
      bodyHtml = rewriteMedia(stripScripts(h.slice(bodyStart + '<div class="content">'.length, close)));
    }
  }

  const rec = {
    _id: slug,
    id: slug,
    slug,
    title,
    date,
    updatedAt: date,
    createdAt: date,
    status: "published",
    excerpt,
    authorName,
    category,
    categoryLabel,
    views,
    commentsCount: 0,
    tags: [],
    articleMedia: {
      heroCoverMedia: { url: heroUrl, altText: heroAlt, fileName: path.basename(heroUrl) || "", mediaType: "image" },
    },
    bodyContent: "",
    bodyHtml,
  };
  articles.push(rec);
  seeded.push(slug);
}

fs.writeFileSync(DATA_FILE, JSON.stringify(articles, null, 2), "utf8");
console.log("scanned article dirs:", scanned, "| newly seeded:", seeded.length);