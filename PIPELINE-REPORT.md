# Data-Population Pipeline — Final Execution Report

**Project:** nextjs-clone-dailytips (Newsprk/trendsposts clone)
**Date:** 2026-09-08
**Scope:** Extract content from the downloaded Newsprk reference site + trendsposts datasets, normalize to the project schema, store as JSON, seed MongoDB, and verify the Next.js frontend (no 404s). Frontend layouts/UI/Tailwind styling were **not** modified.

---

## 1. Sources

| Source | Location | Items used |
|---|---|---|
| Newsprk reference site (static export) | `ref-static-full-website/wp.quomodosoft.com/newsprk/*/index.htm` | 45 published article pages |
| Nowvirals / trendsposts dataset | `data/Nowvirals.articles.json` | 50 articles (47 pub, 3 draft) |
| Trendsposts product reviews (from prior work) | `data/articles.json` (pre-existing 73 items) | 28 review articles preserved |
| Category master | `data/categories.json` (pre-existing 10 base categories) | 10 base + 8 referenced categories auto-added |

> Note: the project’s data directory is `data/` (there is no `src/`), so JSON output is stored there per existing convention, not `src/data`.

---

## 2. Files created

| File | Purpose |
|---|---|
| `scripts/build-data.cjs` | Extraction + normalization pipeline. Walks the ref static export, merges Nowvirals + reviews, de-duplicates by slug, enforces the article schema (`slug/title/date/status/locale/excerpt/category/categoryLabel/authorName/views/tags/articleMedia.heroCoverMedia{url,altText,fileName,mediaType}/bodyContent/bodyHtml/source`), computes category counts, and writes `data/articles.json` + `data/categories.json`. |
| `scripts/seed.cjs` | MongoDB seeding. Connects via Mongoose (with `dns.setServers(["8.8.8.8","1.1.1.1"])` override for this machine’s broken default resolver), inserts categories only-when-empty (strips string `_id`/`name` so Mongo’s ObjectId default works), upserts articles by `{slug, locale:"en"}`, recomputes category counts from live articles. Optional `--force` overwrites matching slugs. |

## 3. Files modified

| File | Change |
|---|---|
| `data/articles.json` | Regenerated — 123 normalized articles: **50 nowvirals + 45 newsprk-ref + 28 trendsposts-reviews** (previously 73). |
| `data/categories.json` | Regenerated — 18 categories with computed article counts (10 base + money, wellness, tech-leaks, offbeat, showbiz, trending, lists, gaming). |
| (env) `.env.local`, `Dailytips/.env` | MONGO_URI switched to the senior-provided production cluster `cluster0.u4w55cb.mongodb.net` (not committed — gitignored). |

## 4. Database (MongoDB Atlas — `cluster0.u4w55cb / trendsposts-db`)

Seeded via `node scripts/seed.cjs`:

```
Categories : 18        (inserted: 18)
Articles   : 123       (inserted: 73, existing: 50, updated: 0)
Users      : 1         (from earlier import)
```

- Schema is `strict: false` (additive safe); every article carries `source: "nowvirals" | "newsprk-ref" | "trendsposts-reviews"` for future filtering.
- Idempotent — re-running `seed.cjs` inserts nothing new (upsert by `{ slug, locale }`).

## 5. Frontend wiring (already in place, verified — no UI changes)

| Concern | How it reads the DB | Status |
|---|---|---|
| Homepage menu | `app/page.tsx` → `buildPostsMenu()` (DB-driven, posts flattened, titles before `:`) | ✅ 146 slug links |
| Article pages | `app/[slug]/page.tsx` (force-dynamic) → `fetchArticleBySlugFromDB` | ✅ 200 |
| Category feeds | `fetchArticles({ category })` via `app/api/articles?category=` | ✅ 200 |
| Dashboard metrics | `app/api/dashboard/metrics` | ✅ 200 |
| Nav categories | `fetchCategoriesFromDB` → `SimpleCategory` | ✅ 18 |

## 6. Verification

**Live Vercel** (`newsprk-newspaper.vercel.app`):
- `/api/dashboard/metrics` → `totalPosts: 123, publishedPosts: 120, draftPosts: 3, totalCategories: 18, totalViews: 1735521`
- Sampled 12 slugs across all three sources → **12/12 = 200**
- Homepage menu → 146 unique slug links; category feed → data

**Local dev** (`localhost:3000`, restarted with the new env):
- metrics 123 | homepage 200 | post pages 200 with **menu rendered** (the previously-reported "menu missing on post pages" bug is fixed) | category feed works

## 7. Earlier blockers resolved along the way

1. **Wrong cluster/env** — app pointed at `next-trendspostscluster`; switched to senior’s `cluster0.u4w55cb` (Vercel env + local env).
2. **Empty production DB** — seeded twice (Nowvirals import, then full pipeline build).
3. **Category insert returning 0** — seed file carried string `_id`/`name`; Mongoose ObjectId cast error. Fixed by stripping those on insert.
4. **Stale edge-cached 404** — one Nowvirals slug 404’d momentarily after seeding; resolved on re-fetch (DB confirmed to contain the doc, published/en).
5. **Local dev serving stale data** — dev server cached the pre-change env at startup; restarted.

## 8. Reproducing the pipeline

```bash
node scripts/build-data.cjs   # extract + normalize -> data/*.json
node scripts/seed.cjs         # seed MongoDB (additive; --force to overwrite)
```

Frontend pages are `force-dynamic` + DB-driven, so no redeploy is required after seeding.