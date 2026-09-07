"use client";

import { useMemo, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Article } from "@/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTranslations } from "@/hooks/useTranslations";

interface PopularComparison {
  slug: string;
  title: string;
  entity_A?: { name: string; image?: string };
  entity_B?: { name: string; image?: string };
}

interface CompareViewProps {
  initialProductA: Article | null;
  initialProductB: Article | null;
  initialProductC: Article | null;
  sameCategoryProducts: Article[];
  categoryLabel: string;
  category: string;
  popularComparisons?: PopularComparison[];
}

export default function CompareView({
  initialProductA,
  initialProductB,
  initialProductC,
  sameCategoryProducts,
  categoryLabel,
  category,
  popularComparisons = [],
}: CompareViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tComparison = useTranslations("comparison");

  const [productA, setProductA] = useState<Article | null>(initialProductA);
  const [productB, setProductB] = useState<Article | null>(initialProductB);
  const [productC, setProductC] = useState<Article | null>(initialProductC);

  const excludedSlugs = useMemo(() => {
    const slugs: string[] = [];
    if (productA) slugs.push(productA.slug);
    if (productB) slugs.push(productB.slug);
    if (productC) slugs.push(productC.slug);
    return slugs;
  }, [productA, productB, productC]);

  const updateUrl = useCallback(
    (a: string | null, b: string | null, c: string | null) => {
      const params = new URLSearchParams();
      if (a) params.set("product", a);
      if (b) params.set("vs", b);
      if (c) params.set("vs2", c);
      const qs = params.toString();
      router.replace(qs ? `/compare?${qs}` : `/compare?product=`, { scroll: false });
    },
    [router]
  );

  const handleSelect = useCallback(
    (column: "A" | "B" | "C", slug: string) => {
      const article = sameCategoryProducts.find((p) => p.slug === slug);
      if (!article) return;

      let newA = productA;
      let newB = productB;
      let newC = productC;

      if (column === "A") newA = article;
      else if (column === "B") newB = article;
      else newC = article;

      setProductA(newA);
      setProductB(newB);
      setProductC(newC);

      updateUrl(
        newA?.slug || null,
        newB?.slug || null,
        newC?.slug || null
      );
    },
    [sameCategoryProducts, productA, productB, productC, updateUrl]
  );

  const handleDismiss = useCallback(
    (column: "A" | "B" | "C") => {
      const prevA = productA;
      const prevB = productB;
      const prevC = productC;

      let nextA: Article | null = prevA;
      let nextB: Article | null = prevB;
      let nextC: Article | null = prevC;
      let slugA: string | null = prevA?.slug ?? null;
      let slugB: string | null = prevB?.slug ?? null;
      let slugC: string | null = prevC?.slug ?? null;

      if (column === "A") {
        nextA = prevB;
        nextB = prevC;
        nextC = null;
        slugA = prevB?.slug ?? null;
        slugB = prevC?.slug ?? null;
        slugC = null;
      } else if (column === "B") {
        nextB = prevC;
        nextC = null;
        slugB = prevC?.slug ?? null;
        slugC = null;
      } else {
        nextC = null;
        slugC = null;
      }

      setProductA(nextA);
      setProductB(nextB);
      setProductC(nextC);
      updateUrl(slugA, slugB, slugC);
    },
    [productA, productB, productC, updateUrl]
  );

  const hasProductB = !!productB;
  const hasAnyProduct = !!productA;

  if (!hasAnyProduct) {
    return (
      <PickProductView
        sameCategoryProducts={sameCategoryProducts}
        category={category}
        categoryLabel={categoryLabel}
        onSelect={(slug) => handleSelect("A", slug)}
      />
    );
  }

  if (!hasProductB) {
    return (
      <ProductCompareView
        product={productA!}
        sameCategoryProducts={sameCategoryProducts}
        category={category}
        categoryLabel={categoryLabel}
        onSelect={(slug) => handleSelect("B", slug)}
        excludeSlugs={excludedSlugs}
      />
    );
  }

  return (
    <DynamicCompareView
      productA={productA!}
      productB={productB!}
      productC={productC}
      sameCategoryProducts={sameCategoryProducts}
      category={category}
      categoryLabel={categoryLabel}
      onSelect={handleSelect}
      onDismiss={handleDismiss}
      excludeSlugs={excludedSlugs}
      popularComparisons={popularComparisons}
    />
  );
}

/* ── ProductSearchDropdown ── */
function ProductSearchDropdown({
  products,
  excludeSlugs,
  onSelect,
}: {
  products: Article[];
  excludeSlugs: string[];
  onSelect: (slug: string) => void;
}) {
  const tComparison = useTranslations("comparison");
  const [search, setSearch] = useState("");
  const [show, setShow] = useState(false);

  const filtered = useMemo(() => {
    const available = products.filter((p) => !excludeSlugs.includes(p.slug));
    if (!search.trim()) return available.slice(0, 8);
    const q = search.toLowerCase();
    return available
      .filter(
        (p) =>
          p.product_name?.toLowerCase().includes(q) ||
          p.title.toLowerCase().includes(q) ||
          p.product_brand?.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [products, excludeSlugs, search]);

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setShow(true); }}
        onFocus={() => setShow(true)}
        onBlur={() => setTimeout(() => setShow(false), 200)}
        placeholder={tComparison("searchProducts")}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-indigo-500 transition-colors"
      />
      <svg className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      {show && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-60 overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-800 shadow-xl">
          {filtered.map((product) => (
            <button
              key={product.slug}
              onMouseDown={() => { onSelect(product.slug); setSearch(""); setShow(false); }}
              className="flex w-full items-center gap-2 p-2 transition-colors hover:bg-zinc-700"
            >
              <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded bg-zinc-700">
                {product.image && (
                  <Image src={product.image} alt={product.product_name || product.title} fill className="object-cover" sizes="28px" />
                )}
              </div>
              <div className="min-w-0 text-left">
                <p className="truncate text-[11px] font-semibold text-white">{product.product_name || product.title}</p>
                {product.product_price && <p className="text-[10px] text-zinc-400">{product.product_price}</p>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── DismissButton ── */
function DismissButton({ onClick }: { onClick: () => void }) {
  const tComparison = useTranslations("comparison");
  return (
    <button
      onClick={onClick}
      className="absolute -right-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-zinc-600 bg-zinc-800 text-zinc-400 opacity-0 shadow-lg transition-all hover:border-red-500 hover:bg-red-600 hover:text-white group-hover:opacity-100"
      title={tComparison("removeFromComparison")}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    </button>
  );
}

/* ── ProductCard ── */
function ProductCard({
  product,
  onDismiss,
  size = "md",
}: {
  product: Article;
  onDismiss: () => void;
  size?: "sm" | "md";
}) {
  const tComparison = useTranslations("comparison");
  const dim = size === "sm" ? "h-28 w-28 md:h-36 md:w-36" : "h-36 w-36 md:h-44 md:w-44";

  return (
    <div className="group relative flex flex-col items-center">
      <DismissButton onClick={onDismiss} />
      <div className={`relative mb-3 overflow-hidden rounded-xl border-2 border-zinc-700 bg-zinc-800 ${dim}`}>
        {product.image ? (
          <Image src={product.image} alt={product.product_name || product.title} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl text-zinc-600">A</div>
        )}
      </div>
      <h3 className="mb-1 text-center text-sm font-bold text-white md:text-base">
        {product.product_name || product.title}
      </h3>
      {product.product_price && (
        <p className="text-xs text-zinc-400">{product.product_price}</p>
      )}
      <Link
        href={`/posts/${product.slug}`}
        className="mt-2 block text-center text-[11px] font-semibold text-indigo-400 hover:text-indigo-300"
      >
        {tComparison("readReview")} →
      </Link>
    </div>
  );
}

/* ── CompareColumn — dropdown + product card, aligned ── */
function CompareColumn({
  product,
  onDismiss,
  onSelect,
  products,
  excludeSlugs,
  emptySlot,
  emptyLabel,
}: {
  product: Article | null;
  onDismiss?: () => void;
  onSelect: (slug: string) => void;
  products: Article[];
  excludeSlugs: string[];
  emptySlot?: boolean;
  emptyLabel?: string;
}) {
  const tComparison = useTranslations("comparison");

  return (
    <div className="flex flex-col items-center">
      {/* Dropdown row — fixed height, always same */}
      <div className="mb-4 h-[68px] w-full flex items-end justify-center">
        <div className="w-full max-w-[200px]">
          <ProductSearchDropdown
            products={products}
            excludeSlugs={excludeSlugs}
            onSelect={onSelect}
          />
        </div>
      </div>

      {/* Product card row — centered, fixed height container */}
      <div className="flex h-[220px] md:h-[240px] items-center justify-center">
        {product ? (
          <ProductCard product={product} onDismiss={onDismiss!} />
        ) : emptySlot ? (
          <div className="flex flex-col items-center">
            <div className="relative mb-3 flex h-28 w-28 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-zinc-600 bg-zinc-800/50 md:h-36 md:w-36">
              <div className="flex flex-col items-center text-zinc-500">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                  <path d="M12 18h.01" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span className="mt-1 text-[10px] text-zinc-500">{tComparison("addProduct")}</span>
              </div>
            </div>
            <h3 className="text-center text-xs text-zinc-500">{emptyLabel || tComparison("optionalThird")}</h3>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ── VS Badge ── */
function VsBadge({ dashed }: { dashed?: boolean }) {
  if (dashed) {
    return (
      <div className="flex items-center justify-center px-3 py-6 md:px-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-zinc-600 bg-zinc-800/50 text-sm font-black text-zinc-500 md:h-14 md:w-14 md:text-base">
          +
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center px-3 py-6 md:px-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-indigo-500 bg-indigo-600 text-sm font-black text-white shadow-lg shadow-indigo-500/30 md:h-14 md:w-14 md:text-base">
        VS
      </div>
    </div>
  );
}

/* ── DynamicCompareView — 2 or 3 products ── */
function DynamicCompareView({
  productA,
  productB,
  productC,
  sameCategoryProducts,
  category,
  categoryLabel,
  onSelect,
  onDismiss,
  excludeSlugs,
  popularComparisons = [],
}: {
  productA: Article;
  productB: Article;
  productC: Article | null;
  sameCategoryProducts: Article[];
  category: string;
  categoryLabel: string;
  onSelect: (col: "A" | "B" | "C", slug: string) => void;
  onDismiss: (col: "A" | "B" | "C") => void;
  excludeSlugs: string[];
  popularComparisons?: PopularComparison[];
}) {
  const tComparison = useTranslations("comparison");
  const hasThird = !!productC;
  const products = [productA, productB, ...(hasThird && productC ? [productC] : [])];
  const hasPrice = products.some((p) => p.product_price);

  return (
    <>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
        <Link href="/" className="hover:text-indigo-400 transition-colors">{tComparison("home")}</Link>
        <span className="opacity-50">/</span>
        <Link href={`/category/${category}`} className="hover:text-indigo-400 transition-colors">
          {categoryLabel || tComparison("category")}
        </Link>
        <span className="opacity-50">/</span>
        <span className="text-zinc-400">{tComparison("compare")}</span>
      </nav>

      {/* Title */}
      <h1 className="mb-2 text-2xl font-bold text-white md:text-3xl">
        {productA.product_name || productA.title} vs {productB.product_name || productB.title}
        {productC && <> vs {productC.product_name || productC.title}</>}
      </h1>
      <p className="mb-8 text-zinc-400">
        {tComparison("sideBySideDescription")}
      </p>

      {/* Comparison grid */}
      <section className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
        {categoryLabel && (
          <div className="border-b border-zinc-800 px-6 py-3 text-center">
            <span className="inline-block rounded-full bg-indigo-600/20 px-3 py-1 text-xs font-semibold text-indigo-400">
              {categoryLabel}
            </span>
          </div>
        )}

        <div className={`grid grid-cols-1 items-center ${hasThird ? 'md:grid-cols-[1fr_auto_1fr_auto_1fr]' : 'md:grid-cols-[1fr_auto_1fr]'}`}>
          {/* Product A */}
          <div className="border-b border-zinc-800 px-4 py-6 md:border-b-0 md:border-r md:border-zinc-800">
            <CompareColumn
              product={productA}
              onDismiss={() => onDismiss("A")}
              onSelect={(slug) => onSelect("A", slug)}
              products={sameCategoryProducts}
              excludeSlugs={excludeSlugs}
            />
          </div>

          <VsBadge />

          {/* Product B */}
          <div className={`px-4 py-6 ${hasThird ? 'border-b border-zinc-800 md:border-b-0 md:border-r md:border-zinc-800' : ''}`}>
            <CompareColumn
              product={productB}
              onDismiss={() => onDismiss("B")}
              onSelect={(slug) => onSelect("B", slug)}
              products={sameCategoryProducts}
              excludeSlugs={excludeSlugs}
            />
          </div>

          {/* Product C (optional) */}
          {hasThird && productC && (
            <>
              <VsBadge />
              <div className="px-4 py-6">
                <CompareColumn
                  product={productC}
                  onDismiss={() => onDismiss("C")}
                  onSelect={(slug) => onSelect("C", slug)}
                  products={sameCategoryProducts}
                  excludeSlugs={excludeSlugs}
                />
              </div>
            </>
          )}

          {/* Empty slot for third */}
          {!hasThird && sameCategoryProducts.length > 0 && (
            <>
              <VsBadge dashed />
              <div className="px-4 py-6">
                <CompareColumn
                  product={null}
                  onSelect={(slug) => onSelect("C", slug)}
                  products={sameCategoryProducts}
                  excludeSlugs={excludeSlugs}
                  emptySlot
                  emptyLabel={tComparison("optionalThird")}
                />
              </div>
            </>
          )}
        </div>
      </section>

      {/* Tabbed Content */}
      <Tabs defaultValue="specs" className="mt-8">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="specs">{tComparison("specifications")}</TabsTrigger>
          <TabsTrigger value="pros-cons">{tComparison("prosAndCons")}</TabsTrigger>
          {hasPrice && <TabsTrigger value="price">{tComparison("price")}</TabsTrigger>}
        </TabsList>

        <TabsContent value="specs">
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
            <h2 className="mb-4 text-lg font-bold text-white">{tComparison("quickComparison")}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-700">
                    <th className="px-4 py-3 text-left text-zinc-400 font-semibold">{tComparison("feature")}</th>
                    {products.map((p) => (
                      <th key={p.slug} className="px-4 py-3 text-center text-white font-semibold">{p.product_name || p.title}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-zinc-800">
                    <td className="px-4 py-3 text-zinc-400">{tComparison("brand")}</td>
                    {products.map((p) => (
                      <td key={p.slug} className="px-4 py-3 text-center text-white">{p.product_brand || "—"}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-zinc-800">
                    <td className="px-4 py-3 text-zinc-400">{tComparison("price")}</td>
                    {products.map((p) => (
                      <td key={p.slug} className="px-4 py-3 text-center text-white font-semibold">{p.product_price || "—"}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-zinc-800">
                    <td className="px-4 py-3 text-zinc-400">{tComparison("category")}</td>
                    {products.map((p) => (
                      <td key={p.slug} className="px-4 py-3 text-center text-white">{p.categoryLabel || p.category}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-zinc-400">{tComparison("readTime")}</td>
                    {products.map((p) => (
                      <td key={p.slug} className="px-4 py-3 text-center text-white">{p.readTime} min</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="pros-cons">
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
            <h2 className="mb-4 text-lg font-bold text-white">{tComparison("overview")}</h2>
            <div className={`grid grid-cols-1 gap-6 ${hasThird ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
              {products.map((p) => (
                <div key={p.slug}>
                  <h3 className="mb-2 text-sm font-semibold text-indigo-400">{p.product_name || p.title}</h3>
                  <p className="text-sm leading-relaxed text-zinc-300">{p.excerpt || tComparison("noDescriptionAvailable")}</p>
                </div>
              ))}
            </div>
          </section>
          <section className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
            <h2 className="mb-4 text-lg font-bold text-white">{tComparison("keyTakeaways")}</h2>
            <div className={`grid grid-cols-1 gap-6 ${hasThird ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
              {products.map((p) => (
                <div key={p.slug}>
                  <h3 className="mb-2 text-sm font-semibold text-indigo-400">{p.product_name || p.title}</h3>
                  {p.keyTakeawaysContent ? (
                    <div className="text-sm leading-relaxed text-zinc-300 prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: p.keyTakeawaysContent }} />
                  ) : (
                    <p className="text-sm text-zinc-500">{tComparison("noKeyTakeawaysAvailable")}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
          <section className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
            <h2 className="mb-4 text-lg font-bold text-white">{tComparison("finalThoughts")}</h2>
            <div className={`grid grid-cols-1 gap-6 ${hasThird ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
              {products.map((p) => (
                <div key={p.slug}>
                  <h3 className="mb-2 text-sm font-semibold text-indigo-400">{p.product_name || p.title}</h3>
                  {p.finalThoughtsContent ? (
                    <p className="text-sm leading-relaxed text-zinc-300">{p.finalThoughtsContent}</p>
                  ) : (
                    <p className="text-sm text-zinc-500">{tComparison("noFinalThoughtsAvailable")}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </TabsContent>

        {hasPrice && (
          <TabsContent value="price">
            <section className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
              <h2 className="mb-4 text-lg font-bold text-white">{tComparison("priceComparison")}</h2>
              <div className={`grid grid-cols-1 gap-4 ${hasThird ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                {products.map((p) => (
                  <div key={p.slug} className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4 text-center">
                    <p className="mb-1 text-sm font-semibold text-zinc-400">{p.product_name || p.title}</p>
                    <p className="text-xl font-bold text-white">{p.product_price || "—"}</p>
                  </div>
                ))}
              </div>
            </section>
          </TabsContent>
        )}
      </Tabs>

      {/* Tags */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        {productA.tags?.map((tag) => (
          <Link key={tag} href={`/tag/${tag}`} className="px-3 py-1 rounded-lg bg-zinc-800 text-xs font-medium text-zinc-400 hover:bg-zinc-700 transition-colors">
            {tag}
          </Link>
        ))}
      </div>

      {/* CTA */}
      <div className={`mt-8 grid grid-cols-1 gap-4 ${hasThird ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        {products.map((p) => (
          <Link key={p.slug} href={`/posts/${p.slug}`} className="flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/50 px-6 py-4 text-sm font-bold text-white transition-all hover:border-indigo-500 hover:bg-zinc-800">
            {tComparison("readReview")} — {p.product_name || p.title}
          </Link>
        ))}
      </div>

      {/* Popular Comparisons */}
      {popularComparisons.length > 0 && (
        <div className="mt-12 rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
          <h2 className="mb-4 text-lg font-bold text-white">
            {tComparison("popularComparisonsIn")} {categoryLabel || tComparison("thisCategory")}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {popularComparisons.map((comp) => (
              <Link key={comp.slug} href={`/compare/${comp.slug}`} className="group rounded-lg border border-zinc-700 bg-zinc-800/50 p-4 transition-all hover:border-indigo-500 hover:bg-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-zinc-700">
                    {comp.entity_A?.image && <Image src={comp.entity_A.image} alt={comp.entity_A.name} fill className="object-cover" sizes="48px" />}
                  </div>
                  <div className="text-center text-xs font-bold text-indigo-400">VS</div>
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-zinc-700">
                    {comp.entity_B?.image && <Image src={comp.entity_B.image} alt={comp.entity_B.name} fill className="object-cover" sizes="48px" />}
                  </div>
                </div>
                <p className="mt-3 text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors line-clamp-2">{comp.title}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/* ── ProductCompareView — single product + search ── */
function ProductCompareView({
  product,
  sameCategoryProducts,
  category,
  categoryLabel,
  onSelect,
  excludeSlugs,
}: {
  product: Article;
  sameCategoryProducts: Article[];
  category: string;
  categoryLabel: string;
  onSelect: (slug: string) => void;
  excludeSlugs: string[];
}) {
  const tComparison = useTranslations("comparison");
  return (
    <>
      <nav className="mb-6 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
        <Link href="/" className="hover:text-indigo-400 transition-colors">{tComparison("home")}</Link>
        <span className="opacity-50">/</span>
        <Link href={`/category/${category}`} className="hover:text-indigo-400 transition-colors">{categoryLabel || tComparison("category")}</Link>
        <span className="opacity-50">/</span>
        <span className="text-zinc-400">{tComparison("compare")}</span>
      </nav>

      <h1 className="mb-2 text-2xl font-bold text-white md:text-3xl">{tComparison("compare")} {product.product_name || product.title}</h1>
      <p className="mb-8 text-zinc-400">{tComparison("selectProductBelow")}</p>

      <section className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
        {categoryLabel && (
          <div className="border-b border-zinc-800 px-6 py-3 text-center">
            <span className="inline-block rounded-full bg-indigo-600/20 px-3 py-1 text-xs font-semibold text-indigo-400">{categoryLabel}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-start">
          {/* Product A */}
          <div className="border-b border-zinc-800 px-6 py-6 md:border-b-0 md:border-r md:border-zinc-800">
            <div className="flex flex-col items-center">
              <div className="mb-4 h-[68px] w-full flex items-end justify-center" />
              <div className="flex h-[220px] md:h-[240px] items-center justify-center">
                <div className="relative mb-3 flex h-36 w-36 items-center justify-center overflow-hidden rounded-xl border-2 border-zinc-700 bg-zinc-800 md:h-44 md:w-44">
                  {product.image ? (
                    <Image src={product.image} alt={product.product_name || product.title} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl text-zinc-600">A</div>
                  )}
                </div>
              </div>
              <h3 className="mb-1 text-center text-lg font-bold text-white md:text-xl">{product.product_name || product.title}</h3>
              {product.product_price && <p className="text-sm text-zinc-400">{product.product_price}</p>}
            </div>
          </div>

          {/* VS */}
          <div className="flex items-center justify-center px-4 py-6 md:px-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-indigo-500 bg-indigo-600 text-lg font-black text-white shadow-lg shadow-indigo-500/30 md:h-16 md:w-16 md:text-xl">VS</div>
          </div>

          {/* Product B — empty with search */}
          <div className="px-6 py-6">
            <CompareColumn
              product={null}
              onSelect={onSelect}
              products={sameCategoryProducts}
              excludeSlugs={excludeSlugs}
              emptySlot
              emptyLabel={tComparison("selectProduct")}
            />
          </div>
        </div>
      </section>

      <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 text-center">
        <h2 className="mb-2 text-lg font-bold text-white">{tComparison("howItWorks")}</h2>
        <p className="text-sm text-zinc-400">{tComparison("howItWorksDescription")}</p>
      </div>

      <div className="mt-6 text-center">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          {tComparison("browseComparisons")}
        </Link>
      </div>
    </>
  );
}

/* ── PickProductView ── */
function PickProductView({
  sameCategoryProducts,
  category,
  categoryLabel,
  onSelect,
}: {
  sameCategoryProducts: Article[];
  category: string;
  categoryLabel: string;
  onSelect: (slug: string) => void;
}) {
  const tComparison = useTranslations("comparison");
  return (
    <>
      <nav className="mb-6 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
        <Link href="/" className="hover:text-indigo-400 transition-colors">{tComparison("home")}</Link>
        <span className="opacity-50">/</span>
        {category && (
          <>
            <Link href={`/category/${category}`} className="hover:text-indigo-400 transition-colors">{categoryLabel || tComparison("category")}</Link>
            <span className="opacity-50">/</span>
          </>
        )}
        <span className="text-zinc-400">{tComparison("compare")}</span>
      </nav>

      <h1 className="mb-2 text-2xl font-bold text-white md:text-3xl">{tComparison("compareProducts")}</h1>
      <p className="mb-8 text-zinc-400">{tComparison("pickProductStart")}</p>

      <section className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
        {categoryLabel && (
          <div className="border-b border-zinc-800 px-6 py-3 text-center">
            <span className="inline-block rounded-full bg-indigo-600/20 px-3 py-1 text-xs font-semibold text-indigo-400">{categoryLabel}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-start">
          {/* Empty slot A */}
          <div className="border-b border-zinc-800 px-6 py-6 md:border-b-0 md:border-r md:border-zinc-800">
            <CompareColumn
              product={null}
              onSelect={onSelect}
              products={sameCategoryProducts}
              excludeSlugs={[]}
              emptySlot
              emptyLabel={tComparison("selectProductAbove")}
            />
          </div>

          {/* VS dashed */}
          <div className="flex items-center justify-center px-4 py-6 md:px-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-zinc-600 bg-zinc-800/50 text-lg font-black text-zinc-500 md:h-16 md:w-16 md:text-xl">VS</div>
          </div>

          {/* Empty slot B */}
          <div className="px-6 py-6">
            <div className="flex flex-col items-center">
              <div className="mb-4 h-[68px] w-full flex items-end justify-center" />
              <div className="flex h-[220px] md:h-[240px] items-center justify-center">
                <div className="relative mb-4 flex h-36 w-36 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-zinc-600 bg-zinc-800/50 md:h-44 md:w-44">
                  <div className="flex flex-col items-center text-zinc-500">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-2">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                      <path d="M12 18h.01" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <span className="text-[11px] text-zinc-500">{tComparison("secondProduct")}</span>
                  </div>
                </div>
              </div>
              <h3 className="text-center text-sm text-zinc-500">{tComparison("selectFirstThenThis")}</h3>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 text-center">
        <h2 className="mb-2 text-lg font-bold text-white">{tComparison("howItWorks")}</h2>
        <p className="text-sm text-zinc-400">{tComparison("pickProductStart")}</p>
      </div>

      <div className="mt-6 text-center">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          {tComparison("browseComparisons")}
        </Link>
      </div>
    </>
  );
}
