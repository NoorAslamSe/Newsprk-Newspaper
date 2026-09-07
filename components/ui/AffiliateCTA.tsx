"use client";

import type { Entity } from "@/types";
import { useTranslations } from "@/hooks/useTranslations";

interface AffiliateCTAProps {
  entity: Entity;
  isWinner?: boolean;
  label?: string;
  className?: string;
}

export default function AffiliateCTA({ entity, isWinner, label, className }: AffiliateCTAProps) {
  const offerId = entity.offerId;
  const tComparison = useTranslations("comparison");

  if (!offerId) {
    return (
      <span
        className={`inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-bold transition-all duration-200 ${
          isWinner
            ? "bg-amber-500 text-black hover:bg-amber-400"
            : "border border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-700"
        } ${className || ""}`}
      >
        {label || tComparison("checkPriceShort")}
      </span>
    );
  }

  return (
    <a
      href={`/go/${offerId}`}
      target="_blank"
      rel="sponsored nofollow"
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
        isWinner
          ? "bg-amber-500 text-black shadow-amber-500/20 hover:bg-amber-400 hover:shadow-amber-500/30"
          : "border border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-700 hover:text-white"
      } ${className || ""}`}
    >
      {label || tComparison("checkPriceShort")}
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  );
}
