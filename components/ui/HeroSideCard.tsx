import Image from "next/image";
import Link from "next/link";
import type { Article, Category } from "@/types";
import CategoryBadge from "@/components/ui/CategoryBadge";
import { formatDate } from "@/lib/dateFormat";

import { useBookmarkStore } from "@/hooks/useBookmarkStore";
import { toast } from "sonner";

interface Props {
    article: Article;
    categories: Category[];
}

export default function HeroSideCard({ article: a, categories }: Props) {
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
        <div
            className="p-wrap hero-side-card relative overflow-hidden rounded-sm group"
            style={{ aspectRatio: "16/10" }}
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
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    );
                }
                
                return (
                    <Image
                        src={url || "/placeholder-article.jpg"}
                        alt={a.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 1024px) 100vw, 33vw"
                    />
                );
            })()}

            {/* Gradient overlay */}
            <div
                className="absolute inset-0"
                style={{
                    background:
                        "linear-gradient(to top, var(--dark-accent) 0%, var(--dark-accent-90) 35%, transparent 100%)",
                    zIndex: 1,
                }}
            />

            {/* Absolute link */}
            <Link href={`/posts/${a.slug}`} className="absolute inset-0 z-[1]" aria-label={a.title} />

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-4" style={{ zIndex: 2 }}>
                <CategoryBadge article={a} categories={categories} />
                <h3
                    className="mt-1.5 leading-snug text-[24px] sm:text-[clamp(14px,1.5vw,20px)]"
                    style={{
                        fontWeight: 700,
                        color: "#fff",
                        lineHeight: 1.3,
                    }}
                >
                    <Link href={`/posts/${a.slug}`} className="group-hover:underline decoration-[var(--g-color)] decoration-[3px] underline-offset-4 transition-all relative z-10" style={{ color: "white" }}>
                        {a.title}
                    </Link>
                </h3>
                <div
                    className="flex items-center gap-2 mt-1.5"
                    style={{ color: "#bbb", fontSize: "13px" }}
                >
                    <span style={{ color: "#fff", fontWeight: 600 }}>{a.authorName}</span>
                    <span className="opacity-40">•</span>
                    <span>
                        {formatDate(a.date, { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                </div>
            </div>

            {/* Bookmark button */}
            <button
                onClick={handleBookmark}
                className={cn(
                    "absolute bottom-4 right-4 z-[20] w-7 h-7 flex items-center justify-center rounded transition-all bg-black/40 text-white",
                    saved ? "bg-[var(--g-color)] opacity-100" : "opacity-70 hover:opacity-100"
                )}
                aria-label="Bookmark"
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
            </button>
        </div>
    );
}

// Helper for class merging
function cn(...classes: any[]) {
    return classes.filter(Boolean).join(" ");
}
