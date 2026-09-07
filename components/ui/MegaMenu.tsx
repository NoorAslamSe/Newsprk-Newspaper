import Link from "next/link";
import type { Article, Category } from "@/types";
import ArticleCard from "@/components/ui/ArticleCard";

interface Props {
    title: string;
    categorySlug: string;
    articles: Article[];
    categories: Category[];
}

export default function MegaMenu({ title, categorySlug, articles, categories }: Props) {
    const categoryArticles = articles.filter(a => a.category === categorySlug).slice(0, 5);

    if (categoryArticles.length === 0) return null;

    return (
        <div className="mega-dropdown absolute left-0 right-0 top-full pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
            <div
                className="bg-[var(--nav-bg)] shadow-[var(--shadow-md)] border-t border-[var(--g-color)] p-6"
                style={{ borderRadius: "0 0 var(--round-7) var(--round-7)" }}
            >
                <div className="rb-container">
                    <div className="flex items-center gap-3 mb-5 border-b border-[var(--flex-gray-15)] pb-3">
                        <h3 className="font-bold text-lg">
                            {title}
                        </h3>
                        <Link
                            href={`/category/${categorySlug}`}
                            className="text-[var(--meta-fcolor)] text-sm hover:text-[var(--g-color)] transition-colors"
                        >
                            View all →
                        </Link>
                    </div>

                    <div className="grid grid-cols-5 gap-5">
                        {categoryArticles.map((a) => (
                            <ArticleCard
                                key={a.slug}
                                article={a}
                                variant="grid"
                                categories={categories}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
