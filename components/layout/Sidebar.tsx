"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { Article, Category } from "@/types";
import ArticleCard from "@/components/ui/ArticleCard";
import SectionHeading from "@/components/ui/SectionHeading";
import NewsletterWidget from "@/components/ui/NewsletterWidget";
import AdSlot from "@/components/ui/AdSlot";
import InFeedNativeAd from "@/components/ui/InFeedNativeAd";
import FollowUsWidget from "@/components/ui/FollowUsWidget";
import WeatherWidget from "@/components/ui/WeatherWidget";
import { useTranslations } from "@/hooks/useTranslations";

interface Props {
    trending: Article[];
    categories: Category[];
    recentArticles: Article[];
    tags?: string[];
    showStickyAd?: boolean;
    articleAdOverrideId?: string;
    articleSlug?: string;
}

export default function Sidebar({ trending, categories, recentArticles, tags = [], showStickyAd = false, articleAdOverrideId, articleSlug }: Props) {
    const tSidebar = useTranslations("sidebar");
    const tCommon = useTranslations("common");
    // Fetch dynamic tags
    const { data: dynamicTags } = useQuery({
        queryKey: ["tags"],
        queryFn: async () => {
            const res = await fetch("/api/tags");
            if (!res.ok) return [];
            return res.json();
        },
        staleTime: 1000 * 60 * 10, // 10 minutes
    });

    // Use dynamic tags if available, fallback to static tags
    const tagsToShow = dynamicTags?.slice(0, 16) || tags.slice(0, 16);

    return (
        <aside className="flex flex-col gap-8 w-full">
            {/* Sticky Sidebar Ad (Desktop Only - Article Pages) */}
            {showStickyAd && (
                <div className="hidden lg:block overflow-hidden mx-auto lg:mx-0">
                    <AdSlot 
                        pageType="article"
                        position="sidebar-sticky"
                        label="Sidebar Sticky Ad" 
                        width="300px" 
                        height="600px"
                        adOverrideId={articleAdOverrideId}
                        articleSlug={articleSlug}
                    />
                </div>
            )}

            {/* Trending */}
            <div>
                <SectionHeading label={tSidebar("trending")} href="/blog" />
                <div className="space-y-5">
                    {Array.isArray(trending) && trending.length > 0 ? trending.slice(0, 5).map((a) => (
                        <ArticleCard key={a.slug} article={a} variant="small" categories={categories} />
                    )) : (
                        <div className="text-sm text-[var(--meta-fcolor)]">
                            {tSidebar("loadingTrending")}
                        </div>
                    )}
                </div>
            </div>

            {/* In-Feed Native Ad — After Trending (matches 80×80 small card) */}
            <InFeedNativeAd pageType="article" position="sidebar-infeed" variant="list" cardStyle="article-small" />

            {/* Weather Widget */}
            <WeatherWidget />

            {/* Follow Us Block */}
            <FollowUsWidget />

            {/* Ad slot */}
            <div className="mx-auto lg:mx-0">
                <AdSlot pageType="article" position="in-content-1" label="Sidebar Ad" width="336px" height="280px" />
            </div>

            {/* In-Feed Native Ad */}
            <InFeedNativeAd pageType="article" position="sidebar-infeed" variant="list" cardStyle="sidebar-list" />

            {/* Newsletter */}
            <NewsletterWidget />

            {/* Categories */}
            <div>
                <SectionHeading label={tCommon("categories")} />
                <div className="space-y-2">
                    {Array.isArray(categories) && categories.length > 0 ? categories.map((c) => (
                        c.latestImage ? (
                            <Link
                                key={c.slug}
                                href={`/category/${c.slug}`}
                                className="relative flex items-center justify-between rounded-[var(--round-5)] overflow-hidden group transition-all hover:shadow-md"
                                style={{ height: "64px", backgroundColor: c.color || "#64748b", backgroundImage: `url(${c.latestImage})`, backgroundSize: "cover", backgroundPosition: "center center" }}
                            >
                                <div className="absolute inset-0 bg-black/50" />
                                <span className="relative z-10 text-sm font-bold text-white px-4 uppercase tracking-wide">
                                    {c.label}
                                </span>
                                <span
                                    className="relative z-10 text-xs font-bold text-white px-2.5 py-1 m-2 rounded"
                                    style={{ backgroundColor: c.color || "#64748b" }}
                                >
                                    {c.count}
                                </span>
                            </Link>
                        ) : (
                            <Link
                                key={c.slug}
                                href={`/category/${c.slug}`}
                                className="flex items-center justify-between px-4 py-2.5 rounded-[var(--round-5)] hover:bg-[var(--flex-gray-7)] group transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                                    <span className="text-sm font-semibold group-hover:text-[var(--g-color)] transition-colors">
                                        {c.label}
                                    </span>
                                </div>
                                <span className="text-xs text-[var(--meta-fcolor)]">{c.count}</span>
                            </Link>
                        )
                    )) : (
                        <div className="text-sm text-[var(--meta-fcolor)] px-4 py-2">
                            {tSidebar("loadingCategories")}
                        </div>
                    )}
                </div>
            </div>

            {/* Tags cloud */}
            <div>
                <SectionHeading label={tSidebar("popularTags")} />
                <div className="flex flex-wrap gap-2">
                    {tagsToShow.length > 0 ? tagsToShow.map((tagData: any) => {
                        const tag = typeof tagData === 'string' ? tagData : tagData.tag;
                        const count = typeof tagData === 'object' ? tagData.count : null;
                        
                        return (
                            <Link
                                key={tag}
                                href={`/tag/${tag}`}
                                className="px-3 py-1.5 rounded-[var(--round-5)] text-xs font-semibold hover:bg-[var(--g-color)] hover:text-white border border-[var(--flex-gray-15)] transition-all flex items-center gap-1"
                                style={{ color: "var(--meta-fcolor)" }}
                                title={count ? `${count} ${tCommon("articles")}` : undefined}
                            >
                                #{tag}
                                {count && (
                                    <span className="text-[10px] opacity-70">({count})</span>
                                )}
                            </Link>
                        );
                    }) : (
                        <div className="text-sm text-[var(--meta-fcolor)]">
                            {tSidebar("loadingTags")}
                        </div>
                    )}
                </div>
            </div>

            {/* Recent posts */}
            <div>
                <SectionHeading label={tSidebar("recentPosts")} href="/blog" />
                <div className="space-y-5">
                    {Array.isArray(recentArticles) && recentArticles.length > 0 ? recentArticles.slice(0, 4).map((a) => (
                        <ArticleCard key={a.slug} article={a} variant="list" categories={categories} />
                    )) : (
                        <div className="text-sm text-[var(--meta-fcolor)]">
                            {tSidebar("loadingRecent")}
                        </div>
                    )}
                </div>
            </div>

            {/* In-Feed Native Ad — After Recent Posts (matches 130×97 list card) */}
            <InFeedNativeAd pageType="article" position="sidebar-infeed" variant="list" cardStyle="article-list" />
        </aside>
    );
}
