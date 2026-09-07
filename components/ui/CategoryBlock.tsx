"use client";
import Link from "next/link";
import type { Article, Category } from "@/types";
import { formatDate } from "@/lib/dateFormat";

interface Props {
  title: string;
  categorySlug: string;
  articles: Article[];
  categories: Category[];
  color?: string;
}

export default function CategoryBlock({ title, categorySlug, articles, categories, color }: Props) {
  const cat = categories.find(c => c.slug === categorySlug);
  const catColor = color || cat?.color || "#EF4444";
  const items = articles.filter(a => a.category === categorySlug);
  const featured = items[0];
  const grid = items.slice(1, 5);

  if (!featured) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between border-b-2 mb-4" style={{ borderColor: catColor }}>
        <h4 className="text-base font-bold text-gray-900 pb-2">
          <Link href={`/category/${categorySlug}`} className="hover:text-[#EF4444] transition-colors">{title}</Link>
        </h4>
        <div className="flex gap-3 text-[11px]">
          <button className="text-[#EF4444] font-semibold">Recent</button>
          <button className="text-gray-500 hover:text-[#EF4444] font-semibold">Popular</button>
          <button className="text-gray-500 hover:text-[#EF4444] font-semibold">Random</button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="group overflow-hidden rounded">
          <Link href={`/posts/${featured.slug}`} className="block relative overflow-hidden">
            <img src={featured.image} alt={featured.title} className="w-full h-[200px] md:h-[300px] object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded text-white mb-2 inline-block" style={{ backgroundColor: catColor }}>
                {cat?.label || categorySlug}
              </span>
              <h3 className="text-lg font-bold text-white leading-tight mb-1">
                <Link href={`/posts/${featured.slug}`} className="hover:text-[#EF4444] transition-colors">{featured.title}</Link>
              </h3>
              <p className="text-xs text-gray-300 line-clamp-2">{featured.excerpt}</p>
              <ul className="flex items-center gap-2 mt-2 text-[11px] text-gray-300">
                <li>By <span className="text-white font-semibold">{featured.authorName}</span></li>
                <li>{formatDate(featured.date, { month: "short", day: "numeric", year: "numeric" })}</li>
                <li>{featured.views.toLocaleString()} views</li>
              </ul>
            </div>
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {grid.map((a) => (
            <div key={a.slug} className="group overflow-hidden rounded">
              <Link href={`/posts/${a.slug}`} className="block relative overflow-hidden">
                <img src={a.image} alt={a.title} className="w-full h-[140px] md:h-[160px] object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: catColor }}>
                    {cat?.label || categorySlug}
                  </span>
                  <h5 className="text-xs font-bold text-white mt-1 line-clamp-2 leading-snug">
                    <Link href={`/posts/${a.slug}`} className="hover:text-[#EF4444] transition-colors">{a.title}</Link>
                  </h5>
                  <ul className="flex items-center gap-1 mt-1 text-[10px] text-gray-300">
                    <li>By {a.authorName}</li>
                    <li>{formatDate(a.date, { month: "short", day: "numeric", year: "numeric" })}</li>
                  </ul>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
