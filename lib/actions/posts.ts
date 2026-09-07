"use server";

/**
 * Server Actions for article CRUD.
 * These run exclusively on the server — safe to call directly from Client Components.
 */

import { connectDB } from "@/lib/db";
import { Article } from "@/lib/models/Article";
import { ensureUniqueSlug } from "@/lib/slug";

// Input shape mirrors the Article schema fields editable from the dashboard
type ArticleCreateInput = {
  title: string;
  slug?: string;
  excerpt?: string;
  category?: string;
  categoryLabel?: string;
  author?: string;
  authorName?: string;
  date?: string;
  readTime?: number;
  image?: string;
  featured?: boolean;
  tags?: string[];
  status?: "draft" | "published" | "scheduled";
  articleImages?: {
    heroCoverImage?: string;
    postBodyImage?: string;
    keyTakeawaysImage?: string;
    finalThoughtsImage?: string;
  };
  bodyContent?: string;
  keyTakeawaysContent?: string;
  finalThoughtsContent?: string;
};

export async function createPost(input: ArticleCreateInput) {
  await connectDB();

  // Auto-generate or derive slug from provided value or title, ensuring uniqueness in the DB
  const slug = await ensureUniqueSlug({
    base: input.slug || input.title,
    exists: async (s) => (await Article.countDocuments({ slug: s })) > 0,
  });

  const created = await Article.create({
    ...input,
    slug,
    date: input.date || new Date().toISOString(), // Default to now if not provided
    status: input.status || "draft",               // New posts are drafts unless explicitly published
  });

  return { id: String(created._id) };
}

export async function updatePost(postId: string, input: Partial<ArticleCreateInput>) {
  await connectDB();

  const article = await Article.findById(postId);
  if (!article) throw new Error("Not found.");

  // Re-generate slug only when title changes, excluding self from uniqueness check
  if (input.title && input.title !== article.title) {
    article.title = input.title;
    article.slug = await ensureUniqueSlug({
      base: input.title,
      exists: async (s) =>
        (await Article.countDocuments({ slug: s, _id: { $ne: article._id } })) > 0,
    });
  }

  Object.assign(article, input); // Shallow merge remaining fields
  await article.save();
  return { ok: true };
}

export async function deletePost(postId: string) {
  await connectDB();
  const article = await Article.findById(postId);
  if (!article) throw new Error("Not found.");
  await article.deleteOne();
  return { ok: true };
}
