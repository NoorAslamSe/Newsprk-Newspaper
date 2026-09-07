"use client";

import { useTranslations } from "@/hooks/useTranslations";

interface ProsConsListProps {
  prosA: string[];
  consA: string[];
  prosB: string[];
  consB: string[];
  entityAName: string;
  entityBName: string;
}

function CheckIcon() {
  return (
    <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function ListBlock({ title, items, type }: { title: string; items: string[]; type: "pros" | "cons" }) {
  const tComparison = useTranslations("comparison");
  const isPros = type === "pros";
  return (
    <div className="flex-1">
      <h4 className={`mb-3 text-sm font-bold uppercase tracking-wider ${isPros ? "text-emerald-400" : "text-red-400"}`}>
        {isPros ? tComparison("pros") : tComparison("cons")} — {title}
      </h4>
      {items.length === 0 ? (
        <p className="text-sm text-zinc-500 italic">{tComparison("noSpecsDropdown")}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2 text-sm text-zinc-300">
              {isPros ? <CheckIcon /> : <XIcon />}
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ProsConsList({ prosA, consA, prosB, consB, entityAName, entityBName }: ProsConsListProps) {
  return (
    <div className="space-y-6">
      {/* Entity A */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5">
        <h3 className="mb-4 text-base font-bold text-white">{entityAName || "Entity A"}</h3>
        <div className="flex flex-col gap-6 sm:flex-row">
          <ListBlock title={entityAName || "A"} items={prosA} type="pros" />
          <ListBlock title={entityAName || "A"} items={consA} type="cons" />
        </div>
      </div>

      {/* Entity B */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5">
        <h3 className="mb-4 text-base font-bold text-white">{entityBName || "Entity B"}</h3>
        <div className="flex flex-col gap-6 sm:flex-row">
          <ListBlock title={entityBName || "B"} items={prosB} type="pros" />
          <ListBlock title={entityBName || "B"} items={consB} type="cons" />
        </div>
      </div>
    </div>
  );
}
