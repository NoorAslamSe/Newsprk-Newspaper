"use client";

import { useEffect, useState } from "react";
import type { Entity, PageClass } from "@/types";
import AffiliateCTA from "./AffiliateCTA";
import { useTranslations } from "@/hooks/useTranslations";

interface StickyMobileBarProps {
  entityA: Entity;
  entityB: Entity;
  winner: "A" | "B" | "";
  pageClass?: PageClass;
}

export default function StickyMobileBar({ entityA, entityB, winner, pageClass }: StickyMobileBarProps) {
  const [visible, setVisible] = useState(false);
  const tComparison = useTranslations("comparison");

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 400);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-800 bg-zinc-950/98 backdrop-blur-md md:hidden">
      {/* Compact disclosure — D5 requirement */}
      <div className="py-1 text-center text-[10px] text-zinc-500">
        {tComparison("weMayEarnCommission")}
      </div>

      <div className="flex gap-2 px-3 pb-3">
        <AffiliateCTA
          entity={entityA}
          isWinner={winner === "A"}
          label={tComparison("checkPriceShort")}
          className="flex-1 text-xs"
        />
        <AffiliateCTA
          entity={entityB}
          isWinner={winner === "B"}
          label={tComparison("checkPriceShort")}
          className="flex-1 text-xs"
        />
      </div>
    </div>
  );
}
