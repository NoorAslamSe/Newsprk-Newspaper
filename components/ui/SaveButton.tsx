"use client";

import { useBookmarkStore } from "@/hooks/useBookmarkStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/hooks/useTranslations";

interface SaveButtonProps {
    articleId: string;
}

export function SaveButton({ articleId }: SaveButtonProps) {
    const tArticle = useTranslations("article");
    const { toggle, isBookmarked } = useBookmarkStore();
    const saved = isBookmarked(articleId);

    const handleToggle = () => {
        toggle(articleId);
        if (saved) {
            toast(tArticle("removedFromBookmarks"));
        } else {
            toast.success(tArticle("savedToBookmarks"));
        }
    };

    return (
        <button 
            onClick={handleToggle}
            className={cn(
                "flex items-center gap-1.5 text-[13px] font-bold hover:text-[var(--g-color)] transition-colors",
                saved ? "text-[var(--g-color)]" : "text-[var(--heading-color)]"
            )}
        >
            <i className={saved ? "ruby-icon-bookmark-filled text-base" : "ruby-icon-bookmark text-base"}></i>
            {saved ? tArticle("saved") : tArticle("saveIt")}
        </button>
    );
}
