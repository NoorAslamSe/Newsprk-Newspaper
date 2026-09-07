"use client";

import Link from "next/link";
import { useTranslations } from "@/hooks/useTranslations";

interface InlineDisclosureProps {
  className?: string;
}

export default function InlineDisclosure({ className }: InlineDisclosureProps) {
  const tComparison = useTranslations("comparison");
  return (
    <div
      className={`rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-xs text-zinc-400 ${className || ""}`}
    >
      <span className="font-medium text-zinc-300">{tComparison("disclosure")}</span>{" "}
      {tComparison("disclosureText")}{" "}
      <Link href="/methodology" className="text-indigo-400 underline underline-offset-2 hover:text-indigo-300">
        {tComparison("learnHowWeTest")}
      </Link>
    </div>
  );
}
