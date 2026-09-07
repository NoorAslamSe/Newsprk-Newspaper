"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface NativeContent {
    title: string;
    excerpt: string;
    image: string;
    sponsorLabel: string;
    sponsorName: string;
    sponsorLogo?: string;
    clickThroughUrl: string;
    category?: string;
    categoryColor?: string;
    readTime?: string;
    author?: string;
    layout?: "column" | "row";
    /** Controls which card style to render — matches the surrounding article cards */
    cardStyle?: "news-grid" | "sidebar-list" | "sidebar-featured" | "latest-articles" | "hero-side" | "review-list" | "carousel" | "article-list" | "article-small" | "top-stories-thumb" | "category-grid" | "category-featured";
}

interface NativeAdData {
    _id: string;
    nativeContent: NativeContent;
    vastTagUrl?: string;
    vastUrl?: string;
    trackingPixels?: {
        impression?: string;
        click?: string;
    };
}

interface Props {
    ad: NativeAdData;
    variant?: "grid" | "list";
    /** Force a specific card style — overrides ad.nativeContent.cardStyle */
    cardStyle?: "news-grid" | "sidebar-list" | "sidebar-featured" | "latest-articles" | "hero-side" | "review-list" | "carousel" | "most-viewed" | "article-list" | "article-small" | "top-stories-thumb" | "category-grid" | "category-featured";
    position?: string;
    pageType?: string;
    /** Override the display number for most-viewed style */
    adNumber?: number;
}

// ── Card style configs ───────────────────────────────────────────
const CARD_STYLES = {
    /** News Grid: compact image + title (matches NewsGridItem in HomeTemplate) */
    "news-grid": {
        imageHeight: "clamp(120px, 22vw, 160px)",
        imageMb: "mb-2",
        imageRounded: true,
        imageRoundedValue: "var(--round-5)",
        titleSize: "15px",
        titleLineHeight: "18px",
        showCategory: false,
        showExcerpt: false,
        showAuthor: false,
        showDate: false,
        showReadTime: false,
    },
    /** Sidebar text list: no image, title + category + excerpt (matches TopStories text items) */
    "sidebar-list": {
        imageHeight: "0",
        imageMb: "mb-0",
        imageRounded: false,
        titleSize: "18px",
        titleLineHeight: "24px",
        showCategory: true,
        showExcerpt: true,
        showAuthor: false,
        showDate: false,
        showReadTime: false,
    },
    /** Sidebar featured: 180px image + title + excerpt (matches Tech & Innovation / Editor's Picks) */
    "sidebar-featured": {
        imageHeight: "180px",
        imageMb: "mb-3",
        imageRounded: false,
        titleSize: "15px",
        titleLineHeight: "20px",
        showCategory: false,
        showExcerpt: true,
        showAuthor: false,
        showDate: false,
        showReadTime: false,
    },
    /** Latest Articles: 40% width image left, text right (matches HomeTemplate Latest Articles section) */
    "latest-articles": {
        imageHeight: "clamp(140px, 35vw, 200px)",
        imageMb: "mb-0",
        imageRounded: false,
        imageWidth: "40%",
        titleSize: "15px",
        titleLineHeight: "20px",
        showCategory: true,
        showExcerpt: true,
        showAuthor: true,
        showDate: true,
        showReadTime: false,
    },
    /** Hero side card: 16:10 aspect, rounded-sm (matches HeroSideCard) */
    "hero-side": {
        imageHeight: "100%",
        imageMb: "mb-0",
        imageRounded: true,
        imageRoundedValue: "2px",
        imageAspect: "16/10",
        titleSize: "17px",
        titleLineHeight: "24px",
        showCategory: true,
        showExcerpt: true,
        showAuthor: true,
        showDate: false,
        showReadTime: false,
    },
    /** Review list: 80x60 thumb (matches HomeTemplate Review sidebar) */
    "review-list": {
        imageHeight: "60px",
        imageWidth: "80px",
        imageMb: "mb-0",
        imageRounded: false,
        titleSize: "15px",
        titleLineHeight: "20px",
        showCategory: false,
        showExcerpt: false,
        showAuthor: false,
        showDate: false,
        showReadTime: false,
    },
    /** Carousel: 80x60 thumb in table layout (matches FeaturedCarousel) */
    "carousel": {
        imageHeight: "60px",
        imageWidth: "80px",
        imageMb: "mb-0",
        imageRounded: false,
        titleSize: "15px",
        titleLineHeight: "20px",
        showCategory: true,
        showExcerpt: false,
        showAuthor: true,
        showDate: false,
        showReadTime: false,
    },
    /** Most Viewed: number + title, no image (matches Most Viewed sidebar list) */
    "most-viewed": {
        imageHeight: "0",
        imageMb: "mb-0",
        imageRounded: false,
        titleSize: "16px",
        titleLineHeight: "22px",
        showCategory: false,
        showExcerpt: false,
        showAuthor: false,
        showDate: false,
        showReadTime: false,
    },
    /** Article list card: 130px wide, 4:3 aspect, 5px rounded (matches ArticleCard variant="list") */
    "article-list": {
        imageWidth: "130px",
        imageHeight: "97.5px",
        imageMb: "mb-0",
        imageRounded: true,
        imageRoundedValue: "var(--round-5)",
        imageAspect: "4/3",
        titleSize: "15px",
        titleLineHeight: "20px",
        showCategory: true,
        showExcerpt: false,
        showAuthor: false,
        showDate: true,
        showReadTime: false,
    },
    /** Article small card: 80x80 square, 5px rounded (matches ArticleCard variant="small") */
    "article-small": {
        imageWidth: "80px",
        imageHeight: "80px",
        imageMb: "mb-0",
        imageRounded: true,
        imageRoundedValue: "var(--round-5)",
        imageAspect: "1",
        titleSize: "14px",
        titleLineHeight: "18px",
        showCategory: false,
        showExcerpt: false,
        showAuthor: false,
        showDate: false,
        showReadTime: false,
    },
    /** Top Stories thumb: 64x48, 4px rounded (matches TopStoriesSidebar popular tab) */
    "top-stories-thumb": {
        imageWidth: "64px",
        imageHeight: "48px",
        imageMb: "mb-0",
        imageRounded: true,
        imageRoundedValue: "4px",
        titleSize: "14px",
        titleLineHeight: "18px",
        showCategory: false,
        showExcerpt: false,
        showAuthor: false,
        showDate: false,
        showReadTime: false,
    },
    /** CategoryBlock grid: responsive height, 4px rounded (matches CategoryBlock grid items) */
    "category-grid": {
        imageHeight: "clamp(140px, 28vw, 160px)",
        imageMb: "mb-0",
        imageRounded: true,
        imageRoundedValue: "4px",
        titleSize: "14px",
        titleLineHeight: "18px",
        showCategory: true,
        showExcerpt: false,
        showAuthor: false,
        showDate: false,
        showReadTime: false,
    },
    /** CategoryBlock featured: responsive height, 4px rounded (matches CategoryBlock featured image) */
    "category-featured": {
        imageHeight: "clamp(200px, 40vw, 300px)",
        imageMb: "mb-0",
        imageRounded: true,
        imageRoundedValue: "4px",
        titleSize: "16px",
        titleLineHeight: "22px",
        showCategory: true,
        showExcerpt: true,
        showAuthor: false,
        showDate: false,
        showReadTime: false,
    },
} as const;

type CardStyleKey = keyof typeof CARD_STYLES;

interface CardStyleConfig {
    imageHeight?: string;
    imageWidth?: string;
    imageMb?: string;
    imageRounded?: boolean;
    imageRoundedValue?: string;
    imageAspect?: string;
    titleSize?: string;
    titleLineHeight?: string;
    showCategory?: boolean;
    showExcerpt?: boolean;
    showAuthor?: boolean;
    showDate?: boolean;
    showReadTime?: boolean;
}

/**
 * NativeAdCard — renders a native ad that matches the surrounding article cards.
 * 
 * The `cardStyle` field on nativeContent controls which card style to use:
 * - "news-grid": compact grid (NewsGridItem style)
 * - "sidebar-list": text-only list (TopStories style)
 * - "sidebar-featured": featured image + text (Tech & Innovation / Editor's Picks style)
 * - "latest-articles": list with image left, text right
 * - "hero-side": compact grid for hero side cards
 * 
 * Falls back to "grid" / "list" variants for backward compatibility.
 */
export default function NativeAdCard({ ad, variant: variantProp, cardStyle: cardStyleOverride, position, pageType, adNumber }: Props) {
    const { nativeContent: nc, trackingPixels } = ad;
    const containerRef = useRef<HTMLDivElement>(null);
    const [impressionTracked, setImpressionTracked] = useState(false);

    // Determine card style: prop override > nativeContent.cardStyle > variant fallback
    const cardStyle: CardStyleKey = cardStyleOverride || nc.cardStyle || (nc.layout === "row" ? "latest-articles" : "news-grid");
    const style: CardStyleConfig = CARD_STYLES[cardStyle] || CARD_STYLES["news-grid"];

    // ── Impression tracking ──────────────────────────────────────────
    useEffect(() => {
        if (!ad._id || impressionTracked || !containerRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !impressionTracked) {
                        setImpressionTracked(true);
                        fetch(`/api/ads/${ad._id}/analytics`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ event: "impression" }),
                        }).catch(() => {});
                        if (trackingPixels?.impression) {
                            const img = new window.Image();
                            img.src = trackingPixels.impression;
                        }
                    }
                });
            },
            { threshold: 0.5 }
        );
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [ad._id, impressionTracked, trackingPixels?.impression]);

    // ── Click handler ────────────────────────────────────────────────
    const handleClick = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        if (ad._id) {
            fetch(`/api/ads/${ad._id}/analytics`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "click" }),
            }).catch(() => {});
        }
        if (trackingPixels?.click) {
            const img = new window.Image();
            img.src = trackingPixels.click;
        }
        if (nc.clickThroughUrl) {
            window.open(nc.clickThroughUrl, "_blank", "noopener,noreferrer");
        }
    }, [ad._id, nc.clickThroughUrl, trackingPixels?.click]);

    if (!nc.title && !nc.image) return null;

    const imgRounded = style.imageRounded ? `rounded-[${style.imageRoundedValue || "var(--round-5)"}]` : "";

    // ── "carousel" style: 80x60 table layout (matches FeaturedCarousel) ──
    if (cardStyle === "carousel") {
        return (
            <div
                ref={containerRef}
                className="group cursor-pointer"
                style={{ display: "table", width: "100%", padding: "0", textAlign: "left" }}
                onClick={handleClick}
                role="link"
                tabIndex={0}
                aria-label={`Sponsored: ${nc.title}`}
            >
                <div style={{ display: "table-cell", width: "80px", maxWidth: "100px", verticalAlign: "top", position: "relative" }}>
                    <div className="block relative overflow-hidden">
                        {nc.image ? (
                            <img
                                src={nc.image}
                                alt={nc.title || "Sponsored content"}
                                style={{ width: "80px", height: "60px", objectFit: "cover", display: "block" }}
                                className="transition-transform duration-300 hover:opacity-80"
                            />
                        ) : (
                            <div style={{ width: "80px", height: "60px", backgroundColor: "#333" }} />
                        )}
                        <div
                            className="absolute bottom-0 end-0 flex items-center justify-center"
                            style={{ backgroundColor: "#EF4444", color: "#fff", height: "24px", width: "28px", fontSize: "12px" }}
                        >
                            <span style={{ fontSize: "8px", fontWeight: 700, textTransform: "uppercase" }}>Ad</span>
                        </div>
                    </div>
                </div>
                <div style={{ display: "table-cell", verticalAlign: "top", padding: "0 0 0 15px" }}>
                    {nc.category && style.showCategory && (
                        <span
                            className="inline-block"
                            style={{
                                backgroundColor: nc.categoryColor || "#ef4444",
                                color: "#fff",
                                fontSize: "11px",
                                padding: "0px 6px",
                                lineHeight: "16px",
                                letterSpacing: "0.5px",
                                textTransform: "uppercase",
                                marginBottom: "6px",
                                fontWeight: 600,
                            }}
                        >
                            {nc.category}
                        </span>
                    )}
                    <h5 style={{ marginTop: 0, lineHeight: style.titleLineHeight, fontSize: style.titleSize, fontWeight: 400, color: "var(--heading-color, #fff)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {nc.title}
                    </h5>
                    <div className="authar-info" style={{ fontSize: "12px", color: "var(--meta-fcolor, #888)", marginTop: "5px" }}>
                        {(nc.author || nc.sponsorName) && style.showAuthor && (
                            <span>{nc.author || nc.sponsorName}</span>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ── "hero-side" style: full-bleed image, no rounded, no margin ──
    if (cardStyle === "hero-side") {
        return (
            <div
                ref={containerRef}
                className="group relative overflow-hidden cursor-pointer"
                style={{ width: "100%", height: "100%", backgroundColor: "#111" }}
                onClick={handleClick}
                role="link"
                tabIndex={0}
                aria-label={`Sponsored: ${nc.title}`}
            >
                {nc.image ? (
                    <img
                        src={nc.image}
                        alt={nc.title || "Sponsored content"}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        className="transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900" />
                )}
                <div
                    className="absolute bottom-0 start-0 end-0 z-10"
                    style={{
                        padding: "15px",
                        backgroundImage: "linear-gradient(to bottom, rgba(0,0,0,0) 0, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.7) 100%)",
                        pointerEvents: "none",
                    }}
                >
                    <div style={{ pointerEvents: "auto" }}>
                        {nc.category && style.showCategory && (
                            <span
                                className="inline-block"
                                style={{
                                    backgroundColor: nc.categoryColor || "#EF4444",
                                    color: "#fff",
                                    fontSize: "11px",
                                    padding: "0px 6px",
                                    lineHeight: "16px",
                                    letterSpacing: "0.5px",
                                    textTransform: "uppercase",
                                    marginBottom: "5px",
                                    fontWeight: 600,
                                }}
                            >
                                {nc.category}
                            </span>
                        )}
                        <h2 style={{ color: "#fff", fontWeight: 500, fontSize: style.titleSize, lineHeight: style.titleLineHeight, textShadow: "1px 1px 1px rgba(0,0,0,.3)", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", marginTop: "4px", marginBottom: 0 }}>
                            {nc.title}
                        </h2>
                        {nc.excerpt && style.showExcerpt && (
                            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.75)", lineHeight: "18px", margin: "6px 0 0", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                {nc.excerpt}
                            </p>
                        )}
                        <ul style={{ listStyle: "none", padding: 0, margin: "6px 0 0", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                            {(nc.author || nc.sponsorName) && style.showAuthor && (
                                <li style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>
                                    By <span style={{ fontWeight: 700, color: "#fff" }}>{nc.author || nc.sponsorName}</span>
                                </li>
                            )}
                            <li style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", backgroundColor: "rgba(0,0,0,0.4)", padding: "1px 6px", borderRadius: "3px" }}>
                                Ad
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

    // ── "review-list" style: 80x60 thumb + title + stars ───────────
    if (cardStyle === "review-list") {
        return (
            <div
                ref={containerRef}
                className="group flex gap-3 pb-3 cursor-pointer"
                style={{ borderBottom: "1px solid var(--flex-gray-15, rgba(255,255,255,0.1))" }}
                onClick={handleClick}
                role="link"
                tabIndex={0}
                aria-label={`Sponsored: ${nc.title}`}
            >
                <div className="shrink-0 relative overflow-hidden" style={{ width: "80px", height: "60px" }}>
                    {nc.image ? (
                        <img src={nc.image} alt={nc.title || "Sponsored content"} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900" />
                    )}
                    <div className="absolute bottom-2 end-0 flex items-center justify-center" style={{ backgroundColor: "#EB0254", color: "#fff", height: "20px", width: "24px", fontSize: "10px" }}>
                        Ad
                    </div>
                </div>
                <div className="min-w-0">
                    <h6 className="font-bold leading-snug mb-1" style={{ fontSize: style.titleSize, color: "var(--heading-color, #fff)" }}>
                        {nc.title}
                    </h6>
                    <div className="flex items-center gap-1" style={{ fontSize: "11px", color: "var(--meta-fcolor, #888)" }}>
                        {[1,2,3,4,5].map(s => (
                            <i key={s} className="fas fa-star" style={{ color: s <= 4 ? "#f5a623" : "#555", fontSize: "10px" }} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ── "latest-articles" style: image left, text right ─────────────
    if (cardStyle === "latest-articles") {
        return (
            <div
                ref={containerRef}
                className="group flex flex-row gap-4 mb-4 pb-4 cursor-pointer"
                onClick={handleClick}
                role="link"
                tabIndex={0}
                aria-label={`Sponsored: ${nc.title}`}
            >
                <div className="shrink-0 relative" style={{ flex: "0 0 40%" }}>
                    {nc.image ? (
                        <img
                            src={nc.image}
                            alt={nc.title || "Sponsored content"}
                            className="w-full object-cover group-hover:scale-105 transition-transform duration-300"
                            style={{ height: style.imageHeight }}
                        />
                    ) : (
                        <div className="w-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900" style={{ height: style.imageHeight }} />
                    )}
                    <div className="absolute flex items-center justify-center rounded-full z-1" style={{ backgroundColor: "#eb0254", color: "#fff", height: "30px", width: "30px", fontSize: "13px", top: "-15px", left: "20px" }}>
                        <i className="fa-solid fa-bolt-lightning" />
                    </div>
                </div>
                <div className="min-w-0" style={{ flex: "1 1 65%" }}>
                    {nc.category && style.showCategory && (
                        <span className="inline-block mb-1" style={{ backgroundColor: nc.categoryColor || "#eb0254", color: "#fff", fontSize: "12px", padding: "0px 8px", lineHeight: "18px", textTransform: "uppercase" }}>
                            {nc.category}
                        </span>
                    )}
                    <h4 className="font-normal md:font-bold leading-tight mb-1" style={{ fontSize: style.titleSize, lineHeight: style.titleLineHeight, color: "var(--heading-color, #fff)" }}>
                        {nc.title}
                    </h4>
                    <div className="flex items-center gap-2 mb-2" style={{ fontSize: "12px", color: "var(--meta-fcolor, #888)" }}>
                        {(nc.author || nc.sponsorName) && style.showAuthor && (
                            <span>By <span style={{ fontWeight: 700, color: "var(--heading-color, #fff)" }}>{nc.author || nc.sponsorName}</span></span>
                        )}
                    </div>
                    <span style={{ color: "#71717a", fontSize: "10px", fontWeight: 400, textTransform: "uppercase" }}>Sponsored</span>
                    {nc.excerpt && style.showExcerpt && (
                        <p className="text-sm line-clamp-2 hidden sm:block" style={{ color: "var(--excerpt-color, #bbb)" }}>{nc.excerpt}</p>
                    )}
                </div>
            </div>
        );
    }

    // ── "sidebar-featured" style: full-width image + title + excerpt ─
    if (cardStyle === "sidebar-featured") {
        return (
            <div
                ref={containerRef}
                className="mb-3 pb-3 cursor-pointer"
                onClick={handleClick}
                role="link"
                tabIndex={0}
                aria-label={`Sponsored: ${nc.title}`}
            >
                {nc.image && (
                    <div className="block mb-3">
                        <img src={nc.image} alt={nc.title || "Sponsored content"} className="w-full object-cover" style={{ height: style.imageHeight }} />
                    </div>
                )}
                <h5 className="font-bold leading-snug mb-1" style={{ fontSize: style.titleSize, lineHeight: style.titleLineHeight, color: "var(--heading-color, #fff)" }}>
                    {nc.title}
                </h5>
                {nc.excerpt && style.showExcerpt && (
                    <p className="text-xs" style={{ color: "var(--meta-fcolor, #888)", fontSize: "12px" }}>{nc.excerpt}</p>
                )}
            </div>
        );
    }

    // ── "sidebar-list" style: text only, no image ────────────────────
    if (cardStyle === "sidebar-list") {
        return (
            <div
                ref={containerRef}
                className="post-grid cursor-pointer"
                style={{ padding: "14px 0", borderBottom: "1px solid var(--flex-gray-15, rgba(255,255,255,0.1))" }}
                onClick={handleClick}
                role="link"
                tabIndex={0}
                aria-label={`Sponsored: ${nc.title}`}
            >
                <div className="posts-inner" style={{ padding: 0 }}>
                    <h6 className="posts-title" style={{ fontFamily: "Roboto, sans-serif", fontSize: style.titleSize, lineHeight: style.titleLineHeight, fontWeight: 500, color: "var(--heading-color, #fff)", marginBottom: "5px" }}>
                        {nc.title}
                    </h6>
                    <div className="flex items-center gap-2" style={{ fontSize: "12px", color: "var(--meta-fcolor, #888)", marginBottom: "5px" }}>
                        {nc.category && style.showCategory && (
                            <span style={{ backgroundColor: nc.categoryColor || "#4c66a3", color: "#fff", fontSize: "14px", padding: "0px 8px", lineHeight: "20px", textTransform: "uppercase", fontWeight: 600 }}>{nc.category}</span>
                        )}
                        <span style={{ color: "#71717a", fontSize: "10px", fontWeight: 400, textTransform: "uppercase" }}>Sponsored</span>
                    </div>
                    {nc.excerpt && style.showExcerpt && (
                        <p style={{ fontFamily: '"Source Sans Pro", sans-serif', fontWeight: 400, fontSize: "15px", color: "var(--excerpt-color, #bbb)", lineHeight: "20px", margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {nc.excerpt}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // ── "most-viewed" style: number + title (renders inside template's <li>) ──
    if (cardStyle === "most-viewed") {
        const displayNumber = adNumber != null ? String(adNumber).padStart(2, "0") : (nc.readTime || "04");
        return (
            <div
                ref={containerRef}
                className="cursor-pointer"
                onClick={handleClick}
                role="link"
                tabIndex={0}
                aria-label={`Sponsored: ${nc.title}`}
                style={{ display: "flex", alignItems: "flex-start", width: "100%" }}
            >
                <span className="count" style={{ flexShrink: 0, width: "20%", color: "var(--meta-fcolor, #888)", fontSize: "40px", paddingInlineEnd: "20px", lineHeight: "24px", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 600 }}>
                    {displayNumber}
                </span>
                <span className="text" style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "16px", paddingInlineStart: "20px", borderInlineStart: "1px solid var(--flex-gray-15, rgba(255,255,255,0.1))", fontWeight: 600, lineHeight: "22px", color: "var(--heading-color, #fff)" }}>
                    {nc.title}
                    <span style={{ display: "block", fontSize: "10px", color: "#71717a", fontWeight: 400, textTransform: "uppercase", marginTop: "4px" }}>Sponsored</span>
                </span>
            </div>
        );
    }

    // ── Default: "news-grid" style ──────────────────────────────────
    return (
        <div
            ref={containerRef}
            className="group cursor-pointer"
            onClick={handleClick}
            role="link"
            tabIndex={0}
            aria-label={`Sponsored: ${nc.title}`}
        >
            {nc.image && (
                <div
                    className={`relative overflow-hidden ${imgRounded} mb-2`}
                    style={{
                        width: style.imageWidth || "100%",
                        aspectRatio: style.imageAspect || undefined,
                    }}
                >
                    <img
                        src={nc.image}
                        alt={nc.title || "Sponsored content"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        style={{ height: style.imageAspect ? "100%" : style.imageHeight }}
                    />
                    <div className="absolute bottom-0 end-0 flex items-center justify-center" style={{ backgroundColor: "#EF4444", color: "#fff", height: "24px", width: "28px", fontSize: "12px" }}>
                        <span className="text-[8px] font-bold uppercase">Ad</span>
                    </div>
                </div>
            )}
            <h5
                className="font-bold leading-snug mb-1"
                style={{
                    fontSize: style.titleSize,
                    lineHeight: style.titleLineHeight,
                    color: "var(--heading-color, #fff)",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                }}
            >
                {nc.title}
            </h5>
            <div className="flex items-center gap-2" style={{ fontSize: "12px", color: "var(--meta-fcolor, #888)" }}>
                <span style={{ color: "#71717a", fontSize: "10px", fontWeight: 400, textTransform: "uppercase" }}>Sponsored</span>
            </div>
        </div>
    );
}
