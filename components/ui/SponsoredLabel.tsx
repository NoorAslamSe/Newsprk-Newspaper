"use client";

import { useTranslations } from "@/hooks/useTranslations";

interface SponsoredLabelProps {
  advertiser?: string;
  className?: string;
}

export default function SponsoredLabel({ advertiser, className }: SponsoredLabelProps) {
  const tComparison = useTranslations("comparison");
  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      <span className="inline-block rounded bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">
        {tComparison("sponsoredLabel")}
      </span>
      {advertiser && (
        <span className="text-xs text-zinc-500">by {advertiser}</span>
      )}
    </div>
  );
}
