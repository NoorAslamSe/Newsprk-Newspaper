"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Article, Category } from "@/types";
import CategoryBadge from "@/components/ui/CategoryBadge";
import { formatDate } from "@/lib/dateFormat";

import { useBookmarkStore } from "@/hooks/useBookmarkStore";
import { toast } from "sonner";

interface Props {
    articles: Article[];
    categories: Category[];
    autoPlayInterval?: number;
}

function BookmarkIcon({ filled }: { filled?: boolean }) {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
    );
}

export default function HeroCarousel({ articles, categories, autoPlayInterval = 5000 }: Props) {
    const [current, setCurrent] = useState(0);
    const [paused, setPaused] = useState(false);
    const { toggle, isBookmarked } = useBookmarkStore();

    const total = articles.length;

    const next = useCallback(() => {
        setCurrent((c) => (c + 1) % Math.max(total, 1));
    }, [total]);

    const prev = useCallback(() => {
        setCurrent((c) => (c - 1 + Math.max(total, 1)) % Math.max(total, 1));
    }, [total]);

    useEffect(() => {
        if (paused || total < 2) return;
        const t = setInterval(next, autoPlayInterval);
        return () => clearInterval(t);
    }, [paused, next, autoPlayInterval, total]);

    if (!articles || articles.length === 0) {
        return (
            <div
                className="relative overflow-hidden rounded-[var(--round-7)] flex items-center justify-center"
                style={{ aspectRatio: "16/10", background: "var(--flex-gray-7)" }}
            >
                <span style={{ color: "var(--meta-fcolor)", fontSize: "14px" }}>No hay artículos destacados</span>
            </div>
        );
    }

    const currentArticle = articles[current];
    const saved = currentArticle ? isBookmarked(currentArticle.id) : false;

    const handleBookmark = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (currentArticle) {
            toggle(currentArticle.id);
            if (saved) {
                toast("Removed from bookmarks");
            } else {
                toast.success("Saved to bookmarks");
            }
        }
    };

    return (
        <div
            className="p-wrap hero-card relative overflow-hidden rounded-sm"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            style={{ aspectRatio: "16/10.2" }}
        >
            {/* Slides */}
            {articles.map((a, i) => (
                <div
                    key={a.slug}
                    className="group absolute inset-0 transition-opacity duration-700"
                    style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 10 : 0 }}
                >
                    {(() => {
                        const url = a.articleMedia?.heroCoverMedia?.url || "";
                        const isVideo = url && (url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.webm') || url.toLowerCase().endsWith('.mov'));
                        
                        if (isVideo) {
                            const poster = a.articleMedia?.heroCoverMedia?.poster;
                            if (poster) {
                                return (
                                    <img
                                        src={poster}
                                        alt={a.title}
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                );
                            }
                            return (
                                <video
                                    src={url}
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                            );
                        }
                        
                        return (
                            <Image
                                src={url || "/placeholder-article.jpg"}
                                alt={a.title}
                                fill
                                priority={i === 0}
                                className="object-cover"
                                sizes="(max-width: 1024px) 100vw, 66vw"
                            />
                        );
                    })()}
                    {/* Gradient overlay */}
                    <div
                        className="absolute inset-0"
                        style={{
                            background:
                                "linear-gradient(to top, var(--dark-accent) 0%, var(--dark-accent-90) 40%, transparent 100%)",
                            zIndex: 1,
                        }}
                    />
                    {/* Content */}
                    <div
                        className="absolute bottom-0 left-0 right-0 p-5"
                        style={{ zIndex: 2 }}
                    >
                        <CategoryBadge article={a} categories={categories} />
                        <h2
                            className="mt-2 mb-2 leading-tight text-white"
                            style={{
                                fontSize: "clamp(24px, 3.5vw, 42px)",
                                fontWeight: 700,
                                lineHeight: 1.25,
                            }}
                        >
                            <Link href={`/posts/${a.slug}`} className="group-hover:underline decoration-[var(--g-color)] decoration-[3px] underline-offset-4 transition-all text-white" style={{ color: "white" }}>
                                {a.title}
                            </Link>
                        </h2>
                        {a.excerpt && (
                            <p
                                className="mb-3 line-clamp-2"
                                style={{ color: "#ddd", fontSize: "clamp(14px, 2vw, 14px)", lineHeight: 1.5 }}
                            >
                                {a.excerpt}
                            </p>
                        )}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2" style={{ color: "#bbb", fontSize: "13px" }}>
                                <span style={{ color: "#fff", fontWeight: 600 }}>
                                    {a.authorName}
                                </span>
                                <span className="opacity-40">•</span>
                                <span>
                                    {formatDate(a.date, { month: "short", day: "numeric", year: "numeric" })}
                                </span>
                                <span className="opacity-40">•</span>
                                <span>{a.readTime} min read</span>
                            </div>
                            <button
                                onClick={handleBookmark}
                                className={`flex items-center justify-center w-7 h-7 rounded transition-all transition-colors ${saved ? "text-[var(--g-color)] opacity-100" : "text-white opacity-70 hover:opacity-100"}`}
                                aria-label="Bookmark"
                            >
                                <BookmarkIcon filled={saved} />
                            </button>
                        </div>
                    </div>
                </div>
            ))}

            {/* Prev / Next arrows */}
            {total > 1 && (
                <>
                    <button
                        onClick={prev}
                        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-9 h-9 rounded-full transition-all opacity-0 group-hover:opacity-100 hover:opacity-100"
                        style={{ background: "rgba(0,0,0,0.5)", color: "#fff" }}
                        aria-label="Previous"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </button>
                    <button
                        onClick={next}
                        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-9 h-9 rounded-full transition-all hover:opacity-100"
                        style={{ background: "rgba(0,0,0,0.5)", color: "#fff" }}
                        aria-label="Next"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M9 18l6-6-6-6" />
                        </svg>
                    </button>
                </>
            )}

            {/* Dot indicators */}
            {total > 1 && (
                <div className="absolute bottom-4 right-5 z-20 flex gap-1.5">
                    {articles.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrent(i)}
                            aria-label={`Go to slide ${i + 1}`}
                            className="rounded-full transition-all duration-300"
                            style={{
                                width: i === current ? 20 : 8,
                                height: 8,
                                backgroundColor: i === current ? "var(--g-color)" : "rgba(255,255,255,0.4)",
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Reading progress bar */}
            {total > 1 && (
                <div
                    className="absolute bottom-0 left-0 h-0.5 z-30 transition-none"
                    style={{
                        backgroundColor: "var(--g-color)",
                        width: `${((current + 1) / total) * 100}%`,
                    }}
                />
            )}
        </div>
    );
}
