"use client";

import { useTranslations } from "@/hooks/useTranslations";

interface WhenLoserWinsProps {
  scenarios: string[];
  loserName: string;
}

export default function WhenLoserWins({ scenarios, loserName }: WhenLoserWinsProps) {
  if (!scenarios || scenarios.length === 0) return null;

  const tComparison = useTranslations("comparison");

  return (
    <section id="when-loser-wins" className="rounded-xl border border-amber-800/50 bg-amber-900/10 p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-block rounded bg-amber-600 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white">
          {tComparison("note")}
        </span>
        <h3 className="text-lg font-bold text-white">
          {tComparison("whenWins").replace("{name}", loserName || "")}
        </h3>
      </div>
      <p className="mb-4 text-sm text-zinc-400">
        {tComparison("everyProductStrengths").replace("{name}", loserName || "")}
      </p>
      <ul className="space-y-3">
        {scenarios.map((scenario, i) => (
          <li key={i} className="flex gap-3 text-sm text-zinc-300">
            <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-amber-600/20 text-xs font-bold text-amber-400">
              {i + 1}
            </span>
            <span>{scenario}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
