"use client";

import type { SpecRow, Entity } from "@/types";
import { DEPLOYMENT_LOCALE, isRtl } from "@/lib/i18n";
import { useTranslations } from "@/hooks/useTranslations";

interface SpecMatrixTableProps {
  specs: SpecRow[];
  entityA: Entity;
  entityB: Entity;
}

/**
 * SpecMatrixTable — RTL entity binding is CRITICAL.
 *
 * RULE (§2.3 / MM CTO data-integrity rule):
 *   Entity-to-column binding MUST be driven by entity ID, never by DOM order.
 *   Product A's specs can NEVER render under Product B's header in any locale.
 *
 * Implementation:
 *   - Entity A is ALWAYS column 1 in the DOM, Entity B is ALWAYS column 2.
 *   - The RTL flip is purely presentational via CSS `direction: rtl` on the wrapper.
 *   - No data swapping occurs — val_A always binds to Entity A's column.
 *   - This is a pass/fail QA scenario (§13 ENTITY-BINDING-TEST).
 */
export default function SpecMatrixTable({ specs, entityA, entityB }: SpecMatrixTableProps) {
  const rtl = isRtl(DEPLOYMENT_LOCALE);
  const tComparison = useTranslations("comparison");

  if (!specs || specs.length === 0) {
    return (
      <p className="py-8 text-center text-zinc-500">{tComparison("noSpecifications")}</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      {/*
        RTL flip: direction="rtl" on the wrapper flips column order visually.
        Entity A (DOM column 1) moves to the right (primary anchor in Arabic).
        Entity B (DOM column 2) moves to the left.
        Data binding stays entity-ID-driven: val_A always = Entity A's data.
      */}
      <table
        className="spec-matrix-table w-full min-w-[600px] border-collapse"
        dir={rtl ? "rtl" : "ltr"}
        data-entity-a={entityA.name}
        data-entity-b={entityB.name}
        data-rtl={rtl}
      >
        <thead>
          <tr className="border-b border-zinc-700">
            <th className="w-1/3 px-4 py-3 text-sm font-semibold text-zinc-400" style={{ textAlign: "start" }}>
              {tComparison("feature")}
            </th>
            <th className="w-[30%] px-4 py-3 text-sm font-semibold text-zinc-400" style={{ textAlign: "center" }}>
              {entityA.name || "Entity A"}
            </th>
            <th className="w-[30%] px-4 py-3 text-sm font-semibold text-zinc-400" style={{ textAlign: "center" }}>
              {entityB.name || "Entity B"}
            </th>
          </tr>
        </thead>
        <tbody>
          {specs.map((spec, i) => (
            <tr
              key={i}
              className={`border-b border-zinc-800 transition-colors ${
                i % 2 === 0 ? "bg-zinc-900/30" : ""
              }`}
            >
              <td className="px-4 py-3 text-sm font-medium text-zinc-300" style={{ textAlign: "start" }}>
                {spec.feature}
              </td>
              {/* Entity A column — ALWAYS val_A, winner check is "A" */}
              <td
                className={`px-4 py-3 text-center text-sm ${
                  spec.winner === "A"
                    ? "bg-emerald-900/20 font-semibold text-emerald-400"
                    : "text-zinc-300"
                }`}
              >
                {spec.val_A}
                {spec.winner === "A" && <span className="ms-1 text-emerald-500">{tComparison("winner")}</span>}
              </td>
              {/* Entity B column — ALWAYS val_B, winner check is "B" */}
              <td
                className={`px-4 py-3 text-center text-sm ${
                  spec.winner === "B"
                    ? "bg-emerald-900/20 font-semibold text-emerald-400"
                    : "text-zinc-300"
                }`}
              >
                {spec.val_B}
                {spec.winner === "B" && <span className="ms-1 text-emerald-500">{tComparison("winner")}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
