"use client";

import { useQuery } from "@tanstack/react-query";
import AdSlot from "./AdSlot";
import NativeAdCard from "./NativeAdCard";
import type { PageType, AdPosition } from "@/lib/models/AdSnippet";

interface Props {
    pageType: PageType;
    position: AdPosition;
    adNumber?: number;
    /** Force a specific variant regardless of ad layout config */
    variant?: "grid" | "list";
    /** Force a specific card style — overrides the ad's nativeContent.cardStyle */
    cardStyle?: "news-grid" | "sidebar-list" | "sidebar-featured" | "latest-articles" | "hero-side" | "review-list" | "carousel" | "most-viewed" | "article-list" | "article-small" | "top-stories-thumb" | "category-grid" | "category-featured";
}

/**
 * In-Feed Native Ad Component
 * 
 * Seamlessly integrates promotional content into article feeds.
 * 
 * Behavior:
 * - If ad has templateType === "native_feed" → renders NativeAdCard (article-card style)
 * - If ad has any other templateType → falls back to AdSlot (banner/video/html style)
 * - Only renders when ad is configured and enabled
 * 
 * Native feed ads match the platform's ArticleCard style for a natural,
 * non-disruptive experience with a subtle "Sponsored" badge.
 */
export default function InFeedNativeAd({ pageType, position, adNumber, variant, cardStyle }: Props) {
    // Fetch ad data to determine template type
    const { data, isLoading } = useQuery({
        queryKey: ["ads", pageType, position],
        queryFn: async () => {
            const res = await fetch(
                `/api/ads?pageType=${pageType}&position=${position}&activeOnly=true`,
                { cache: "no-store" }
            );
            if (!res.ok) return { items: [] };
            return res.json() as Promise<{ items: any[] }>;
        },
        staleTime: 0,
        gcTime: 0,
    });

    // Don't render if no ad configured or ad is disabled
    const ad = data?.items?.find((a: any) => 
        a.pageType === pageType && a.position === position && a.enabled !== false
    );
    const hasAd = !!ad;
    
    if (isLoading) {
        // Show skeleton matching ArticleCard grid shape while loading
        return (
            <div className="p-wrap flex flex-col relative">
                <div 
                    className="relative overflow-hidden rounded-[var(--round-5)] mb-3 animate-pulse bg-gray-200 dark:bg-gray-800" 
                    style={{ aspectRatio: "16/10" }}
                />
                <div className="space-y-2">
                    <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-1/2" />
                </div>
            </div>
        );
    }

    if (!hasAd) {
        // No ad configured or disabled - don't render anything
        return null;
    }

    // ── Native Feed Ad → render as ArticleCard-style NativeAdCard ──
    if (ad.templateType === "native_feed" && ad.nativeContent) {
        const nc = ad.nativeContent;
        
        // Only render if there's meaningful content
        if (!nc.title && !nc.image) {
            return null;
        }

        return (
            <NativeAdCard
                ad={{
                    _id: ad._id,
                    nativeContent: {
                        title: nc.title || "",
                        excerpt: nc.excerpt || "",
                        image: nc.image || "",
                        sponsorLabel: nc.sponsorLabel || "Sponsored",
                        sponsorName: nc.sponsorName || "",
                        sponsorLogo: nc.sponsorLogo || "",
                        clickThroughUrl: nc.clickThroughUrl || ad.clickThroughUrl || "",
                        category: nc.category || "",
                        categoryColor: nc.categoryColor || "",
                        readTime: nc.readTime || "",
                        author: nc.author || "",
                        layout: nc.layout || "column",
                        cardStyle: nc.cardStyle || "news-grid",
                    },
                    vastTagUrl: ad.vastTagUrl,
                    vastUrl: ad.vastUrl,
                    trackingPixels: ad.trackingPixels,
                }}
                variant={variant}
                cardStyle={cardStyle}
                position={position}
                pageType={pageType}
                adNumber={adNumber}
            />
        );
    }

    // ── Non-native ad (banner, video, VAST, HTML, provider script) ──
    // Fall back to the existing AdSlot wrapper with ArticleCard-like container
    return (
        <div className="p-wrap group flex flex-col relative">
            {/* Native Ad Container - Matches ArticleCard image container */}
            <div 
                className="relative overflow-hidden rounded-[var(--round-5)] mb-3" 
                style={{ aspectRatio: "16/10" }}
            >
                {/* Ad Content - AD badge is inside AdSlot on actual content */}
                <AdSlot
                    pageType={pageType}
                    position={position}
                    label="AD"
                    className="w-full h-full"
                    fullWidth={true}
                />
            </div>

            {/* Optional: Sponsored label below (subtle) */}
            <div className="flex items-center gap-2 text-[11px] text-gray-400 dark:text-gray-500">
                <span className="opacity-60">Sponsored Content</span>
            </div>
        </div>
    );
}
