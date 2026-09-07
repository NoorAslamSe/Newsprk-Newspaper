"use client";
import { useState, useMemo } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { Article, Category } from "@/types";
import InFeedNativeAd from "./InFeedNativeAd";

interface Props { articles: Article[]; categories: Category[]; }

export default function FeaturedCarousel({ articles, categories }: Props) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const isRtl = useMemo(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.dir === "rtl";
  }, []);
  const getCategoryColor = (slug: string) => categories.find(c => c.slug === slug)?.color || "#EF4444";
  const getCategoryLabel = (slug: string) => categories.find(c => c.slug === slug)?.label || slug;

  const isVideoUrl = (url?: string) => {
    if (!url) return false;
    const cleanUrl = url.split('?')[0].toLowerCase();
    return cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.mov') || cleanUrl.endsWith('.m4v');
  };

  const displayArticles = articles.slice(0, 8);

  const { data: adData } = useQuery({
    queryKey: ["ads", "homepage", "in-feed-12"],
    queryFn: async () => {
      const res = await fetch("/api/ads?pageType=homepage&position=in-feed-12&activeOnly=true", { cache: "no-store" });
      if (!res.ok) return { items: [] };
      return res.json();
    },
    staleTime: 0,
    gcTime: 0,
  });
  const hasAd = !!adData?.items?.length;

  return (
    <div
      style={{
        backgroundImage: "url('/images/bg-shape-dark.png')",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center bottom",
        backgroundSize: "cover",
        margin: 0,
        padding: "15px 0",
      }}
    >
      <div className="mx-auto" style={{ maxWidth: "1140px", padding: "0 12px" }}>
        <Swiper
          modules={[Autoplay]}
          slidesPerView={4}
          spaceBetween={15}
          loop
          autoplay={{ delay: 3000, disableOnInteraction: false }}
          breakpoints={{ 0: { slidesPerView: 1 }, 576: { slidesPerView: 2 }, 768: { slidesPerView: 3 }, 1200: { slidesPerView: 4 } }}
        >
          {displayArticles.map((a, idx) => (
            <SwiperSlide key={a.slug}>
              <div style={{ display: "table", width: "100%", padding: "0", textAlign: "start" }}>
                <div style={{ display: "table-cell", width: "80px", maxWidth: "100px", verticalAlign: "top", position: "relative" }}>
                  <Link href={`/posts/${a.slug}`} className="block relative overflow-hidden">
                    {isVideoUrl(a.articleMedia?.heroCoverMedia?.url) ? (
                      a.articleMedia?.heroCoverMedia?.poster ? (
                        <img
                          src={a.articleMedia.heroCoverMedia.poster}
                          alt={a.title}
                          style={{ width: "80px", height: "60px", objectFit: "cover", display: "block" }}
                          className="transition-transform duration-300 hover:opacity-80"
                        />
                      ) : (
                        <video
                          src={a.articleMedia!.heroCoverMedia!.url}
                          muted
                          autoPlay
                          loop
                          playsInline
                          style={{ width: "80px", height: "60px", objectFit: "cover", display: "block" }}
                          className="transition-transform duration-300 hover:opacity-80"
                        />
                      )
                    ) : (
                      <img
                        src={a.articleMedia?.heroCoverMedia?.url || a.image}
                        alt={a.title}
                        style={{ width: "80px", height: "60px", objectFit: "cover", display: "block" }}
                        className="transition-transform duration-300 hover:opacity-80"
                      />
                    )}
                    <div
                      className="absolute bottom-0 flex items-center justify-center"
                      style={{ insetInlineEnd: 0, backgroundColor: "#EF4444", color: "#fff", height: "24px", width: "28px", fontSize: "12px" }}
                    >
                      <i className="fas fa-camera" />
                    </div>
                  </Link>
                </div>
                <div style={{ display: "table-cell", verticalAlign: "top", paddingInlineStart: "15px" }}>
                  <span
                    className="inline-block"
                    style={{
                      backgroundColor: getCategoryColor(a.category),
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
                    {getCategoryLabel(a.category)}
                  </span>
                  <h5 style={{ marginTop: 0, lineHeight: "20px", fontSize: "15px", fontWeight: 400, color: "var(--heading-color, #fff)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    <Link href={`/posts/${a.slug}`} className="!hover:text-[#eb0254] transition-colors" style={{ color: "var(--heading-color, #fff)" }}>
                      {a.title}
                    </Link>
                  </h5>
                  <div className="authar-info" style={{ fontSize: "12px", color: "var(--meta-fcolor, #888)", marginTop: "5px" }}>
                    <Link href={`/posts/${a.slug}`} style={{ color: "var(--meta-fcolor, #888)" }} className="hover:text-[#eb0254] transition-colors">
                      {a.authorName}
                    </Link>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
          {/* In-feed native ad as the last slide (only if configured) */}
          {hasAd && (
            <SwiperSlide>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", minHeight: "80px" }}>
                <InFeedNativeAd pageType="homepage" position="in-feed-12" cardStyle="carousel" />
              </div>
            </SwiperSlide>
          )}
        </Swiper>
      </div>
    </div>
  );
}
