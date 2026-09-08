/*
 * seed.cjs — Data population pipeline, step 3 (Database Seeding).
 *
 * Reads the canonical data/articles.json + data/categories.json produced by
 * scripts/build-data.cjs and populates the connected MongoDB database
 * (cluster0.u4w55cb.mongodb.net / trendsposts-db).
 *
 * Behaviour is ADDITIVE and safe:
 *  - categories: inserted only when the categories collection is empty
 *    (string `_id`/`name` fields present in the seed file are stripped so
 *    Mongo's ObjectId default works — this matches the SimpleCategory model).
 *  - articles: upserted by { slug, locale: "en" } so re-runs never duplicate;
 *    existing documents are left untouched unless --force is passed.
 *
 * Usage:
 *   node scripts/seed.cjs            # additive
 *   node scripts/seed.cjs --force    # overwrite fields of matching slugs
 */
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const dns = require("dns");

// This machine's default resolver refuses Atlas SRV lookups.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const FORCE = process.argv.includes("--force");

function loadEnv() {
  const targets = [path.join(__dirname, "..", ".env.local"), path.join(__dirname, "..", ".env")];
  let out = {};
  for (const t of targets) {
    if (!fs.existsSync(t)) continue;
    for (const line of fs.readFileSync(t, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)=(.*)\s*$/);
      if (!m) continue;
      out[m[1]] = m[2].trim();
    }
  }
  return out;
}

const DB_NAME = "trendsposts-db";

function resolveUri(raw) {
  let uri = String(raw || "").trim();
  if (!uri) {
    console.error("❌ MONGO_URI is not set in .env.local / .env — cannot seed.");
    process.exit(1);
  }
  if (!uri.includes("/" + DB_NAME)) {
    const base = uri.split("?")[0].replace(/\/+$/, "");
    const params = uri.includes("?") ? "?" + uri.split("?")[1] : "";
    uri = `${base}/${DB_NAME}${params}`;
  }
  return uri;
}

function loadJSON(relativePath) {
  const fullPath = path.join(__dirname, "..", relativePath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`⚠️  Missing file (skipping): ${relativePath}`);
    return [];
  }
  const d = JSON.parse(fs.readFileSync(fullPath, "utf8"));
  return Array.isArray(d) ? d : d.articles || [];
}

const categorySchema = new mongoose.Schema(
  {
    slug: { type: String, required: true },
    label: { type: String, required: true },
    color: { type: String, default: "#1a8cb2" },
    count: { type: Number, default: 0 },
    locale: { type: String, default: "en" },
    footerLabel: { type: String, default: "" },
  },
  { strict: false, collection: "categories" }
);
categorySchema.index({ slug: 1, locale: 1 }, { unique: true });

const articleSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true },
    title: { type: String, required: true },
    date: { type: String, default: () => new Date().toISOString() },
    locale: { type: String, default: "en" },
  },
  { strict: false, timestamps: true }
);
articleSchema.index({ slug: 1, locale: 1 }, { unique: true });

const Category = mongoose.model("Category", categorySchema);
const Article = mongoose.model("Article", articleSchema);

async function seed() {
  console.log("🔌 Connecting to MongoDB...");
  const uri = resolveUri(process.env.MONGO_URI || loadEnv().MONGO_URI);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 25000 });
  console.log("✅ Connected to (masked) " + uri.replace(/:[^:@]*@/, ":***@"));

  // ── Categories: insert only when empty; strip _id/name ───────────
  const catCount = await Category.countDocuments({}).catch(() => 0);
  if (catCount === 0) {
    const cats = loadJSON("data/categories.json").map((c) => {
      const copy = { ...c };
      delete copy._id;
      delete copy.name;
      return copy;
    });
    try {
      const r = await Category.insertMany(cats, { ordered: false });
      console.log(`📂 Categories: inserted ${r.length}`);
    } catch (e) {
      console.log(`📂 Categories: inserted ${(e.insertedDocs && e.insertedDocs.length) || 0}/${cats.length} (partial)`);
    }
  } else {
    console.log(`📂 Categories: already present (${catCount}) — skipped.`);
  }

  // ── Articles: upsert by { slug, locale: "en" } ────────────────────
  const posts = loadJSON("data/articles.json");
  let inserted = 0;
  let updated = 0;
  let existing = 0;
  for (const post of posts) {
    const locale = post.locale || "en";
    const query = { slug: post.slug, locale };
    const exists = await Article.findOne(query).lean();
    if (exists) {
      if (FORCE) {
        await Article.updateOne({ _id: exists._id }, { $set: { ...post, slug: post.slug, locale } });
        updated++;
      } else {
        existing++;
      }
      continue;
    }
    await Article.create({ ...post, slug: post.slug, locale });
    inserted++;
  }

  // ── Recompute category counts from the dataset ─────────────────────
  const counts = {};
  const all = await Article.find({ status: "published" }).select("category").lean();
  for (const a of all) if (a.category) counts[a.category] = (counts[a.category] || 0) + 1;
  for (const [slug, count] of Object.entries(counts)) {
    await Category.updateOne({ slug, locale: "en" }, { $set: { count } }).catch(() => {});
  }

  console.log("\n📊 Final state (db: trendsposts-db):");
  console.log(`  Categories : ${await Category.countDocuments({})}`);
  console.log(`  Articles   : ${await Article.countDocuments({})}`);
  console.log(`   ├ inserted : ${inserted}`);
  console.log(`   ├ updated  : ${updated}`);
  console.log(`   └ existing : ${existing}`);
  console.log("✅ Done. The frontend now reads the seeded database.");
}

seed()
  .catch((e) => {
    console.error("❌ Seed failed:", e.message);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect().then(() => process.exit(0)));