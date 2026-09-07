"use client";

import type { Entity } from "@/types";
import AffiliateCTA from "./AffiliateCTA";
import { useTranslations } from "@/hooks/useTranslations";

interface VerdictBoxProps {
  entityA: Entity;
  entityB: Entity;
  verdictWinner: "A" | "B" | "";
  verdictSummary?: string;
}

export default function VerdictBox({ entityA, entityB, verdictWinner, verdictSummary }: VerdictBoxProps) {
  const winnerEntity = verdictWinner === "A" ? entityA : entityB;
  const loserEntity = verdictWinner === "A" ? entityB : entityA;
  const tComparison = useTranslations("comparison");

  return (
    <section
      id="verdict"
      className="rounded-xl border border-emerald-800/50 bg-gradient-to-br from-emerald-900/30 to-zinc-900/50 p-6 md:p-8"
    >
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-block rounded bg-emerald-600 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white">
          TL;DR
        </span>
        <span className="text-sm font-semibold text-emerald-400">{tComparison("verdict")}</span>
      </div>

      <div className="mb-6">
        <h2 className="mb-2 text-xl font-bold text-white md:text-2xl">
          {winnerEntity.name || (verdictWinner === "A" ? "Entity A" : "Entity B")} {tComparison("wins")}
        </h2>
        {verdictSummary && (
          <p className="text-base text-zinc-300 leading-relaxed">{verdictSummary}</p>
        )}
        {!verdictSummary && (
          <p className="text-base text-zinc-400">
            {tComparison("everyProductStrengths").replace("{name}", winnerEntity.name || "")}{" "}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <AffiliateCTA
          entity={entityA}
          isWinner={verdictWinner === "A"}
          label={`${tComparison("checkPrice")} — ${entityA.name || "Option A"}`}
        />
        <AffiliateCTA
          entity={entityB}
          isWinner={verdictWinner === "B"}
          label={`${tComparison("checkPrice")} — ${entityB.name || "Option B"}`}
        />
      </div>
    </section>
  );
}
