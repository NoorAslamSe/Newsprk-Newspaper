"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ListenButton } from "@/components/ui/ListenButton";
import { useTranslations } from "@/hooks/useTranslations";

interface SummarizeDialogProps {
    articleContent: string;
}

export function SummarizeDialog({ articleContent }: SummarizeDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [summary, setSummary] = useState<string | null>(null);
    const tNewsletter = useTranslations("newsletter");

    const handleSummarize = async () => {
        if (summary) return; // Already summarized
        
        setIsLoading(true);
        try {
            const res = await fetch("/api/summarize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: articleContent }),
            });

            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.error || "Failed to summarize");
            }
            
            setSummary(data.summary);
        } catch (error: any) {
            console.error(error);
                toast.error(error.message || tNewsletter("summaryFailedTryAgain"));
            setOpen(false);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (isOpen && !summary) {
                handleSummarize();
            }
        }}>
            <DialogTrigger asChild>
                <button className="flex items-center gap-1.5 text-[13px] font-bold text-[var(--heading-color)] hover:text-[var(--g-color)] transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg> {tNewsletter("summarizeIt")}
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-background border-[var(--flex-gray-15)]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-foreground">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--g-color)]"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg> {tNewsletter("summaryTitle")}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        {tNewsletter("summaryDescription")}
                    </DialogDescription>
                </DialogHeader>
                
                <div className="py-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-6 gap-4 text-muted-foreground">
                            <i className="ruby-icon-spinner animate-spin text-2xl" />
                            <p className="text-sm">{tNewsletter("generatingSummary")}</p>
                        </div>
                    ) : summary ? (
                        <div className="space-y-4">
                            <p className="text-sm leading-relaxed text-foreground border-l-[3px] border-[var(--g-color)] pl-4 italic bg-muted p-4 rounded-r-md">
                                {summary}
                            </p>
                            <div className="flex justify-end items-center gap-2 pt-2 text-foreground">
                                <span className="text-xs font-medium">{tNewsletter("readAloud")}</span>
                                {/* We pass the explicit text override so it doesn't read the global store content */}
                                <ListenButton className="border border-[var(--flex-gray-15)] rounded-full px-2" text={summary} />
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-4 text-sm text-red-500">
                            {tNewsletter("summaryFailedTryAgain")}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
