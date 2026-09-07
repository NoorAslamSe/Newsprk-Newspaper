"use client";

import { useTranslations } from "@/hooks/useTranslations";

interface PriceDisplayProps {
  priceRange?: string;
  offerId?: string;
  className?: string;
}

export default function PriceDisplay({ priceRange, offerId, className }: PriceDisplayProps) {
  const tComparison = useTranslations("comparison");
  if (!priceRange && !offerId) {
    return (
      <span className={`text-sm text-zinc-500 ${className || ""}`}>
        {tComparison("checkPriceShort")}
      </span>
    );
  }

  if (priceRange) {
    return (
      <span className={`text-sm font-semibold text-white ${className || ""}`}>
        {priceRange}
      </span>
    );
  }

  return (
    <span className={`text-sm text-zinc-400 ${className || ""}`}>
      {tComparison("checkPriceShort")}
    </span>
  );
}
