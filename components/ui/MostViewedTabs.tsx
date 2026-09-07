"use client";
import { useState } from "react";
import Link from "next/link";
import type { Article } from "@/types";
import { formatDate } from "@/lib/dateFormat";

interface Props { articles: Article[]; }

export default function MostViewedTabs({ articles }: Props) {
  const [tab, setTab] = useState<"most" | "popular">("most");
  const sorted = [...articles].sort((a, b) => b.views - a.views);

  return (
    <div className="bg-white border border-gray-200">
      <div className="flex border-b border-gray-200">
        <button onClick={() => setTab("most")} className={`flex-1 py-2.5 text-xs font-bold uppercase transition-colors ${tab === "most" ? "bg-[#008900] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
          Most Viewed
        </button>
        <button onClick={() => setTab("popular")} className={`flex-1 py-2.5 text-xs font-bold uppercase transition-colors ${tab === "popular" ? "bg-[#008900] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
          Popular news
        </button>
      </div>
      <div className="p-3">
        {tab === "most" ? (
          <ul className="space-y-0">
            {sorted.slice(0, 5).map((a, i) => (
              <li key={a.slug} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                <span className="text-lg font-bold text-gray-300 shrink-0 w-6">{String(i + 1).padStart(2, "0")}</span>
                <Link href={`/posts/${a.slug}`} className="text-xs font-semibold text-gray-800 hover:text-[#EF4444] transition-colors leading-snug">
                  {a.title}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="space-y-3">
            {sorted.slice(0, 3).map((a) => (
              <div key={a.slug} className="flex gap-2">
                <div className="w-20 h-14 shrink-0 rounded overflow-hidden">
                  <img src={a.image} alt={a.title} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <Link href={`/posts/${a.slug}`} className="text-xs font-semibold text-gray-800 hover:text-[#EF4444] transition-colors line-clamp-2 leading-snug">
                    {a.title}
                  </Link>
                  <div className="text-[10px] text-gray-500 mt-1">{formatDate(a.date, { month: "short", day: "numeric", year: "numeric" })}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
