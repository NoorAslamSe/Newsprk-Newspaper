"use client";
import { useMemo } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import Link from "next/link";
import { useTranslations } from "@/hooks/useTranslations";
import type { Article } from "@/types";

interface Props { articles: Article[]; }

export default function NewsTicker({ articles }: Props) {
  const tHome = useTranslations("home");
  const isRtl = useMemo(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.dir === "rtl";
  }, []);

  const prevArrow = isRtl ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7";
  const nextArrow = isRtl ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7";

  return (
    <div className="mx-auto" style={{ maxWidth: "1140px", padding: "0 12px" }}>
      <div className="relative flex items-stretch" style={{ lineHeight: "30px", margin: 0 }}>
        {/* Trending Now badge */}
        <div
          className="ticker-badge relative flex items-center shrink-0"
          style={{
            backgroundColor: "#EF4444",
            color: "#fff",
            fontSize: "11px",
            fontWeight: 700,
            padding: "0 16px 0 12px",
            textTransform: "uppercase",
            letterSpacing: "0.3px",
            zIndex: 2,
            whiteSpace: "nowrap",
          }}
        >
          {tHome("trendingNow")}
          <div
            className="ticker-badge-arrow absolute top-0"
            style={{
              insetInlineEnd: -8,
              width: 0,
              height: 0,
              borderTop: "15px solid transparent",
              borderBottom: "15px solid transparent",
              borderLeft: isRtl ? "none" : "8px solid #EF4444",
              borderRight: isRtl ? "8px solid #EF4444" : "none",
            }}
          />
        </div>
        {/* Ticker content */}
        <div className="ticker-content flex items-center flex-1 min-w-0" style={{ paddingInlineStart: "16px", paddingInlineEnd: "70px" }}>
          <div className="flex-1 overflow-hidden">
            <Swiper
              modules={[Autoplay, Navigation]}
              slidesPerView={1}
              loop
              autoplay={{ delay: 3000, disableOnInteraction: false }}
              navigation={{ prevEl: isRtl ? ".ticker-prev" : ".ticker-next", nextEl: isRtl ? ".ticker-next" : ".ticker-prev" }}
            >
              {articles.slice(0, 6).map((a) => (
                <SwiperSlide key={a.slug}>
                  <Link
                    href={`/posts/${a.slug}`}
                    className="block truncate hover:text-[#eb0254] transition-colors"
                    style={{ fontSize: "15px", lineHeight: "30px", color: "var(--body-fcolor, #fff)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >
                    {a.title}
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
        {/* Navigation arrows */}
        <div className="ticker-nav absolute top-0 flex items-center gap-1" style={{ insetInlineEnd: 0, height: "30px" }}>
          <button
            className="ticker-prev flex items-center justify-center transition-colors hover:bg-[#EF4444] hover:text-white"
            style={{
              height: "30px",
              width: "30px",
              border: "1px solid #d2d2d2",
              color: "#777",
              backgroundColor: "transparent",
              borderRadius: "50%",
            }}
          >
            <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d={prevArrow} />
            </svg>
          </button>
          <button
            className="ticker-next flex items-center justify-center transition-colors hover:bg-[#EF4444] hover:text-white"
            style={{
              height: "30px",
              width: "30px",
              border: "1px solid #d2d2d2",
              color: "#777",
              backgroundColor: "transparent",
              borderRadius: "50%",
            }}
          >
            <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d={nextArrow} />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
