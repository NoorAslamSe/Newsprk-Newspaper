"use client";
import Link from "next/link";
import type { Article } from "@/types";

interface Props {
    articles: Article[];
    label?: string;
}

export default function TrendingTicker({ articles, label = "Trending" }: Props) {
    if (!articles.length) return null;

    // Duplicate for seamless loop
    const items = [...articles, ...articles];

    return (
        <div className="flex items-center gap-0 bg-[var(--nav-bg)] border-b border-[var(--flex-gray-15)] overflow-hidden w-full relative z-50">
            {/* Label pill */}
            <div
                className="shrink-0 flex items-center px-4 py-2 me-3 text-white text-xs font-bold uppercase tracking-wider z-10"
                style={{ background: "var(--g-color)", minWidth: 110 }}
            >
                <span className="mr-1.5 animate-pulse">●</span>
                {label}
            </div>

            {/* Scrolling track */}
            <div className="overflow-hidden flex-1">
                <div className="ticker-track py-2 will-change-transform">
                    {items.map((a, i) => (
                        <Link
                            key={`${a.slug}-${i}`}
                            href={`/posts/${a.slug}`}
                            className="inline-flex items-center gap-2 text-sm hover:text-[var(--g-color)] transition-colors shrink-0"
                            style={{ fontWeight: 600 }}
                        >
                            <span className="text-[var(--g-color)] font-bold">{(i % articles.length) + 1}.</span>
                            {a.title}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
