import fs from "fs";
import path from "path";

/**
 * Local JSON persistence layer used when USE_DATABASE=false (no MongoDB).
 * Every call re-reads the JSON files straight from disk so writes from
 * one request are immediately visible to later requests (no stale module cache).
 */

const DATA_DIR = path.join(process.cwd(), "data");

export function useJsonStore(): boolean {
  return process.env.USE_DATABASE === "false";
}

type JsonDoc = Record<string, any>;

function readFile(file: string): any[] {
  try {
    const raw = fs.readFileSync(path.join(DATA_DIR, file), "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as any[]) : [];
  } catch {
    return [];
  }
}

function writeFile(file: string, data: any[]) {
  fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2), "utf8");
}

// ── Articles ─────────────────────────────────────────────────

function normalizeArticle(a: any): any {
  const id = a._id ? String(typeof a._id === "object" ? a._id.$oid ?? String(a._id) : a._id) : a.slug;
  return {
    ...a,
    _id: id,
    id,
    updatedAt: a.updatedAt ?? a.date ?? new Date().toISOString(),
    createdAt: a.createdAt ?? a.date ?? new Date().toISOString(),
  };
}

type ArticleMatcher = string | { _id?: string; slug?: string };

function matchArticle(a: any, idx: number, idOrSlug: string): boolean {
  const id = String(a._id);
  return id === idOrSlug || a.slug === idOrSlug || String(idx) === idOrSlug;
}

export function listArticlesRaw(): any[] {
  return readFile("articles.json").map(normalizeArticle);
}

export function findArticle(idOrSlug: string): any | null {
  const match = listArticlesRaw().find((a: any, i) => matchArticle(a, i, idOrSlug));
  return match ?? null;
}

export function createArticle(data: Record<string, any>): any {
  const articles = listArticlesRaw();
  const now = new Date().toISOString();
  const doc = normalizeArticle({
    ...data,
    _id: data._id ?? data.slug ?? `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`,
    createdAt: now,
    updatedAt: now,
  });
  articles.push(doc);
  writeFile("articles.json", articles);
  return findArticle(doc._id);
}

export function updateArticle(idOrSlug: string, patch: Record<string, any>): any | null {
  const articles = listArticlesRaw();
  const idx = articles.findIndex((a, i) => matchArticle(a, i, idOrSlug));
  if (idx === -1) return null;
  articles[idx] = {
    ...articles[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  writeFile("articles.json", articles);
  return normalizeArticle(articles[idx]);
}

export function deleteArticles(ids: string[]): number {
  const articles = listArticlesRaw();
  const set = new Set(ids);
  const remaining = articles.filter((a: any, i) => !set.has(String(a._id)) && !set.has(a.slug) && !set.has(String(i)));
  const deleted = articles.length - remaining.length;
  writeFile("articles.json", remaining);
  return deleted;
}

export function bulkSetArticleStatus(ids: string[], status: string): number {
  const articles = listArticlesRaw();
  const set = new Set(ids);
  let count = 0;
  const updated = articles.map((a: any, i) => {
    if (set.has(String(a._id)) || set.has(a.slug) || set.has(String(i))) {
      count += 1;
      return { ...a, status, updatedAt: new Date().toISOString() };
    }
    return a;
  });
  writeFile("articles.json", updated);
  return count;
}

// ── Categories ───────────────────────────────────────────────

function normalizeCategory(c: any): any {
  return {
    ...c,
    _id: c._id ? String(typeof c._id === "object" ? c._id.$oid ?? String(c._id) : c._id) : c.slug,
    name: c.label ?? c.name,
    color: c.color ?? "#64748b",
    locale: c.locale ?? "en",
  };
}

function matchCategory(c: any, idOrSlug: string): boolean {
  return String(c._id) === idOrSlug || c.slug === idOrSlug || (c.name ?? "") === idOrSlug;
}

export function listCategoriesRaw(): any[] {
  return readFile("categories.json").map(normalizeCategory);
}

export function findCategory(idOrSlug: string): any | null {
  return listCategoriesRaw().find((c) => matchCategory(c, idOrSlug)) ?? null;
}

export function createCategory(data: { name: string; color?: string; footerLabel?: string }): any {
  const categories = listCategoriesRaw();
  const slug = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const doc = {
    _id: slug,
    slug,
    label: data.name,
    color: data.color || "#64748b",
    footerLabel: data.footerLabel || "",
    count: 0,
    locale: process.env.NEXT_PUBLIC_LOCALE || "en",
  };
  categories.push(doc);
  writeFile("categories.json", categories);
  return normalizeCategory(doc);
}

export function updateCategory(idOrSlug: string, patch: Record<string, any>): any | null {
  const categories = listCategoriesRaw();
  const idx = categories.findIndex((c) => matchCategory(c, idOrSlug));
  if (idx === -1) return null;
  categories[idx] = { ...categories[idx], ...patch };
  writeFile("categories.json", categories);
  return normalizeCategory(categories[idx]);
}

export function deleteCategories(ids: string[]): number {
  const categories = listCategoriesRaw();
  const set = new Set(ids);
  const remaining = categories.filter((c: any) => !set.has(String(c._id)) && !set.has(c.slug));
  const deleted = categories.length - remaining.length;
  writeFile("categories.json", remaining);
  return deleted;
}

// ── Users ────────────────────────────────────────────────────

export function findUserByEmail(email: string): any | null {
  const users = readFile("users.json");
  const needle = email.trim().toLowerCase();
  return (
    users.find(
      (u) => String(u.email ?? "").trim().toLowerCase() === needle
    ) ?? null
  );
}

export { readFile as readJsonFile, writeFile as writeJsonFile };