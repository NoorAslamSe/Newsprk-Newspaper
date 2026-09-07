"use client";

import { useTranslations } from "@/hooks/useTranslations";

const platforms = [
  { name: "Facebook", icon: "f", count: "2,035", color: "#4c66a3" },
  { name: "Twitter", icon: "𝕏", count: "3,794", color: "#2fc2ee" },
  { name: "Instagram", icon: "◉", count: "941", color: "#e4405f" },
  { name: "YouTube", icon: "▶", count: "7,820", color: "#e42c27" },
  { name: "Pinterest", icon: "P", count: "1,562", color: "#cb2028" },
  { name: "Vimeo", icon: "V", count: "1,310", color: "#1ab7ea" },
];

export default function SocialCounter() {
  const tSocial = useTranslations("social");
  return (
    <div className="bg-white border border-gray-200 p-4">
      <h4 className="text-sm font-bold text-gray-900 mb-3">{tSocial("joinFollowers")}</h4>
      <div className="grid grid-cols-3 gap-2">
        {platforms.map((p) => (
          <a key={p.name} href="#" className="flex flex-col items-center p-2 rounded hover:opacity-80 transition-opacity" style={{ backgroundColor: p.color + "15" }}>
            <span className="text-lg font-bold" style={{ color: p.color }}>{p.icon}</span>
            <span className="text-sm font-bold text-gray-900">{p.count}</span>
            <span className="text-[10px] text-gray-500">{tSocial(p.name === "YouTube" ? "subscribers" : p.name === "Facebook" ? "subscribers" : "followers")}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
