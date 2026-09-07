"use client";
import Link from "next/link";
import { useTranslations } from "@/hooks/useTranslations";

interface Props { tags: string[]; }

export default function TagsCloud({ tags }: Props) {
  const tWidgets = useTranslations("widgets");
  return (
    <div className="bg-white border border-gray-200 p-4">
      <h4 className="text-sm font-bold text-gray-900 mb-3">{tWidgets("tags")}</h4>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <Link key={tag} href={`/tag/${tag}`} className="text-[11px] font-semibold px-2.5 py-1 rounded bg-[#4c66a3] text-white hover:bg-[#EF4444] transition-colors">
            {tag}
          </Link>
        ))}
      </div>
    </div>
  );
}
