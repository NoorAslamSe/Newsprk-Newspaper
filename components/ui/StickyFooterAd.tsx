'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
// import { X } from 'lucide-react';
import { PageType, AdPosition } from '@/lib/models/AdSnippet';
import { cn } from '@/lib/utils';

interface StickyFooterAdProps {
  pageType?: PageType;
  delaySeconds?: number;
  showOnAllPages?: boolean;
  zIndex?: number;
  closeButton?: boolean;
  onClose?: () => void;
  className?: string;
  adOverrideId?: string;
  articleSlug?: string;
}

interface ViewportDimensions {
  width: number;
  height: number;
}

interface Position {
  bottom: number;
  left: number;
  right: number;
}

type Ad = {
  _id: string;
  name: string;
  label: string;
  pageType: PageType;
  position: AdPosition;
  enabled: boolean;
  code: string;
  type?: string;
  mediaUrl?: string;
  vastTagUrl?: string;
  vastUrl?: string;
  clickThroughUrl?: string;
  url?: string;
};

import AdSlot from './AdSlot';

export function StickyFooterAd({
  pageType = 'website',
  delaySeconds = 3,
  showOnAllPages = true,
  zIndex = 1000,
  closeButton = true,
  onClose,
  className,
  adOverrideId,
  articleSlug,
}: StickyFooterAdProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [affiliateBarActive, setAffiliateBarActive] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delaySeconds * 1000);
    return () => clearTimeout(timer);
  }, [delaySeconds]);

  // D5c: Suppress anchor ad when affiliate sticky bar is active
  useEffect(() => {
    const checkAffiliateBar = () => {
      const bar = document.querySelector('.fixed.inset-x-0.bottom-0.z-50');
      setAffiliateBarActive(!!bar);
    };
    const observer = new MutationObserver(checkAffiliateBar);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setIsClosed(true);
    onClose?.();
  };

  if (!isMounted || isClosed) return null;

  // D5c: Suppress anchor ad when affiliate sticky bar is active
  if (affiliateBarActive) return null;

  return (
      <div
      className={cn(
        'pointer-events-none fixed bottom-0 left-0 w-full flex justify-center p-2 transition-all duration-500 ease-in-out',
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0',
        className
      )}
      style={{ zIndex }}
    >
      <div className="pointer-events-auto relative group">
        <button
          onClick={handleClose}
          className="absolute -top-3 -right-3 z-[60] bg-white dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white p-1 rounded-full shadow-md border border-zinc-200 dark:border-zinc-700 transition-all opacity-0 group-hover:opacity-100"
          aria-label="Close"
        >
          {/* <X className="w-3.5 h-3.5" /> */}
        </button>
        <AdSlot
          pageType={adOverrideId ? undefined : pageType}
          position="sticky-footer"
          adOverrideId={adOverrideId}
          articleSlug={articleSlug}
          width="728px"
          height="90px"
          mobileWidth="320px"
          mobileHeight="50px"
          responsive
        />
      </div>
    </div>
  );
}

// Hook for managing sticky footer ad state
export function useStickyFooterAd() {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosed, setIsClosed] = useState(false);

  const show = () => setIsVisible(true);
  const hide = () => setIsVisible(false);
  const close = () => {
    setIsVisible(false);
    setIsClosed(true);
  };
  const reset = () => {
    setIsVisible(false);
    setIsClosed(false);
  };

  return {
    isVisible,
    isClosed,
    show,
    hide,
    close,
    reset,
  };
}

// Default export for backward compatibility
export default StickyFooterAd;