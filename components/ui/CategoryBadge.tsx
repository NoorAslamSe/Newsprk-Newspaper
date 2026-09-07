import Link from "next/link";
import type { Article, Category } from "@/types";
import categoryData from "@/data/categories.json";

interface Props {
    // New API: pass whole article
    article?: Article;
    // Legacy API: pass slugs directly
    category?: string;
    label?: string;
    categories?: Category[];
    className?: string;
}

export default function CategoryBadge({
    article,
    category: categoryProp,
    label: labelProp,
    categories = [],
    className = "",
}: Props) {
    const slug = article?.category ?? categoryProp ?? "news";
    const label = article?.categoryLabel ?? labelProp ?? slug;

    // Use direct static JSON to ensure colors load consistently without relying on props mapping
    const cat = categoryData.find((c) => c.slug === slug) || categories?.find((c) => c.slug === slug);
    const color = cat?.color ?? "#ef4444";

    return (
        <Link
            href={`/category/${slug}`}
            className={`p-category ${className}`}
            style={{ "--badge-color": color } as React.CSSProperties}
        >
            {label}
        </Link>
    );
}
