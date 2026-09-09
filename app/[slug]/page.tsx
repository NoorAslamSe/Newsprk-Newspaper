import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ArticleShell from "./article-shell";
import { buildArticleHtml } from "./build-article";
import { fetchArticleBySlug } from "@/lib/api";
import { buildPostsMenu } from "@/lib/posts-menu";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchArticleBySlug(decodeURIComponent(slug));
  if (!article) return {};
  return {
    title: `${article.title} — Newsprk`,
    description: article.excerpt || undefined,
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await fetchArticleBySlug(decodeURIComponent(slug));
  if (!article) notFound();

  const html = await buildPostsMenu(buildArticleHtml(article));
  return <ArticleShell html={html} />;
}