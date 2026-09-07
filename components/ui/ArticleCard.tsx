"use client";

import Link from "next/link";
import Image from "next/image";
import type { Article, Category } from "@/types";
import CategoryBadge from "./CategoryBadge";
import { useBookmarkStore } from "@/hooks/useBookmarkStore";
import { toast } from "sonner";
import { formatDate } from "@/lib/dateFormat";

// Helper to determine if a URL points to video content
const isVideoUrl = (url?: string) => {
    if (!url) return false;
    const cleanUrl = url.split('?')[0].toLowerCase();
    return cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.mov') || cleanUrl.endsWith('.m4v');
};

interface Props {
    article: Article;
    variant?: "grid" | "list" | "small" | "hero";
    categories?: Category[];
    priority?: boolean;
    counter?: number; // numbered counter for trending/most-read lists
}

// ── Shared meta line ──────────────────────────────────────────────
function ArticleMeta({ article, isHero }: { article: Article; isHero?: boolean }) {
    return (
        <div
            className="flex items-center gap-2 flex-wrap"
            style={{ 
                fontSize: "var(--meta-fsize)", 
                color: isHero ? "rgba(255,255,255,0.8)" : "var(--meta-fcolor)" 
            }}
        >
            <span style={{ color: isHero ? "#fff" : "var(--heading-color)", fontWeight: 600 }}>
                {article.authorName}
            </span>
            <span className="opacity-30">•</span>
            <span>
                {formatDate(article.date, { month: "short", day: "numeric", year: "numeric" })}
            </span>
            <span className="opacity-30">•</span>
            <span>{article.readTime} min read</span>
        </div>
    );
}

// ── Grid variant (image top, text below) ─────────────────────────
function GridCard({ article: a, categories = [], priority }: Omit<Props, "variant">) {
    const { toggle, isBookmarked } = useBookmarkStore();
    const saved = isBookmarked(a.id);

    const handleBookmark = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(a.id);
        if (saved) {
            toast("Removed from bookmarks");
        } else {
            toast.success("Saved to bookmarks");
        }
    };

    return (
        <div className="p-wrap group flex flex-col relative">
            {/* Image */}
            <div className="relative overflow-hidden rounded-[var(--round-5)] mb-3" style={{ aspectRatio: "16/10" }}>
                {isVideoUrl(a.articleMedia?.heroCoverMedia?.url) ? (
                  a.articleMedia?.heroCoverMedia?.poster ? (
                    <img
                        src={a.articleMedia.heroCoverMedia.poster}
                        alt={a.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <video
                        src={a.articleMedia!.heroCoverMedia!.url}
                        muted
                        autoPlay
                        loop
                        playsInline
                        className="w-full h-full object-cover"
                    />
                  )
                ) : (
                  <Image
                      src={a.articleMedia?.heroCoverMedia?.url || "/placeholder-article.jpg"}
                      alt={a.title}
                      fill
                      priority={priority}
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                )}
                <Link href={`/posts/${a.slug}`} className="absolute inset-0 z-[1] text-lg" aria-label={a.title} />
                <div className="absolute top-3 inset-inline-start-3 z-[2]">
                    <CategoryBadge article={a} categories={categories} />
                </div>

                {/* Bookmark button overlay */}
                <button
                    onClick={handleBookmark}
                    className={`absolute bottom-3 inset-inline-end-3 z-[20] w-7 h-7 flex items-center justify-center rounded transition-all transition-colors ${saved ? "bg-[var(--g-color)] text-white scale-110 shadow-sm" : "bg-black/40 text-white opacity-0 group-hover:opacity-100 hover:bg-[var(--g-color)]"}`}
                    aria-label="Bookmark"
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                </button>
            </div>

            {/* Text */}
            <div className="flex flex-col gap-2 flex-1">
                <h3
                    style={{
                        fontSize: "20px",
                        fontWeight: 700,
                        lineHeight: 1.35,
                        color: "var(--heading-color)",
                    }}
                >
                    <Link
                        href={`/posts/${a.slug}`}
                    >
                        {a.title}
                    </Link>
                </h3>
                <ArticleMeta article={a} />
            </div>
        </div>
    );
}

// ── List variant (image left, text right) ─────────────────────────
function ListCard({ article: a, categories = [], priority }: Omit<Props, "variant">) {
    const { toggle, isBookmarked } = useBookmarkStore();
    const saved = isBookmarked(a.id);

    const handleBookmark = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(a.id);
        if (saved) {
            toast("Removed from bookmarks");
        } else {
            toast.success("Saved to bookmarks");
        }
    };

    return (
        <div className="p-wrap group flex gap-4 items-start relative">
            {/* Thumbnail */}
            <div className="relative overflow-hidden rounded-[var(--round-5)] shrink-0" style={{ width: "130px", aspectRatio: "4/3" }}>
                {isVideoUrl(a.articleMedia?.heroCoverMedia?.url) ? (
                  a.articleMedia?.heroCoverMedia?.poster ? (
                    <img
                        src={a.articleMedia.heroCoverMedia.poster}
                        alt={a.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <video
                        src={a.articleMedia!.heroCoverMedia!.url}
                        muted
                        autoPlay
                        loop
                        playsInline
                        className="w-full h-full object-cover"
                    />
                  )
                ) : (
                  <Image
                    src={a.articleMedia?.heroCoverMedia?.url || "/placeholder-article.jpg"}
                    alt={a.title}
                    fill
                    priority={priority}
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="130px"
                  />
                )}
                <Link href={`/posts/${a.slug}`} className="absolute inset-0 z-[1] text-lg" aria-label={a.title} />

                {/* Bookmark button overlay (small) */}
                <button
                    onClick={handleBookmark}
                    className={`absolute bottom-2 inset-inline-end-2 z-[20] w-6 h-6 flex items-center justify-center rounded transition-all transition-colors ${saved ? "bg-[var(--g-color)] text-white" : "bg-black/40 text-white opacity-0 group-hover:opacity-100 hover:bg-[var(--g-color)]"}`}
                    aria-label="Bookmark"
                >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                </button>
            </div>

            {/* Text */}
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <CategoryBadge article={a} categories={categories} />
                <h3
                    style={{
                        fontSize: "var(--h5-fsize)",
                        fontWeight: 700,
                        lineHeight: 1.4,
                        color: "var(--heading-color)",
                    }}
                >
                    <Link href={`/posts/${a.slug}`}>
                        {a.title}
                    </Link>
                </h3>
                <ArticleMeta article={a} />
            </div>
        </div>
    );
}

// ── Small variant (tiny thumb + title only) ───────────────────────
function SmallCard({ article: a, categories = [], counter }: Omit<Props, "variant">) {
    return (
        <div className="p-wrap group flex gap-3 items-start">
            {/* Optional counter */}
            {counter && (
                <span
                    className="shrink-0 font-bold leading-tight"
                    style={{
                        fontSize: "22px",
                        color: "var(--flex-gray-40)",
                        minWidth: "28px",
                        lineHeight: "1",
                        paddingTop: "2px",
                    }}
                >
                    {String(counter).padStart(2, "0")}
                </span>
            )}

            {/* Thumbnail */}
            <div className="relative overflow-hidden rounded-[var(--round-5)] shrink-0" style={{ width: "80px", aspectRatio: "1" }}>
                <Image
                    src={a.articleMedia?.heroCoverMedia?.url || "/placeholder-article.jpg"}
                    alt={a.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="80px"
                />
                <Link href={`/posts/${a.slug}`} className="absolute inset-0 z-[1]" aria-label={a.title} />
            </div>

            {/* Text */}
            <div className="flex flex-col gap-1 flex-1 min-w-0">
                <CategoryBadge article={a} categories={categories} />
                <h4
                    style={{
                        fontSize: "var(--h5-fsize)",
                        fontWeight: 700,
                        lineHeight: 1.4,
                        color: "var(--heading-color)",
                    }}
                >
                    <Link href={`/posts/${a.slug}`} className="line-clamp-2">
                        {a.title}
                    </Link>
                </h4>
                <div style={{ fontSize: "12px", color: "var(--meta-fcolor)" }}>
                    {a.readTime} min read
                </div>
            </div>
        </div>
    );
}

// ── Hero variant (full-width overlay) ────────────────────────────
function HeroCard({ article: a, categories = [], priority }: Omit<Props, "variant">) {
    const { toggle, isBookmarked } = useBookmarkStore();
    const saved = isBookmarked(a.id);

    const handleBookmark = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(a.id);
        if (saved) {
            toast("Removed from bookmarks");
        } else {
            toast.success("Saved to bookmarks");
        }
    };

    return (
        <div className="p-wrap hero-card group relative overflow-hidden rounded-[var(--round-7)]" style={{ aspectRatio: "16/9" }}>
            {isVideoUrl(a.articleMedia?.heroCoverMedia?.url) ? (
                  a.articleMedia?.heroCoverMedia?.poster ? (
                    <img
                        src={a.articleMedia.heroCoverMedia.poster}
                        alt={a.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <video
                        src={a.articleMedia!.heroCoverMedia!.url}
                        muted
                        autoPlay
                        loop
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )
            ) : (
                <Image
                    src={a.articleMedia?.heroCoverMedia?.url || "/placeholder-article.jpg"}
                    alt={a.title}
                    fill
                    priority={priority}
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 1280px"
                />
            )}
            <Link href={`/posts/${a.slug}`} className="absolute inset-0 z-[1] text-lg" aria-label={a.title} />
            <div
                className="absolute inset-0 z-[1]"
                style={{
                    background: "linear-gradient(to top, var(--dark-accent) 0%, var(--dark-accent-90) 50%, transparent 100%)",
                }}
            />
            <div className="absolute bottom-0 left-0 right-0 p-6 z-[2]">
                <CategoryBadge article={a} categories={categories} />
                <h2
                    className="mt-2 text-white hover:text-[var(--g-color)] transition-colors"
                    style={{ fontSize: "clamp(24px, 3.5vw, 42px)", fontWeight: 700, lineHeight: 1.25 }}
                >
                    <Link href={`/posts/${a.slug}`} className="group-hover:underline decoration-[var(--g-color)] decoration-[3px] underline-offset-4 transition-all relative z-10 text-white" style={{ color: 'white' }}>
                        {a.title}
                    </Link>
                </h2>
                {a.excerpt && (
                    <p className="mt-2 line-clamp-2" style={{ color: "#ddd", fontSize: "14px" }}>
                        {a.excerpt}
                    </p>
                )}
                <div className="mt-3">
                    <ArticleMeta article={a} isHero={true} />
                </div>

                {/* Bookmark button overlay */}
                <button
                    onClick={handleBookmark}
                    className={`absolute top-6 inset-inline-end-6 z-[20] w-9 h-9 flex items-center justify-center rounded-full transition-all transition-colors ${saved ? "bg-[var(--g-color)] text-white shadow-lg" : "bg-black/40 text-white opacity-0 group-hover:opacity-100 hover:bg-[var(--g-color)]"}`}
                    aria-label="Bookmark"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

// ── Main export ───────────────────────────────────────────────────
export default function ArticleCard({ article, variant = "grid", categories, priority, counter }: Props) {
    switch (variant) {
        case "hero": return <HeroCard article={article} categories={categories} priority={priority} />;
        case "list": return <ListCard article={article} categories={categories} priority={priority} />;
        case "small": return <SmallCard article={article} categories={categories} counter={counter} />;
        default: return <GridCard article={article} categories={categories} priority={priority} />;
    }
}
