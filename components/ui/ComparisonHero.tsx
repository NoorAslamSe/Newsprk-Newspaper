"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { Entity, Article } from "@/types";
import { useTranslations } from "@/hooks/useTranslations";
import { useRouter, useSearchParams } from "next/navigation";

interface ComparisonHeroProps {
  entityA: Entity;
  entityB: Entity;
  entityC?: Entity | null;
  verdictWinner?: "A" | "B" | "C" | "";
  category?: string;
  sameCategoryProducts?: Article[];
  currentProductSlugs?: { product?: string; vs?: string; vs2?: string };
  originalProductSlug?: string;
  originalVsSlug?: string;
  originalVs2Slug?: string;
  onProductSelect?: (product: Article) => void;
}

export default function ComparisonHero({
  entityA,
  entityB,
  entityC = null,
  verdictWinner,
  category,
  sameCategoryProducts = [],
  currentProductSlugs = {},
}: ComparisonHeroProps) {
  const [productSearch, setProductSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeColumn, setActiveColumn] = useState<"A" | "B" | "C">("B");
  const tComparison = useTranslations("comparison");
  const router = useRouter();
  const searchParams = useSearchParams();

  const excludeSlugs = useMemo(() => {
    const slugs: string[] = [];
    if (entityA?.offerId) slugs.push(entityA.offerId);
    if (entityB?.offerId) slugs.push(entityB.offerId);
    if (entityC?.offerId) slugs.push(entityC.offerId);
    return slugs;
  }, [entityA, entityB, entityC]);

  const filteredProducts = useMemo(() => {
    const available = sameCategoryProducts.filter((p) => !excludeSlugs.includes(p.slug));
    if (!productSearch.trim()) return available.slice(0, 8);
    const q = productSearch.toLowerCase();
    return available
      .filter(
        (p) =>
          p.product_name?.toLowerCase().includes(q) ||
          p.title.toLowerCase().includes(q) ||
          p.product_brand?.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [sameCategoryProducts, productSearch, excludeSlugs]);

  const buildCompareUrl = (selectedProduct: Article, targetColumn: "A" | "B" | "C") => {
    const params = new URLSearchParams(searchParams);
    const products = [
      searchParams.get("product") || "",
      searchParams.get("vs") || "",
      searchParams.get("vs2") || "",
    ];
    
    // Always put selected product in first position (product), shift others right
    // New product goes to product[0], existing shift right
    products.unshift(selectedProduct.slug);
    products.pop(); // Keep only 3
    
    params.delete("product");
    params.delete("vs");
    params.delete("vs2");
    if (products[0]) params.set("product", products[0]);
    if (products[1]) params.set("vs", products[1]);
    if (products[2]) params.set("vs2", products[2]);
    
    return `/compare?${params.toString()}`;
  };

  const handleProductSelect = (product: Article) => {
    const url = buildCompareUrl(product, activeColumn);
    router.push(url);
    setShowDropdown(false);
    setProductSearch("");
  };

  const renderEntityColumn = (
    entity: Entity,
    label: "A" | "B" | "C",
    isActive: boolean,
    isRightColumn: boolean,
    showVs: boolean
  ) => {
    const hasImage = entity?.image || entity?.name;
    const isWinner = verdictWinner === label;

    return (
      <div
        className={`flex flex-col items-center ${
          isRightColumn ? "px-6 py-8" : "border-b border-zinc-800 px-6 py-8 md:border-b-0 md:border-r md:border-zinc-800"
        }`}
      >
        {/* Dropdown ABOVE the entity card — fixed height wrapper to prevent layout shift */}
        <div className="mb-4 h-[68px] w-full max-w-xs">
          {isActive && sameCategoryProducts.length > 0 && (
            <div className="relative w-full">
              <div className="mb-1 text-center">
                <strong className="text-xs font-semibold text-zinc-500">{tComparison("compareWith")}</strong>
              </div>
              <input
                type="text"
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                placeholder={tComparison("searchProducts")}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-indigo-500 transition-colors"
                autoFocus
              />
              <svg
                className="absolute right-3 top-[38px] text-zinc-500"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>

              {/* Dropdown results BELOW search input */}
              {showDropdown && filteredProducts.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-800 shadow-xl">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.slug}
                      onClick={() => handleProductSelect(product)}
                      className="w-full flex items-center gap-3 p-3 transition-colors hover:bg-zinc-700 text-left"
                    >
                      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-zinc-700">
                        {product.image && (
                          <Image
                            src={product.image}
                            alt={product.product_name || product.title}
                            fill
                            className="object-cover"
                            sizes="32px"
                          />
                        )}
                      </div>
                      <div className="min-w-0 text-left">
                        <p className="truncate text-xs font-semibold text-white">
                          {product.product_name || product.title}
                        </p>
                        {product.product_price && (
                          <p className="text-[11px] text-zinc-400">{product.product_price}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Product card */}
        <div
          className={`relative mb-4 h-36 w-36 overflow-hidden rounded-xl border-2 transition-all ${
            activeColumn === label ? "border-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.4)]" : "border-zinc-700"
          } bg-zinc-800 md:h-44 md:w-44 cursor-pointer`}
          onClick={() => {
            setActiveColumn(label);
            setShowDropdown(true);
          }}
        >
          {entity.image ? (
            <Image src={entity.image} alt={entity.name} fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl text-zinc-600">{label}</div>
          )}
          {verdictWinner === label && (
            <div className="absolute inset-0 rounded-xl border-2 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]" />
          )}
        </div>
        {/* Product name */}
        <h3 className="mb-1 text-center text-lg font-bold text-white md:text-xl">
          {entity.name || `Product ${label}`}
        </h3>
        {/* Price */}
        {entity.priceRange && (
          <p className="text-sm text-zinc-400">{entity.priceRange}</p>
        )}
        {!isActive && !sameCategoryProducts.length && (
          <p className="text-center text-[11px] text-zinc-500">{tComparison("addProduct")}</p>
        )}
      </div>
    );
  };

  return (
    <section className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
      {/* Category badge */}
      {category && (
        <div className="border-b border-zinc-800 px-6 py-3 text-center">
          <span className="inline-block rounded-full bg-indigo-600/20 px-3 py-1 text-xs font-semibold text-indigo-400">
            {category}
          </span>
        </div>
      )}

      {/* 3-Column Header: Product A | VS | Product B [| Product C] */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
        {/* ── Entity A (Left Column) ──────────────────────── */}
        {renderEntityColumn(entityA, "A", activeColumn === "A", false, true)}

        {/* ── VS Badge ────────────────────────────── */}
        <div className="flex items-center justify-center px-4 py-8 md:px-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-indigo-500 bg-indigo-600 text-lg font-black text-white shadow-lg shadow-indigo-500/30 md:h-16 md:w-16 md:text-xl">
            VS
          </div>
        </div>

        {/* ── Entity B (Middle Column) ──────────────────────── */}
        {renderEntityColumn(entityB, "B", activeColumn === "B", false, entityC !== null)}

        {/* ── VS Badge 2 (for 3-way) ────────────────────────────── */}
        {entityC && (
          <>
            <div className="flex items-center justify-center px-4 py-8 md:px-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-indigo-500 bg-indigo-600 text-lg font-black text-white shadow-lg shadow-indigo-500/30 md:h-16 md:w-16 md:text-xl">
                VS
              </div>
            </div>
            {/* ── Entity C (Right Column) ──────────────────────── */}
            {renderEntityColumn(entityC, "C", activeColumn === "C", true, false)}
          </>
        )}
      </div>
    </section>
  );
}