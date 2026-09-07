"use client";
import { useState, useMemo } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { Article, Category } from "@/types";
import { formatDate } from "@/lib/dateFormat";
import InFeedNativeAd from "./InFeedNativeAd";

interface Props { articles: Article[]; categories: Category[]; }

function SliderPost({ article, categories, height, fill }: { article?: Article; categories: Category[]; height: number; fill?: boolean }) {
  if (!article) return null;
  const cat = categories.find(c => c.slug === article.category);
  const dateStr = formatDate(article.date, { month: "short", day: "numeric", year: "numeric" });
  const h = fill ? "100%" : `${height}px`;

  const mediaUrl = article.articleMedia?.heroCoverMedia?.url || article.image;
  const isVideo = mediaUrl && (() => {
    const cleanUrl = mediaUrl.split('?')[0].toLowerCase();
    return cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.mov') || cleanUrl.endsWith('.m4v');
  })();

  return (
    <div className="relative overflow-hidden group" style={{ height: h }}>
      <Link href={`/posts/${article.slug}`} className="block relative" style={{ height: "100%", zIndex: 1 }}>
        {mediaUrl ? (
          isVideo ? (
            article.articleMedia?.heroCoverMedia?.poster ? (
              <img
                src={article.articleMedia.heroCoverMedia.poster}
                alt={article.title}
                style={{ width: "100%", height: h, objectFit: "cover", display: "block" }}
                className="transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <video
                src={mediaUrl}
                muted
                autoPlay
                loop
                playsInline
                style={{ width: "100%", height: h, objectFit: "cover", display: "block" }}
                className="transition-transform duration-500 group-hover:scale-105"
              />
            )
          ) : (
            <img
              src={mediaUrl}
              alt={article.title}
              style={{ width: "100%", height: h, objectFit: "cover", display: "block" }}
              className="transition-transform duration-500 group-hover:scale-105"
            />
          )
        ) : (
          <div
            style={{
              width: "100%",
              height: h,
              display: "block",
              backgroundImage: `linear-gradient(135deg, ${cat?.color || "#EF4444"}55, #222327)`,
            }}
          />
        )}
      </Link>
      <div
        className="absolute bottom-0 left-0 right-0 z-10"
        style={{
          padding: height > 300 ? "40px 20px" : "15px",
          backgroundImage: "linear-gradient(to bottom, rgba(0,0,0,0) 0, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.7) 100%)",
          pointerEvents: "none",
        }}
      >
        <div style={{ pointerEvents: "auto" }}>
          <span
            className="inline-block"
            style={{
              backgroundColor: cat?.color || "#EF4444",
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
            {cat?.label || article.category}
          </span>
          <h2 style={{ color: "#fff", fontWeight: 500, fontSize: height > 300 ? "17px" : "14px", lineHeight: height > 300 ? "24px" : "18px", textShadow: "1px 1px 1px rgba(0,0,0,.3)", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", marginTop: "4px", marginBottom: 0 }}>
            <Link href={`/posts/${article.slug}`} style={{ color: "#fff" }} className="hover:text-[#EF4444] transition-colors">
              {article.title}
            </Link>
          </h2>
          {height > 300 && (
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.75)", lineHeight: "18px", margin: "6px 0 0", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {article.excerpt}
            </p>
          )}
          <ul style={{ listStyle: "none", padding: 0, margin: "6px 0 0", display: "flex", flexWrap: "wrap", gap: "4px" }}>
            <li style={{ fontSize: "12px", color: height > 300 ? "#8a8a8a" : "rgba(255,255,255,0.7)" }}>
              By <span style={{ fontWeight: 700, color: "#fff" }}>{article.authorName}</span>
            </li>
            <li style={{ fontSize: "12px", color: height > 300 ? "#8a8a8a" : "rgba(255,255,255,0.7)" }}>
              {dateStr}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function SliderNav({ prefix }: { prefix: string }) {
  return (
    <>
      <button
        className={`${prefix}-prev absolute top-1/2 -translate-y-1/2 z-10 flex items-center justify-center transition-colors hover:bg-[#eb0254]`}
        style={{ insetInlineEnd: 0, width: "35px", height: "50px", background: "rgba(0,0,0,0.5)", color: "#fff", border: "none" }}
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        className={`${prefix}-next absolute top-1/2 -translate-y-1/2 z-10 flex items-center justify-center transition-colors hover:bg-[#eb0254]`}
        style={{ insetInlineStart: 0, width: "35px", height: "50px", background: "rgba(0,0,0,0.5)", color: "#fff", border: "none" }}
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </>
  );
}

const DismissibleAdCard = ({ position, article, categories, height, onDismiss }: {
  position: "in-feed-13" | "in-feed-15";
  article: Article;
  categories: Category[];
  height: number;
  onDismiss: () => void;
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return <SliderPost article={article} categories={categories} height={height} />;
  }

  return (
    <div style={{ position: "relative", height: `${height}px` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", backgroundColor: "var(--card-bg, #1a1a2e)" }}>
        <InFeedNativeAd pageType="homepage" position={position} variant="grid" />
      </div>
      <button
        onClick={() => { setDismissed(true); onDismiss(); }}
        aria-label="Dismiss ad"
        style={{
          position: "absolute",
          top: "6px",
          insetInlineEnd: "6px",
          zIndex: 20,
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          border: "none",
          backgroundColor: "rgba(0,0,0,0.6)",
          color: "#fff",
          fontSize: "12px",
          lineHeight: "24px",
          textAlign: "center",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          transition: "background-color 0.2s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(235,2,84,0.9)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.6)"; }}
      >
        <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 1l12 12M13 1L1 13" />
        </svg>
      </button>
      <span
        style={{
          position: "absolute",
          top: "6px",
          insetInlineStart: "6px",
          zIndex: 20,
          fontSize: "10px",
          color: "rgba(255,255,255,0.6)",
          backgroundColor: "rgba(0,0,0,0.4)",
          padding: "1px 6px",
          borderRadius: "3px",
          pointerEvents: "none",
        }}
      >
        Ad
      </span>
    </div>
  );
};

export default function HeroSliderBlock({ articles, categories }: Props) {
  const leftArticles = articles.slice(0, 3);
  const centerArticles = articles.slice(5, 10);
  const rightArticles = articles.slice(10, 13);
  const [sideAdDismissed, setSideAdDismissed] = useState(false);
  const isRtl = useMemo(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.dir === "rtl";
  }, []);

  // Check if ads are configured for these positions
  const { data: sideAdData } = useQuery({
    queryKey: ["ads", "homepage", "in-feed-13"],
    queryFn: async () => {
      const res = await fetch("/api/ads?pageType=homepage&position=in-feed-13&activeOnly=true", { cache: "no-store" });
      if (!res.ok) return { items: [] };
      return res.json();
    },
    staleTime: 0,
    gcTime: 0,
  });
  const { data: sliderAdData } = useQuery({
    queryKey: ["ads", "homepage", "in-feed-14"],
    queryFn: async () => {
      const res = await fetch("/api/ads?pageType=homepage&position=in-feed-14&activeOnly=true", { cache: "no-store" });
      if (!res.ok) return { items: [] };
      return res.json();
    },
    staleTime: 0,
    gcTime: 0,
  });
  const { data: leftSideAdData } = useQuery({
    queryKey: ["ads", "homepage", "in-feed-15"],
    queryFn: async () => {
      const res = await fetch("/api/ads?pageType=homepage&position=in-feed-15&activeOnly=true", { cache: "no-store" });
      if (!res.ok) return { items: [] };
      return res.json();
    },
    staleTime: 0,
    gcTime: 0,
  });

  const hasSideAd = !!sideAdData?.items?.length;
  const hasSliderAd = !!sliderAdData?.items?.length;
  const hasLeftSideAd = !!leftSideAdData?.items?.length;

  const renderSliderSlides = (height: number) => (
    <>
      {centerArticles.map((a, idx) => (
        <>
          <SwiperSlide key={a.slug} style={{ height: `${height}px` }}>
            <SliderPost article={a} categories={categories} height={height} fill />
          </SwiperSlide>
          {hasSliderAd && idx > 0 && (idx + 1) % 3 === 0 && (
            <SwiperSlide key={`ad-${idx}`} style={{ height: `${height}px` }}>
              <div style={{ width: "100%", height: "100%", position: "relative" }}>
                <InFeedNativeAd pageType="homepage" position="in-feed-14" cardStyle="hero-side" />
              </div>
            </SwiperSlide>
          )}
        </>
      ))}
    </>
  );

  return (
    <div style={{ position: "relative" }}>
      {/* ── MOBILE LAYOUT (< md) ─────────────────── */}
      <div className="md:hidden">
        {/* Top 2 cards */}
        <div className="grid grid-cols-2" style={{ gap: 0 }}>
          <div style={{ marginInlineEnd: "2px", marginBottom: "2px" }}>
              <SliderPost article={leftArticles[0]} categories={categories} height={170} />
            </div>
            <div style={{ marginBottom: "2px" }}>
              <SliderPost article={leftArticles[1]} categories={categories} height={170} />
          </div>
        </div>

        {/* Slider */}
        <div className="relative" style={{ marginBottom: "2px" }}>
          <Swiper
            modules={[Autoplay, Navigation, Pagination]}
            loop
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            navigation={{ prevEl: ".hero-m-prev", nextEl: ".hero-m-next" }}
            pagination={{ clickable: true, el: ".hero-m-pagination" }}
            className="h-full"
          >
            {renderSliderSlides(280)}
          </Swiper>
          <SliderNav prefix="hero-m" />
          <div className="hero-m-pagination absolute bottom-3 left-0 right-0 z-10 flex justify-center gap-1.5" />
        </div>

          {/* Bottom 2 cards */}
        <div className="grid grid-cols-2" style={{ gap: 0 }}>
          <div style={{ marginInlineEnd: "2px" }}>
            {hasLeftSideAd ? (
              <DismissibleAdCard position="in-feed-15" article={rightArticles[1]} categories={categories} height={170} onDismiss={() => setSideAdDismissed(true)} />
            ) : (
              <SliderPost article={rightArticles[1]} categories={categories} height={170} />
            )}
          </div>
          <div>
            <SliderPost article={rightArticles[2]} categories={categories} height={170} />
          </div>
        </div>
      </div>

      {/* ── MEDIUM LAYOUT (md to xl) ─────────────────── */}
      <div className="hidden md:block xl:hidden">
        <div className="flex" style={{ gap: 0 }}>
          {/* LEFT - Slider (45%) */}
          <div className="relative" style={{ width: "45%", flexShrink: 0 }}>
            <Swiper
              modules={[Autoplay, Navigation, Pagination]}
              loop
              autoplay={{ delay: 5000, disableOnInteraction: false }}
              navigation={{ prevEl: ".hero-t-prev", nextEl: ".hero-t-next" }}
              pagination={{ clickable: true, el: ".hero-t-pagination" }}
              className="h-full"
            >
              {renderSliderSlides(420)}
            </Swiper>
            <SliderNav prefix="hero-t" />
            <div className="hero-t-pagination absolute bottom-3 left-0 right-0 z-10 flex justify-center gap-1.5" />
          </div>

          {/* RIGHT - 3 cards (55%): 1 full + 2 half (1 ad) */}
          <div style={{ width: "55%", flexShrink: 0 }}>
            {/* Full width card */}
            <div style={{ marginBottom: "2px", marginInlineStart: "2px" }}>
              <SliderPost article={rightArticles[0]} categories={categories} height={180} />
            </div>
            {/* 2 half width cards */}
            <div className="flex" style={{ gap: 0 }}>
              <div style={{ width: "50%", marginInlineStart: "2px", marginBottom: "2px" }}>
                {hasSideAd ? (
                  <DismissibleAdCard position="in-feed-13" article={rightArticles[1]} categories={categories} height={180} onDismiss={() => setSideAdDismissed(true)} />
                ) : (
                  <SliderPost article={rightArticles[1]} categories={categories} height={180} />
                )}
              </div>
              <div style={{ width: "50%", marginInlineStart: "2px", marginBottom: "2px" }}>
                <SliderPost article={rightArticles[2]} categories={categories} height={180} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── DESKTOP LAYOUT (xl+) ─────────────────── */}
      <div className="hidden xl:block">
        <div className="flex" style={{ gap: 0 }}>
          {/* LEFT COLUMN - 33%: 2 cards side-by-side + 1 ad/article */}
          <div style={{ width: "33.333%", flexShrink: 0 }}>
            <div className="flex" style={{ gap: 0 }}>
              <div style={{ width: "50%", marginInlineEnd: "2px", marginBottom: "2px" }}>
                <SliderPost article={leftArticles[0]} categories={categories} height={260} />
              </div>
              <div style={{ width: "50%", marginBottom: "2px" }}>
                <SliderPost article={leftArticles[1]} categories={categories} height={260} />
              </div>
            </div>
            <div style={{ marginBottom: "2px", marginInlineEnd: "2px" }}>
              {hasLeftSideAd ? (
                <DismissibleAdCard position="in-feed-15" article={leftArticles[2]} categories={categories} height={260} onDismiss={() => setSideAdDismissed(true)} />
              ) : (
                <SliderPost article={leftArticles[2]} categories={categories} height={260} />
              )}
            </div>
          </div>

          {/* CENTER COLUMN - 33%: Slider */}
          <div className="relative" style={{ width: "33.333%", flexShrink: 0 }}>
            <Swiper
              modules={[Autoplay, Navigation, Pagination]}
              loop
              autoplay={{ delay: 5000, disableOnInteraction: false }}
              navigation={{ prevEl: ".hero-d-prev", nextEl: ".hero-d-next" }}
              pagination={{ clickable: true, el: ".hero-d-pagination" }}
              className="h-full"
            >
              {renderSliderSlides(520)}
            </Swiper>
            <SliderNav prefix="hero-d" />
            <div className="hero-d-pagination absolute bottom-3 left-0 right-0 z-10 flex justify-center gap-1.5" />
          </div>

          {/* RIGHT COLUMN - 33%: 1 full width + 2 side-by-side */}
          <div style={{ width: "33.333%", flexShrink: 0 }}>
            <div style={{ marginBottom: "2px", marginInlineStart: "2px" }}>
              <SliderPost article={rightArticles[0]} categories={categories} height={260} />
            </div>
            <div className="flex" style={{ gap: 0 }}>
              <div style={{ width: "50%", marginInlineStart: "2px", marginBottom: "2px" }}>
                {hasSideAd ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "260px", backgroundColor: "var(--card-bg, #1a1a2e)" }}>
                    <InFeedNativeAd pageType="homepage" position="in-feed-13" variant="grid" />
                  </div>
                ) : (
                  <SliderPost article={rightArticles[1]} categories={categories} height={260} />
                )}
              </div>
              <div style={{ width: "50%", marginInlineStart: "2px", marginBottom: "2px" }}>
                <SliderPost article={rightArticles[2]} categories={categories} height={260} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
