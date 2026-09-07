"use client";

import { formatDate } from "@/lib/dateFormat";
import { useTranslations } from "@/hooks/useTranslations";

interface LastVerifiedBadgeProps {
  lastVerifiedDate: string | null;
  refreshDueDate?: string | null;
}

export default function LastVerifiedBadge({ lastVerifiedDate, refreshDueDate }: LastVerifiedBadgeProps) {
  if (!lastVerifiedDate) return null;

  const tComparison = useTranslations("comparison");
  const verified = new Date(lastVerifiedDate);
  const now = new Date();
  const daysSince = Math.floor((now.getTime() - verified.getTime()) / (1000 * 60 * 60 * 24));
  const isStale = refreshDueDate && new Date(refreshDueDate) < now;

  const formatted = formatDate(lastVerifiedDate, { year: "numeric", month: "short", day: "numeric" });

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
        isStale
          ? "border border-red-800/50 bg-red-900/20 text-red-400"
          : "border border-zinc-700 bg-zinc-800/50 text-zinc-300"
      }`}
    >
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>
        {tComparison("lastVerifiedLabel").replace("{date}", formatted)}
        {daysSince > 0 && ` ${tComparison("daysAgoShort").replace("{n}", String(daysSince))}`}
      </span>
      {isStale && (
        <span className="rounded bg-red-600/30 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-400">
          {tComparison("dueForRefresh")}
        </span>
      )}
    </div>
  );
}
