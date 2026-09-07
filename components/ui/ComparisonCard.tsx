"use client";

import Link from "next/link";
import Image from "next/image";
import type { ComparisonArticle } from "@/types";
import CategoryBadge from "./CategoryBadge";
import { useTranslations } from "@/hooks/useTranslations";

interface ComparisonCardProps {
  article: ComparisonArticle;
  variant?: "grid" | "list" | "small" | "hero";
  counter?: number;
}

export default function ComparisonCard({ article, variant = "grid", counter }: ComparisonCardProps) {
  const entityA = article.entity_A;
  const entityB = article.entity_B;
  const winner = article.verdict_winner;
  const imageA = entityA?.image || article.image;
  const imageB = entityB?.image;
  const tComparison = useTranslations("comparison");

  if (variant === "hero") {
    return (
      <Link href={`/compare/${article.slug}`} className="group relative block overflow-hidden rounded-xl">
        <div className="relative aspect-[16/9] w-full bg-zinc-800">
          {imageA && (
            <Image src={imageA} alt={entityA?.name || article.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-5">
          <CategoryBadge label={article.categoryLabel} category={article.category} />
          <h2 className="mt-2 text-xl font-bold text-white line-clamp-2 md:text-2xl">
            {entityA?.name || "A"} vs {entityB?.name || "B"} — {article.title}
          </h2>
          {winner && (
            <p className="mt-2 text-sm font-semibold text-emerald-400">
              {tComparison("winnerLabel").replace("{name}", winner === "A" ? entityA?.name : entityB?.name)}
            </p>
          )}
        </div>
      </Link>
    );
  }

  if (variant === "list") {
    return (
      <Link href={`/compare/${article.slug}`} className="comparison-card-list group flex gap-4 rounded-lg border border-zinc-800 bg-zinc-900/30 p-3 transition-colors hover:border-zinc-700 hover:bg-zinc-800/50">
        <div className="relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-800">
          {imageA && <Image src={imageA} alt={entityA?.name || ""} fill className="object-cover" />}
          {imageB && (
            <div className="comparison-thumb-overlay absolute end-1 top-1 h-8 w-8 overflow-hidden rounded border border-zinc-600">
              <Image src={imageB} alt={entityB?.name || ""} fill className="object-cover" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-indigo-400">
            {entityA?.name || "A"} vs {entityB?.name || "B"}
          </h4>
          <p className="mt-1 text-xs text-zinc-500">{article.categoryLabel}</p>
        </div>
      </Link>
    );
  }

  if (variant === "small") {
    return (
      <Link href={`/compare/${article.slug}`} className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-zinc-800/50">
        {counter && (
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded bg-zinc-800 text-xs font-bold text-zinc-400">
            {String(counter).padStart(2, "0")}
          </span>
        )}
        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-800">
          {imageA && <Image src={imageA} alt={entityA?.name || ""} fill className="object-cover" />}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-semibold text-white line-clamp-2 group-hover:text-indigo-400">
            {entityA?.name || "A"} vs {entityB?.name || "B"}
          </h4>
        </div>
      </Link>
    );
  }

  // Grid variant (default)
  return (
    <Link href={`/compare/${article.slug}`} className="group block overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/30 transition-all hover:border-zinc-700 hover:shadow-lg hover:shadow-zinc-900/50">
      {/* Entity images side by side */}
      <div className="comparison-card-grid relative flex h-40 bg-zinc-800">
        <div className="comparison-entity-a relative w-1/2">
          {imageA ? (
            <Image src={imageA} alt={entityA?.name || ""} fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-3xl text-zinc-600">A</div>
          )}
        </div>
        <div className="comparison-entity-b relative w-1/2">
          {imageB ? (
            <Image src={imageB} alt={entityB?.name || ""} fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-3xl text-zinc-600">B</div>
          )}
        </div>
        {/* VS overlay — uses logical `start`/`end` for RTL */}
        <div className="comparison-vs-badge absolute inset-y-0 left-1/2 flex -translate-x-1/2 items-center">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white shadow-lg">
            VS
          </span>
        </div>
        {/* Winner badge — uses logical `end` for RTL */}
        {winner && (
          <div className="comparison-winner-badge absolute end-2 top-2 rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
            {tComparison("winner")}
          </div>
        )}
      </div>

      <div className="p-4">
        <CategoryBadge label={article.categoryLabel} category={article.category} />
        <h3 className="mt-2 text-sm font-bold text-white line-clamp-2 group-hover:text-indigo-400">
          {entityA?.name || "A"} vs {entityB?.name || "B"}
        </h3>
        <p className="mt-1 text-xs text-zinc-500">
          {article.categoryLabel} {winner ? `• ${tComparison("winnerLabel").replace("{name}", winner === "A" ? entityA?.name : entityB?.name)}` : ""}
        </p>
      </div>
    </Link>
  );
}
