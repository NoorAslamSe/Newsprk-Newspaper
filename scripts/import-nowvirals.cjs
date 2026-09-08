/**
 * Import the 50-item Nowvirals dataset (the trendsposts/dailytips production
 * article dataset, schema-compatible with the article runtime) into the real
 * `trendsposts-db` database.
 *
 * Behaviour is ADDITIVE and safe:
 *  - categories: inserted only when the categories collection is empty
 *  - users:      inserted only when the users collection is empty
 *  - articles:   upserted by { slug, locale: "en" } so re-runs never duplicate
 *
 * Usage:
 *   node scripts/import-nowvirals.cjs
 */
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const dns = require("dns");

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

const DB_NAME = "trendsposts-db";

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

  console.log("\n📝 Articles (Nowvirals dataset):");
  const raw = loadJSON("data/Nowvirals.articles.json");
  const posts = Array.isArray(raw) ? raw : raw.articles || [];
  const cleanPosts = stripGeneratedFields(posts);

  let inserted = 0;
  let updated = 0;
  let skippedDraft = 0;
  const insertedFirst = [];
  for (const post of cleanPosts) {
    const exists = await Article.findOne({ slug: post.slug, locale: "en" }).lean();
    if (exists) {
      if (post.status === "draft" && exists.status !== "draft") {
        await Article.updateOne({ _id: exists._id }, { $set: { status: "draft" } });
        updated++;
      }
      continue;
    }
    const doc = { ...post, locale: "en", status: post.status || "published" };
    await Article.create(doc);
    inserted++;
    if (insertedFirst.length < 3) insertedFirst.push(post.slug);
  }
  console.log(`  Inserted : ${inserted} (${insertedFirst.join(", ")}…)`);
  console.log(`  Updated  : ${updated}`);
  console.log(`  Existing : ${cleanPosts.length - inserted - updated}`);

  console.log("\n" + "─".repeat(55));
  console.log("📊 Final state (db: trendsposts-db):");
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