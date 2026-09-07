"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { 
  X, 
  Info, 
  MoreVertical,
  AlertOctagon, 
  Ban, 
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/hooks/useTranslations";

type ViewState = "closed" | "menu" | "why" | "feedback" | "other" | "success";

interface AdActionsPopoverProps {
  onSubmit: (reason: string, customText?: string) => void;
  onOpenChange?: (isOpen: boolean) => void;
  adLabel?: string;
  side?: "top" | "bottom";
}

export default function AdActionsPopover({
  onSubmit,
  onOpenChange,
  adLabel = "this ad",
  side = "bottom",
}: AdActionsPopoverProps) {
  const [view, setView] = useState<ViewState>("closed");
  const [customText, setCustomText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const tAdActions = useTranslations("adActions");

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setView("closed");
      }
    }
    if (view !== "closed") {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [view]);

  useEffect(() => {
    onOpenChange?.(view !== "closed");
  }, [view, onOpenChange]);

  const handleAction = async (action: string, text?: string) => {
    setIsSubmitting(true);
    try {
      await onSubmit(action, text);
      setView("success");
      setTimeout(() => {
        setView("closed");
        setIsSubmitting(false);
        setCustomText("");
      }, 2000);
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    switch (view) {
      case "menu":
        return (
          <div className="flex flex-col py-1">
            <button 
              onClick={(e) => { e.stopPropagation(); setView("why"); }}
              className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-700 dark:text-gray-200">{tAdActions("whyThisAd")}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setView("feedback"); }}
              className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Ban className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-200">{tAdActions("stopSeeing")}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            </button>
            <div className="h-px bg-gray-100 dark:bg-gray-800 my-1" />
            <button 
              onClick={(e) => { e.stopPropagation(); handleAction("reported_ad"); }}
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
              disabled={isSubmitting}
            >
              <AlertOctagon className="w-4 h-4 text-red-500" />
              <span className="text-sm text-gray-700 dark:text-gray-200">{tAdActions("reportAd")}</span>
            </button>
          </div>
        );

      case "why":
        return (
          <div className="p-3">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100 dark:border-gray-800">
              <button 
                onClick={(e) => { e.stopPropagation(); setView("menu"); }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{tAdActions("aboutThisAd")}</span>
            </div>
            <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <p>{tAdActions("aboutDescription")}</p>
              <p>{tAdActions("aboutFeedback")}</p>
            </div>
          </div>
        );

      case "feedback":
        return (
          <div className="p-2">
            <div className="flex items-center gap-2 mb-1 pb-1">
              <button 
                onClick={(e) => { e.stopPropagation(); setView("menu"); }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{tAdActions("whatWasWrong")}</span>
            </div>
            <div className="flex flex-col">
              {[
                { id: "not_relevant", label: tAdActions("notRelevant") },
                { id: "covered_content", label: tAdActions("coveredContent") },
                { id: "seen_multiple", label: tAdActions("seenMultiple") },
                { id: "inappropriate", label: tAdActions("inappropriate") },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={(e) => { e.stopPropagation(); handleAction(option.id); }}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left text-xs text-gray-700 dark:text-gray-300 rounded"
                >
                  {option.label}
                </button>
              ))}
              <div className="h-px bg-gray-100 dark:bg-gray-800 my-1 mx-2" />
              <button
                onClick={(e) => { e.stopPropagation(); setView("other"); }}
                disabled={isSubmitting}
                className="flex items-center justify-between px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left rounded"
              >
                <span className="text-xs text-gray-700 dark:text-gray-300">{tAdActions("otherReason")}</span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>
          </div>
        );

      case "other":
        return (
          <div className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <button 
                onClick={(e) => { e.stopPropagation(); setView("feedback"); }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{tAdActions("moreDetails")}</span>
            </div>
            <div className="space-y-3">
              <Textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder={tAdActions("describeIssue")}
                className="min-h-[60px] text-xs resize-none p-2"
                maxLength={200}
                autoFocus
              />
              <Button 
                onClick={(e) => { e.stopPropagation(); handleAction("other", customText); }} 
                disabled={isSubmitting || !customText.trim()} 
                className="w-full h-7 text-xs"
                size="sm"
              >
                {isSubmitting ? tAdActions("submitting") : tAdActions("submit")}
              </Button>
            </div>
          </div>
        );

      case "success":
        return (
          <div className="p-4 flex flex-col items-center justify-center space-y-2 text-center">
            <CheckCircle2 className="w-6 h-6 text-green-500" />
            <p className="text-xs font-medium text-gray-900 dark:text-gray-100">{tAdActions("thanksFeedback")}</p>
            <p className="text-[10px] text-gray-500 leading-tight">
              {tAdActions("wontShowAgain")}
            </p>
          </div>
        );
    }
    return null;
  };

  return (
    <div className="absolute top-1 end-1 z-[999999] flex items-start gap-1">
      {/* Trigger Buttons */}
      <div className="flex items-center bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded shadow-sm border border-gray-200 dark:border-gray-700/50">
        <button
          onClick={(e) => { e.stopPropagation(); setView(view === "closed" ? "menu" : "closed"); }}
          className="p-1 px-1.5 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          title={tAdActions("adOptions")}
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Popover Panel */}
      {view !== "closed" && (
        <div 
          ref={menuRef}
          className={cn(
            "absolute end-0 w-[220px] bg-white dark:bg-gray-900 rounded-md shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden text-left z-[999999]",
            side === "top" ? "bottom-8" : "top-8"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {renderContent()}
        </div>
      )}
    </div>
  );
}
