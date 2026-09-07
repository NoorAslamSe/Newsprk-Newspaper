"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { 
  X, 
  Info, 
  AlertOctagon, 
  Ban, 
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  MessageSquare,
  CheckCircle2
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// Hook to check for screen size
function useMediaQuery(query: string) {
  const [value, setValue] = useState(false);
  useEffect(() => {
    function onChange(event: MediaQueryListEvent) {
      setValue(event.matches);
    }
    const result = window.matchMedia(query);
    setValue(result.matches);
    result.addEventListener("change", onChange);
    return () => result.removeEventListener("change", onChange);
  }, [query]);
  return value;
}

type ViewState = "menu" | "why" | "feedback" | "other" | "success";

interface AdCloseReasonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reason: string, customText?: string) => void;
  adLabel?: string;
}

export default function AdCloseReasonModal({
  open,
  onOpenChange,
  onSubmit,
  adLabel = "this ad",
}: AdCloseReasonModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [view, setView] = useState<ViewState>("menu");
  const [customText, setCustomText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset view when modal opens/closes
  useEffect(() => {
    if (open) {
      setView("menu");
      setCustomText("");
      setIsSubmitting(false);
    }
  }, [open]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleAction = async (action: string, text?: string) => {
    setIsSubmitting(true);
    try {
      await onSubmit(action, text);
      setView("success");
      setTimeout(() => {
        handleClose();
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
          <div className="flex flex-col space-y-1 mt-2">
            <button 
              onClick={() => setView("why")}
              className="flex items-center justify-between w-full p-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left border-b border-gray-100 dark:border-gray-800 last:border-0 rounded-t-md"
            >
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Why this ad?</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
            <button 
              onClick={() => setView("feedback")}
              className="flex items-center justify-between w-full p-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left border-b border-gray-100 dark:border-gray-800 last:border-0"
            >
              <div className="flex items-center gap-3">
                <Ban className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Stop seeing this ad</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
            <button 
              onClick={() => handleAction("reported_ad")}
              className="flex items-center justify-between w-full p-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left rounded-b-md"
              disabled={isSubmitting}
            >
              <div className="flex items-center gap-3">
                <AlertOctagon className="w-5 h-5 text-red-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Report ad</span>
              </div>
            </button>
          </div>
        );

      case "why":
        return (
          <div className="mt-4 px-4 pb-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="mb-6 space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <p>
                This ad is served to you based on your browsing activity and general location. 
              </p>
              <p>
                Your feedback helps us show you more relevant and useful ads. We use these insights to improve your overall experience.
              </p>
            </div>
            <Button onClick={() => setView("menu")} variant="outline" className="w-full">
              Back to options
            </Button>
          </div>
        );

      case "feedback":
        return (
          <div className="flex flex-col space-y-1 mt-2 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="px-4 pb-2 text-sm text-gray-500 font-medium">What was wrong with this ad?</div>
            {[
              { id: "not_relevant", label: "Not relevant to me" },
              { id: "covered_content", label: "Ad covered content" },
              { id: "seen_multiple", label: "Seen this ad multiple times" },
              { id: "inappropriate", label: "Ad was inappropriate" },
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => handleAction(option.id)}
                disabled={isSubmitting}
                className="flex items-center w-full p-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left border-b border-gray-100 dark:border-gray-800 last:border-0"
              >
                <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
              </button>
            ))}
            <button
              onClick={() => setView("other")}
              disabled={isSubmitting}
              className="flex items-center justify-between w-full p-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
            >
              <span className="text-sm text-gray-700 dark:text-gray-300">Other reason...</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        );

      case "other":
        return (
          <div className="p-4 space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <label htmlFor="custom-reason" className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-gray-500" />
                Please describe the issue
              </label>
              <Textarea
                id="custom-reason"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Tell us what was wrong with this ad..."
                className="min-h-[100px] text-sm resize-none"
                maxLength={200}
                autoFocus
              />
              <div className="text-xs text-right text-gray-500">
                {customText.length}/200
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setView("feedback")} variant="outline" className="flex-1">
                Back
              </Button>
              <Button 
                onClick={() => handleAction("other", customText)} 
                disabled={isSubmitting || !customText.trim()} 
                className="flex-[2]"
              >
                {isSubmitting ? "Submitting..." : "Submit Feedback"}
              </Button>
            </div>
          </div>
        );

      case "success":
        return (
          <div className="p-8 flex flex-col items-center justify-center space-y-4 animate-in zoom-in-95 duration-300">
            <CheckCircle2 className="w-12 h-12 text-green-500 mb-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center">Thanks for the feedback!</h3>
            <p className="text-sm text-gray-500 text-center max-w-[250px]">
              We'll try not to show you this ad again and will use your feedback to improve ad relevance.
            </p>
          </div>
        );
    }
  };

  const currentTitle = () => {
    switch (view) {
      case "menu": return "Ad Controls";
      case "why": return "About this ad";
      case "feedback": return "Provide Feedback";
      case "other": return "More Details";
      case "success": return "Success";
      default: return "";
    }
  };

  if (isDesktop === null) return null;

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={view === "success" ? undefined : onOpenChange}>
        <DialogContent className="max-w-[400px] p-0 overflow-hidden shadow-xl sm:rounded-xl">
          <DialogHeader className="px-4 py-4 border-b border-gray-100 dark:border-gray-800 m-0 bg-gray-50/50 dark:bg-gray-900/50 relative">
            {view !== "menu" && view !== "success" && (
              <button 
                onClick={() => setView(view === "other" ? "feedback" : "menu")}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            )}
            <DialogTitle className="text-base font-semibold text-center text-gray-800 dark:text-gray-200 m-0">
              {currentTitle()}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Manage ad preferences and close reasons
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[80vh] overflow-y-auto">
            {renderContent()}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={view === "success" ? undefined : onOpenChange}>
      <DrawerContent className="max-h-[85vh] outline-none">
        <DrawerHeader className="border-b border-gray-100 dark:border-gray-800 relative py-4">
          {view !== "menu" && view !== "success" && (
            <button 
              onClick={() => setView(view === "other" ? "feedback" : "menu")}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          )}
          <DrawerTitle className="text-center font-semibold text-gray-900 dark:text-gray-100">
            {currentTitle()}
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            Manage ad preferences and close reasons
          </DrawerDescription>
          {view !== "success" && (
            <button 
              onClick={handleClose}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          )}
        </DrawerHeader>
        <div className="overflow-y-auto pb-6 outline-none">
          {renderContent()}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

