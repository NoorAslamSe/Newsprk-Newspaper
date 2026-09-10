/**
 * Real-MongoDB import seed.
 *
 * Imports the newsprk reference posts (and, on a fresh database, the
 * categories/admin + remaining datasets) into the REAL MongoDB database —
 * the `dailytopnews-db` database.
 *
 * Behaviour is ADDITIVE and safe against production data:
 *  - categories: inserted only when the categories collection is empty
 *  - users:      inserted only when the users collection is empty
 *  - articles:   the 45 newsprk reference posts (articles.json entries that
 *                have no `locale`) are upserted by { slug, locale: "en" };
 *                every other article file entry is skipped when its
 *                { slug, locale } already exists.
 *
 * Usage:
 *   node scripts/db-import.cjs
 */
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const dns = require("dns");

// This machine's default resolver refuses Atlas SRV lookups.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

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

const DB_NAME = "dailytopnews-db";

function resolveUri(raw) {
  let uri = String(raw || "").trim();
  if (!uri) {
    console.error("❌ MONGO_URI is not set in .env.local / .env — cannot import.");
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
  return JSON.parse(fs.readFileSync(fullPath, "utf8"));
}

const simpleCategorySchema = new mongoose.Schema(
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
simpleCategorySchema.index({ slug: 1, locale: 1 }, { unique: true });

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    avatarUrl: { type: String, default: null },
    passwordHash: { type: String, default: null },
    roles: { type: [String], default: ["author"] },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    invitationTokenHash: { type: String, default: null },
    invitationExpiresAt: { type: Date, default: null },
    resetTokenHash: { type: String, default: null },
    resetTokenExpiresAt: { type: Date, default: null },
  },
  { strict: false, timestamps: { createdAt: true, updatedAt: true } }
);

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

const SimpleCategory = mongoose.model("SimpleCategory", simpleCategorySchema);
const User = mongoose.model("User", userSchema);
const Article = mongoose.model("Article", articleSchema);

function stripGeneratedFields(docs) {
  return docs.map((doc) => {
    const copy = { ...doc };
    delete copy._id;
    delete copy.id;
    delete copy.updatedAt;
    delete copy.createdAt;
    return copy;
  });
}

async function importData() {
  console.log("🔌 Connecting to MongoDB...");
  const uri = resolveUri(process.env.MONGO_URI || loadEnv().MONGO_URI);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 25000 });
  console.log("✅ Connected to (masked)", uri.replace(/:[^:@]*@/, ":***@"), "\n");

  // ── Categories (only when empty) ────────────────────────────
  const catCount = await SimpleCategory.countDocuments({}).catch(() => 0);
  if (catCount === 0) {
    const categoriesData = loadJSON("data/categories.json").map((c) => ({ ...c, locale: c.locale || "en" }));
    try {
      const r = await SimpleCategory.insertMany(categoriesData, { ordered: false });
      console.log(`📂 Imported ${r.length} categories ✅`);
    } catch (e) {
      console.log(`📂 Imported ${e.insertedDocs?.length || 0}/${categoriesData.length} categories`);
    }
  } else {
    console.log(`📂 Categories already present (${catCount}) — skipped.`);
  }

  // ── Users (only when empty) ─────────────────────────────────
  const userCount = await User.countDocuments({}).catch(() => 0);
  if (userCount === 0) {
    const usersData = stripGeneratedFields(loadJSON("data/users.json"));
    try {
      const r = await User.insertMany(usersData, { ordered: false });
      console.log(`👤 Imported ${r.length} users ✅`);
    } catch (e) {
      console.log(`👤 Imported ${e.insertedDocs?.length || 0}/${usersData.length} users`);
    }
  } else {
    console.log(`👤 Users already present (${userCount}) — skipped.`);
  }

  // ── Articles: upsert the 45 newsprk ref posts (locale "en") ─
  console.log("\n📝 Articles:");
  const refPosts = stripGeneratedFields(loadJSON("data/articles.json")).filter((a) => !a.locale);
  const insertedRef = [];
  const skippedRef = [];
  for (const post of refPosts) {
    const exists = await Article.findOne({ slug: post.slug, locale: "en" }).lean();
    if (exists) {
      skippedRef.push(post.slug);
      continue;
    }
    await Article.create({ ...post, locale: "en" });
    insertedRef.push(post.slug);
  }
  console.log(`  Ref posts inserted : ${insertedRef.length} (${insertedRef.slice(0, 3).join(", ")}…)`);
  console.log(`  Ref posts existing : ${skippedRef.length}`);
  console.log(`  Other locale files  : untouched (production data preserved)`);

  // ── Summary ─────────────────────────────────────────────────
  console.log("\n" + "─".repeat(55));
  console.log("📊 Final state (db: dailytopnews-db):");
  console.log(`  Categories : ${await SimpleCategory.countDocuments({})}`);
  console.log(`  Users      : ${await User.countDocuments({})}`);
  console.log(`  Articles   : ${await Article.countDocuments({})}`);
  console.log("─".repeat(55));
  console.log("✅ Done. The app now reads/writes the real trendsposts database.");
}

importData()
  .catch((error) => {
    console.error("❌ Import failed:", error);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect().then(() => process.exit(0)));