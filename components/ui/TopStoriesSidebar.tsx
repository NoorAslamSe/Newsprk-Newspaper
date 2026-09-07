"use client";
import { useState } from "react";
import Link from "next/link";
import type { Article, Category } from "@/types";
import { formatDate } from "@/lib/dateFormat";
import { useTranslations } from "@/hooks/useTranslations";

interface Props { articles: Article[]; categories: Category[]; }

export default function TopStoriesSidebar({ articles, categories }: Props) {
  const [tab, setTab] = useState<"most" | "popular">("most");
  const tCommon = useTranslations("common");
  const sorted = [...articles].sort((a, b) => b.views - a.views);

  return (
    <div>
      <h4 className="text-base font-bold text-gray-900 mb-3 pb-2 border-b-2 border-[#EF4444]">
        <span className="font-black">{tCommon("topStories")}</span>
      </h4>
      <div className="space-y-3 pb-4 border-b border-gray-200 mb-4">
        {articles.slice(0, 3).map((a) => {
          const cat = categories.find(c => c.slug === a.category);
          return (
            <div key={a.slug} className="pb-3 border-b border-gray-100 last:border-0 last:pb-0">
              <h6 className="text-sm font-bold text-gray-900 leading-snug mb-1">
                <Link href={`/posts/${a.slug}`} className="hover:text-[#EF4444] transition-colors">{a.title}</Link>
              </h6>
              <div className="flex items-center gap-2 text-[10px] text-gray-500 mb-1">
                <span className="font-semibold" style={{ color: cat?.color }}>{cat?.label}</span>
                <span>{formatDate(a.date, { month: "short", day: "numeric", year: "numeric" })}</span>
              </div>
              <p className="text-xs text-gray-600 line-clamp-2">{a.excerpt}</p>
            </div>
          );
        })}
      </div>
      <div>
        <div className="flex border-b border-gray-200 mb-3">
          <button onClick={() => setTab("most")} className={`pb-2 text-xs font-bold uppercase me-4 transition-colors ${tab === "most" ? "text-[#008900] border-b-2 border-[#008900]" : "text-gray-500 hover:text-gray-700"}`}>
            {tCommon("mostViewed")}
          </button>
          <button onClick={() => setTab("popular")} className={`pb-2 text-xs font-bold uppercase transition-colors ${tab === "popular" ? "text-[#008900] border-b-2 border-[#008900]" : "text-gray-500 hover:text-gray-700"}`}>
            {tCommon("popularNews")}
          </button>
        </div>
        {tab === "most" ? (
          <ul className="space-y-0">
            {sorted.slice(0, 5).map((a, i) => (
              <li key={a.slug} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                <span className="text-lg font-bold text-gray-300 shrink-0 w-6">{String(i + 1).padStart(2, "0")}</span>
                <Link href={`/posts/${a.slug}`} className="text-xs font-semibold text-gray-800 hover:text-[#008900] transition-colors leading-snug">
                  {a.title}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="space-y-3">
            {sorted.slice(0, 3).map((a) => (
              <div key={a.slug} className="flex gap-2">
                <div className="w-16 h-12 shrink-0 rounded overflow-hidden">
                  <img src={a.image} alt={a.title} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <Link href={`/posts/${a.slug}`} className="text-[11px] font-semibold text-gray-800 hover:text-[#008900] transition-colors line-clamp-2 leading-snug">
                    {a.title}
                  </Link>
                  <div className="text-[10px] text-gray-500 mt-0.5">{formatDate(a.date, { month: "short", day: "numeric", year: "numeric" })}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
