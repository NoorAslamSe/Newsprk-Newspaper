"use client";

import { toast } from "sonner";
import { useTranslations } from "@/hooks/useTranslations";

interface ShareButtonProps {
    title: string;
    text: string;
    url: string;
}

export function ShareButton({ title, text, url }: ShareButtonProps) {
    const tArticle = useTranslations("article");
    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title,
                    text,
                    url,
                });
            } else {
                await navigator.clipboard.writeText(url);
                toast.success(tArticle("linkCopied"));
            }
        } catch (error: any) {
            if (error.name !== "AbortError") {
                console.error("Share failed", error);
                // Fallback attempt
                navigator.clipboard.writeText(url).then(() => {
                    toast.success(tArticle("linkCopied"));
                });
            }
        }
    };

    return (
        <button 
            onClick={handleShare}
            className="flex items-center gap-1.5 text-[13px] font-bold text-[var(--heading-color)] hover:text-[var(--g-color)] cursor-pointer transition-colors"
        >
            <i className="ruby-icon-share text-base"></i> {tArticle("share")}
        </button>
    );
}
