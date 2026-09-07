"use client";

import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState, useMemo, useCallback, useId } from "react";
import { PageType, AdPosition } from "@/lib/models/AdSnippet";
import { POSITION_SIZE_CONFIG } from "@/lib/constants/adSizes";
import { buildVisitorData, buildSspRequestUrl } from "@/lib/ads/buildVastUrl";
import type { VisitorData } from "@/lib/ads/buildVastUrl";
import AdActionsPopover from "./AdActionsPopover";

// ── HMR generation counter ──────────────────────────────────────────
// Re-evaluated every time Fast Refresh re-executes this module.
// Components compare this against a ref to detect HMR updates.
let _adSlotGen = Date.now();
// No logs here

interface Props {
    pageType?: PageType;
    position?: AdPosition;
    label?: string;
    width?: string;
    height?: string;
    className?: string;
    responsive?: boolean;
    mobileWidth?: string;
    mobileHeight?: string;
    fullWidth?: boolean;
    adOverrideId?: string;
    articleSlug?: string;
}

interface AppearanceSettings {
    borderStyle: "none" | "solid" | "dashed" | "dotted";
    borderWidth: number;
    borderColor: string;
    backgroundColor: string;
    borderRadius: number;
    boxShadow: string;
    showLabel: boolean;
    labelText: string;
    showInfoIcon: boolean;
    showCloseButton: boolean;
    closeButtonPosition: "top-right" | "top-left" | "bottom-right" | "bottom-left";
    // Advanced Styling
    objectFit: "cover" | "contain" | "fill" | "none";
    mediaScale: number;
    containerScale: number;
    padding: { top: number; right: number; bottom: number; left: number };
    margin: { top: number; right: number; bottom: number; left: number };
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
    templateType?: string;
    vastTagUrl?: string;
    vastUrl?: string;
    mediaUrl?: string;
    url?: string;
    appearance?: AppearanceSettings;
};

const DEFAULT_APPEARANCE: AppearanceSettings = {
    borderStyle: "none",
    borderWidth: 0,
    borderColor: "#e5e5e5",
    backgroundColor: "transparent",
    borderRadius: 8,
    boxShadow: "none",
    showLabel: true,
    labelText: "Advertisement",
    showInfoIcon: true,
    showCloseButton: true,
    closeButtonPosition: "top-right",
    objectFit: "cover",
    mediaScale: 1,
    containerScale: 1,
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
};

// Provider detection patterns
const AD_PROVIDERS = {
    GOOGLE_ADSENSE: {
        patterns: [
            /adsbygoogle/i,
            /pagead2\.googlesyndication\.com/i,
            /data-ad-client/i,
        ],
        name: "Google AdSense",
    },
    GOOGLE_AD_MANAGER: {
        patterns: [
            /googletag/i,
            /doubleclick\.net/i,
            /gpt\.js/i,
            /defineSlot/i,
        ],
        name: "Google Ad Manager (DFP)",
    },
    MEDIA_NET: {
        patterns: [
            /media\.net/i,
            /contextual\.media\.net/i,
        ],
        name: "Media.net",
    },
    EZOIC: {
        patterns: [
            /ezoic/i,
            /ez-toc/i,
        ],
        name: "Ezoic",
    },
    MEDIAVINE: {
        patterns: [
            /mediavine/i,
            /mv-trellis/i,
        ],
        name: "Mediavine",
    },
    AMAZON: {
        patterns: [
            /amazon-adsystem/i,
            /assoc-amazon/i,
        ],
        name: "Amazon Associates",
    },
    CUSTOM: {
        patterns: [],
        name: "Custom Code",
    },
};

/**
 * Detect ad provider from code snippet
 * Returns provider info or null if it's custom/template code
 */
function detectAdProvider(code: string): { name: string; isProvider: boolean } | null {
    if (!code || code.trim() === "") return null;

    // Check each provider pattern
    for (const [key, provider] of Object.entries(AD_PROVIDERS)) {
        if (key === "CUSTOM") continue;

        const matches = provider.patterns.some(pattern => pattern.test(code));
        if (matches) {
            return {
                name: provider.name,
                isProvider: true,
            };
        }
    }

    // If no provider detected, it's custom code
    return {
        name: "Custom Code",
        isProvider: false,
    };
}

// Lazy-load the inner component with SSR disabled so ads load
// independently from the page shell via Suspense boundaries.
// Using a real dynamic() wrapper ensures the ad SDK lifecycle is
// fully isolated from the parent tree.
export default function AdSlot(props: Props) {
    const pathname = usePathname();
    const mountKey = `${pathname}-${props.position || 'default'}`;

    return <AdSlotInner key={mountKey} {...props} />;
}

function AdSlotInner({
    pageType,
    position,
    label = "-Advertisement-",
    width = "728px",
    height = "90px",
    className = "",
    responsive = false,
    mobileWidth = "320px",
    mobileHeight = "50px",
    fullWidth = false,
    adOverrideId,
    articleSlug,
}: Props) {
    const [mountId] = useState(() => Math.random().toString(36).substring(2, 9));
    const safePosition = `${position || 'default'}-${mountId}`;

    const adContainerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);
    const initializedRef = useRef(false);
    const lastGenRef = useRef(_adSlotGen);
    const [isMounted, setIsMounted] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [impressionTracked, setImpressionTracked] = useState(false);
    const [isClosed, setIsClosed] = useState(false);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [isAdPlaying, setIsAdPlaying] = useState(false);
    const [appearance, setAppearance] = useState<AppearanceSettings>(DEFAULT_APPEARANCE);
    const [containerSizing, setContainerSizing] = useState<{
        desktop: { width: number; height: number };
        tablet: { width: number; height: number };
        mobile: { width: number; height: number };
    } | null>(null);
    // HMR force-reinit key: added to init effect deps to trigger re-run
    const [hmrForceKey, setHmrForceKey] = useState(0);

    useEffect(() => {
        setIsMounted(true);
        return () => {
            setIsMounted(false);
        };
    }, []);

    // ── HMR detection: runs on EVERY render (no deps) ─────────────────
    // React Fast Refresh preserves refs/state but re-executes module code.
    // We compare the module-level _adSlotGen against our saved ref.
    // If different → HMR happened → clean up player → bump forceKey to
    // trigger the init effect to re-run.
    useEffect(() => {
        if (lastGenRef.current !== _adSlotGen) {
            lastGenRef.current = _adSlotGen;
            setHmrForceKey(prev => prev + 1);
            initializedRef.current = false;
            if (playerRef.current) {
                try {
                    playerRef.current.dispose();
                } catch (e) {}
                playerRef.current = null;
            }
            // Dispose orphaned players by ID
            if (typeof window !== 'undefined' && (window as any).videojs) {
                const vjs = (window as any).videojs;
                for (const id of [`nv-banner-video-player-${safePosition}`, `nv-video-player-${safePosition}`]) {
                    try {
                        const p = vjs.getPlayer?.(id) || vjs.players?.[id];
                        if (p && typeof p.dispose === 'function') {
                            p.dispose();
                        }
                    } catch (e) {}
                }
            }
            // Clear container DOM
            if (adContainerRef.current) {
                adContainerRef.current.innerHTML = '';
            }
            // Bump forceKey → triggers init effect re-run
            setHmrForceKey(k => k + 1);
        }
    }); // ← NO deps array = runs on every render

    // ── Unmount cleanup ──────────────────────────────────────────────
    useEffect(() => {
        return () => {
            initializedRef.current = false;
            if (playerRef.current) {
                try { playerRef.current.dispose(); } catch (e) {}
                playerRef.current = null;
            }
            if (typeof window !== 'undefined' && (window as any).videojs) {
                const vjs = (window as any).videojs;
                for (const id of [`nv-banner-video-player-${safePosition}`, `nv-video-player-${safePosition}`]) {
                    try {
                        const p = vjs.getPlayer?.(id) || vjs.players?.[id];
                        if (p && typeof p.dispose === 'function') p.dispose();
                    } catch (e) {}
                }
            }
            if (adContainerRef.current) {
                adContainerRef.current.innerHTML = '';
            }
        };
    }, [position]);

    // Fetch visitor IP for client-side VAST macro resolution
    const { data: visitorIpData } = useQuery({
        queryKey: ["visitor-ip"],
        queryFn: async () => {
            const res = await fetch("/api/visitor-ip", { cache: "no-store" });
            if (!res.ok) return { ip: "" };
            return res.json() as Promise<{ ip: string }>;
        },
        staleTime: 1000 * 60 * 10, // IP is stable for the session — 10 min cache is fine
    });
    const visitorIp = visitorIpData?.ip || "";

    const { data, isLoading } = useQuery({
        queryKey: ["ads", pageType, position, adOverrideId, articleSlug],
        queryFn: async () => {
            // Fetch by specific ID — used for per-article ad overrides.
            // This is the ONLY path for article-page ads when adOverrideId is provided.
            if (adOverrideId) {
                const res = await fetch(`/api/ads/${adOverrideId}`, { cache: "no-store" });
                if (!res.ok) throw new Error("Failed to load ad");
                const { item } = await res.json();
                return { items: item ? [item] : [] };
            }
            // Article pages with articleSlug — use resolution endpoint
            // This checks article overrides first, then falls back to global article ads
            if (pageType === "article" && articleSlug && position) {
                const res = await fetch(
                    `/api/ads/resolve?pageType=article&position=${position}&articleSlug=${articleSlug}`,
                    { cache: "no-store" }
                );
                if (!res.ok) throw new Error("Failed to resolve ad");
                const { item } = await res.json();
                return { items: item ? [item] : [] };
            }
            // Global pageType+position query — used for homepage, category, website pages.
            if (!pageType || !position) return { items: [] };
            const res = await fetch(
                `/api/ads?pageType=${pageType}&position=${position}&activeOnly=true`,
                { cache: "no-store" }
            );
            if (!res.ok) throw new Error("Failed to load ads");
            return res.json() as Promise<{ items: Ad[] }>;
        },
        // Only run when we have something to fetch:
        // - adOverrideId: fetch that specific ad by ID
        // - articleSlug + position: resolve article ad (override → global fallback)
        // - pageType + position: fetch the global ad for that page/position combo
        enabled: !!adOverrideId || (!!pageType && !!position && (!!articleSlug || pageType !== "article")),
        staleTime: 0,
        gcTime: 0,
    });

    // Strict match: the ad must belong to this exact pageType AND position.
    // This ensures an ad configured for "homepage / top-leaderboard" never
    // bleeds into an "article / top-leaderboard" slot or any other page/position.
    const ad = data?.items?.find((a: Ad) =>
        adOverrideId
            ? a._id === adOverrideId
            : a.pageType === pageType && a.position === position && a.enabled !== false
    );

    // Build the visitorData object — used for all VAST/SSP macro resolution
    // Recalculates when IP or dimensions change
    const slotWidth = containerSizing?.desktop?.width ?? (parseInt(width) || 728);
    const slotHeight = containerSizing?.desktop?.height ?? (parseInt(height) || 90);
    const visitorData: VisitorData | null = useMemo(() => {
        if (!isMounted) return null;
        return buildVisitorData(visitorIp, slotWidth, slotHeight);
    }, [isMounted, visitorIp, slotWidth, slotHeight]);

    // Helper: resolve a VAST/SSP template URL using the current visitorData
    const resolveVastUrl = (templateUrl: string): string => {
        if (!templateUrl || !visitorData) return "";
        let url = buildSspRequestUrl(templateUrl, visitorData) || "";
        // Force a unique cache-buster if not present, to prevent SPA caching issues
        if (url && !url.includes('cb=') && !url.includes('cachebuster=')) {
            const char = url.includes('?') ? '&' : '?';
            url += `${char}cb=${Date.now()}`;
        }
        return url;
    };

    // Detect if this is a provider snippet (memoized to prevent re-render loops)
    // Detect if this is a provider snippet (memoized to prevent re-render loops)
    const providerInfo = useMemo(() =>
        ad?.code ? detectAdProvider(ad.code) : null,
        [ad?.code]);
    const isProviderAd = providerInfo?.isProvider || false;



    // Load global settings via API
    const { data: globalSettings } = useQuery({
        queryKey: ["ad-settings-global"],
        queryFn: async () => {
            const res = await fetch("/api/ads/settings", { cache: "no-store" });
            if (!res.ok) return { adAppearance: null, adSlotSizing: null };
            return res.json();
        },
        staleTime: 0,
        gcTime: 0,
    });

    // Load appearance settings from global settings or ad config
    useEffect(() => {
        if (!ad) return;

        // Provider ads should not have custom appearance controls
        // They manage their own UI, tracking, and behavior
        if (isProviderAd) {
            // Provider ad detected: {providerInfo?.name}
            // Use minimal appearance for provider ads
            setAppearance({
                ...DEFAULT_APPEARANCE,
                showLabel: true, // Keep label for transparency
                showInfoIcon: false, // Provider manages their own info
                showCloseButton: false, // Provider manages their own close
            });
            return;
        }

        // First load global settings
        let globalAppearance = { ...DEFAULT_APPEARANCE };
        if (globalSettings?.adAppearance) {
            globalAppearance = {
                ...globalAppearance,
                ...globalSettings.adAppearance,
                padding: { ...globalAppearance.padding, ...(globalSettings.adAppearance.padding || {}) },
                margin: { ...globalAppearance.margin, ...(globalSettings.adAppearance.margin || {}) }
            };
        }

        // Apply to the component
        if (ad.appearance) {
            // Merging global visibility with ad appearance

            setAppearance({
                ...globalAppearance,
                ...ad.appearance,
                // Critical: Force global visibility to override local ad settings
                showLabel: globalAppearance.showLabel !== undefined ? globalAppearance.showLabel : ad.appearance.showLabel,
                labelText: globalAppearance.labelText || ad.appearance.labelText,
                showInfoIcon: globalAppearance.showInfoIcon !== undefined ? globalAppearance.showInfoIcon : ad.appearance.showInfoIcon,
                showCloseButton: globalAppearance.showCloseButton !== undefined ? globalAppearance.showCloseButton : ad.appearance.showCloseButton,
                containerScale: globalAppearance.containerScale ?? 1,
                mediaScale: globalAppearance.mediaScale ?? 1,
                objectFit: globalAppearance.objectFit ?? "cover",
                padding: { ...globalAppearance.padding, ...(ad.appearance.padding || {}) },
                margin: { ...globalAppearance.margin, ...(ad.appearance.margin || {}) }
            });
        } else {
            // Using global appearance settings
            setAppearance(globalAppearance);
        }
    }, [ad?._id, isProviderAd, position, globalSettings]);

    // Load container sizing from global settings or fallback to defaults
    useEffect(() => {
        if (position) {
            if (globalSettings?.adSlotSizing && globalSettings.adSlotSizing[position]) {
                setContainerSizing(globalSettings.adSlotSizing[position]);
            } else {
                // Fallback to POSITION_SIZE_CONFIG
                const config = POSITION_SIZE_CONFIG[position];
                if (config) {
                    setContainerSizing({
                        desktop: config.containerDesktop,
                        tablet: config.containerTablet,
                        mobile: config.containerMobile,
                    });
                }
            }
        }
    }, [position, globalSettings]);

    // Track impression when ad becomes visible
    useEffect(() => {
        if (!ad || !ad._id || impressionTracked || !adContainerRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !impressionTracked) {
                        setIsVisible(true);
                        setImpressionTracked(true);

                        // Track impression
                        fetch(`/api/ads/${ad._id}/analytics`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ event: "impression" }),
                        }).catch((err) => console.error("Failed to track impression:", err));
                    }
                });
            },
            { threshold: 0.5 } // Ad must be 50% visible
        );

        observer.observe(adContainerRef.current);

        return () => observer.disconnect();
    }, [ad, impressionTracked]);

    // Handle ad click tracking and redirection
    const handleAdClick = (e: React.MouseEvent) => {
        if (ad?._id && pageType === "homepage" && (position === "in-feed-1" || position === "in-feed-2" || position === "in-feed-x")) {
            console.log("🎯 [DEBUG] In-Feed Native Ad Clicked on Home Page", {
                slot: position,
                page: "Home Page",
                adId: ad._id,
                adType: ad.type || ad.templateType || "VAST",
                vastUrlTemplate: ad.vastTagUrl || ad.vastUrl || "N/A",
                finalVastUrl: (ad.vastTagUrl || ad.vastUrl) ? resolveVastUrl(ad.vastTagUrl || ad.vastUrl || "") : "N/A",
                visitorData,
                clickTime: new Date().toISOString(),
                location: window.location.href
            });
        }

        // If a VAST/IMA ad is currently playing, let the IMA SDK handle everything.
        // Do NOT call preventDefault/stopPropagation — IMA needs these events to
        // manage click-through, pause/resume, and its own UI.
        if (isAdPlaying) {
            // Just track the click silently
            if (ad?._id) {
                fetch(`/api/ads/${ad._id}/analytics`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ event: "click" }),
                }).catch((err) => console.error("Failed to track click:", err));
            }
            return;
        }

        if (!ad || !ad._id) return;

        // Prevent default browser behavior (e.g. triggering native video fullscreen)
        e.preventDefault();

        // Track the click
        fetch(`/api/ads/${ad._id}/analytics`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event: "click" }),
        }).catch((err) => console.error("Failed to track click:", err));



        // For non-VAST ads (images, direct videos, HTML), handle redirect manually
        // VAST ads (IMA) handle their own click-through via the XML ClickThrough tag
        if (!isVastAd) {
            const destination = ad.clickThroughUrl || ad.url;
            if (destination && destination.startsWith('http')) {
                window.open(destination, '_blank', 'noopener,noreferrer');
            }
        }
    };

    // NOTE: replaceVastPlaceholders has been replaced by resolveVastUrl() + visitorData pattern
    // See buildVisitorData() and buildSspRequestUrl() in @/lib/ads/buildVastUrl.ts

    // Determine if this is a VAST ad/Structured Template Ad
    // If the ad has a vastTagUrl or vastUrl, treat it as a VAST ad regardless of type field
    // This handles ads configured with type='html' but having a VAST URL
    const vastUrl = (ad?.vastTagUrl || ad?.vastUrl || "").trim();
    const isVideoTemplate = ad?.templateType === "vast_preroll" || ad?.templateType === "direct_video" || ad?.type === "vast" || ad?.type === "video";
    // An ad is VAST if it has a VAST URL — either via explicit video type OR just having a vastTagUrl
    const isVastAd = !!vastUrl;
    const isDirectVideo = ad?.templateType === "direct_video" && (ad?.mediaUrl || ad?.url);

    // Execute scripts / render content when ad code changes
    useEffect(() => {
        if (!ad || !ad.enabled || !adContainerRef.current || initializedRef.current) {
            return;
        }
        // If it's a VAST ad, we MUST have visitorData to resolve the URL macro placeholders
        if (isVastAd && !visitorData) {
            return;
        }
        
        initializedRef.current = true;

        const container = adContainerRef.current;
        let player: any = null;
        let isCancelled = false;

        // --- VAST Ad / Structured Template Ad / Direct Video ---
        if (isVastAd || isDirectVideo || (ad?.code && ad.code.includes("window.TrendspostsAds.push"))) {
            // Clean up any existing video.js instances BEFORE we insert new HTML to prevent HMR issues
            if (typeof window !== "undefined" && (window as any).videojs && (window as any).videojs.getPlayer) {
                try {
                    const p1 = (window as any).videojs.getPlayer(`nv-banner-video-player-${position}`);
                    if (p1) p1.dispose();
                } catch (e) {}
                try {
                    const p2 = (window as any).videojs.getPlayer(`nv-video-player-${position}`);
                    if (p2) p2.dispose();
                } catch (e) {}
            }

            container.innerHTML = "";

            // Only clean up elements belonging to THIS specific slot position
            // Do NOT remove elements from other slots — they are independent players
            const ownBanner = container.querySelector(`#nv-banner-video-player-${position}`);
            const ownVideo = container.querySelector(`#nv-video-player-${position}`);
            if (ownBanner) ownBanner.remove();
            if (ownVideo) ownVideo.remove();

            // Detect content type for banner templates: HTML/image vs video
            const isHtmlBanner = (ad?.templateType === 'direct_banner' || ad?.templateType === 'html_banner') && 
              !(ad?.mediaUrl?.match(/\.(mp4|webm|mov)$/i) || ad?.code?.includes('<video') || ad?.code?.includes('videojs') || ad?.code?.includes('video.mp4'));
            const isVideoBanner = (ad?.templateType === 'direct_banner' || ad?.templateType === 'video_banner') && !isHtmlBanner;
            // Legacy: treat 'banner' code mentions as video banner (backward compat)
            const isBanner = isVideoBanner || (ad?.code && ad.code.includes('templateType: "banner"'));
            const isDirectVideoTemplate = ad?.templateType === 'direct_video';
            // Rendering controlled player

            // Get container dimensions from containerSizing or fallback to POSITION_SIZE_CONFIG
            let maxW = 728;
            let maxH = 90;

            if (containerSizing) {
                maxW = containerSizing.desktop.width;
                maxH = containerSizing.desktop.height;
            } else if (position) {
                // Fallback to POSITION_SIZE_CONFIG
                const config = POSITION_SIZE_CONFIG[position];
                if (config) {
                    maxW = config.containerDesktop.width;
                    maxH = config.containerDesktop.height;
                }
            }

            // Container dimensions calculated

            const wrapper = document.createElement("div");
            wrapper.style.width = "100%";
            wrapper.style.maxWidth = `${maxW}px`;
            wrapper.style.height = `${maxH}px`;
            wrapper.style.overflow = "hidden";
            wrapper.style.display = "flex";
            wrapper.style.alignItems = "center";
            wrapper.style.justifyContent = "center";

            if (isHtmlBanner) {
                // HTML/Image banner — render the ad code directly (no video wrapper)
                container.innerHTML = "";
                if (ad?.code) {
                    const hasScripts = ad.code.includes("<script");
                    const needsIframe = hasScripts;
                    if (needsIframe) {
                        const iframe = document.createElement("iframe");
                        iframe.style.width = "100%";
                        iframe.style.height = "100%";
                        iframe.style.border = "none";
                        iframe.style.overflow = "hidden";
                        container.appendChild(iframe);
                        const doc = iframe.contentWindow?.document;
                        if (doc) {
                            doc.open();
                            doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;padding:0;overflow:hidden;height:100%;width:100%;}</style></head><body>${ad.code}</body></html>`);
                            doc.close();
                        }
                    } else {
                        container.innerHTML = ad.code;
                    }
                } else if (ad?.mediaUrl) {
                    // Simple image URL — render as <img>
                    const img = document.createElement("img");
                    img.src = ad.mediaUrl;
                    img.alt = "Advertisement";
                    img.style.cssText = `width:100%;height:100%;object-fit:cover;border-radius:8px;`;
                    if (ad.clickThroughUrl || ad.url) {
                        const a = document.createElement("a");
                        a.href = ad.clickThroughUrl || ad.url || "#";
                        a.target = "_blank";
                        a.rel = "noopener";
                        a.appendChild(img);
                        container.appendChild(a);
                    } else {
                        container.appendChild(img);
                    }
                }
                // Skip video player init for HTML banners
                return;
            } else if (isBanner) {
                // Video Banner template HTML with constrained dimensions
                wrapper.innerHTML = `
<div id="Trendsposts-banner-ad-${safePosition}" style="width:100%; max-width:${maxW}px; height:${maxH}px; margin:0 auto; position:relative; overflow:hidden; display:flex; align-items:center; justify-content:center;">
  <video id="nv-banner-video-player-${safePosition}" class="video-js" style="width:${maxW}px; height:${maxH}px; border-radius:8px; background:#000; display:block;" playsinline webkit-playsinline="true" muted></video>
  <div id="nv-companion-ad-${safePosition}" style="margin-top:10px; text-align:center;"></div>
</div>`;
            } else if (isDirectVideoTemplate) {
                // Direct video template with fixed dimensions
                // Note: removed native 'controls' attribute to prevent browser-native fullscreen on click
                wrapper.innerHTML = `
<div id="Trendsposts-video-ad-${safePosition}" style="width:${maxW}px; height:${maxH}px; margin:0 auto; position:relative; overflow:hidden; display:flex; align-items:center; justify-content:center; background:#000;">
  <video id="nv-video-player-${safePosition}" class="video-js vjs-big-play-centered" style="width:${maxW}px; height:${maxH}px; border-radius:8px; background:#000; display:block;" playsinline webkit-playsinline="true" muted></video>
</div>`;
            } else {
                // Regular video template HTML with fixed dimensions
                // Note: removed native 'controls' attribute to prevent browser-native fullscreen on click
                wrapper.innerHTML = `
<div id="Trendsposts-video-ad-${safePosition}" style="width:${maxW}px; height:${maxH}px; margin:0 auto; position:relative; overflow:hidden; display:flex; align-items:center; justify-content:center; background:#000;">
  <video id="nv-video-player-${safePosition}" class="video-js vjs-big-play-centered" style="width:${maxW}px; height:${maxH}px; border-radius:8px; background:#000; display:block;" playsinline webkit-playsinline="true" muted></video>
</div>`;
            }

            container.appendChild(wrapper);

            // COMPREHENSIVE STYLE OVERRIDE - Works for ALL templates and media types
            const styleOverride = document.createElement('style');
            styleOverride.textContent = `
                /* Container constraints - FIT TO AD SLOT SIZE */
                #Trendsposts-video-ad-${safePosition},
                #Trendsposts-banner-ad-${safePosition} {
                    width: ${maxW}px !important;
                    height: ${maxH}px !important;
                    max-width: ${maxW}px !important;
                    max-height: ${maxH}px !important;
                    overflow: hidden !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    background: #000 !important;
                }
                
                /* Video.js player constraints - FIT TO AD SLOT SIZE */
                #Trendsposts-video-ad-${safePosition} .video-js,
                #Trendsposts-banner-ad-${safePosition} .video-js {
                    width: ${maxW}px !important;
                    height: ${maxH}px !important;
                    max-width: ${maxW}px !important;
                    max-height: ${maxH}px !important;
                    position: relative !important;
                }
                
                /* Actual video element (vjs-tech) - COVER mode (no black bars) */
                #Trendsposts-video-ad-${safePosition} .video-js .vjs-tech,
                #Trendsposts-banner-ad-${safePosition} .video-js .vjs-tech {
                    position: absolute !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100% !important;
                    height: 100% !important;
                    display: block !important;
                    z-index: 1 !important;
                    object-fit: cover !important;
                    pointer-events: none !important; /* Block direct clicks to prevent native fullscreen */
                }

                /* Keep VideoJS controls visible and prominent - ALWAYS VISIBLE */
                #Trendsposts-video-ad-${safePosition} .vjs-control-bar,
                #Trendsposts-banner-ad-${safePosition} .vjs-control-bar {
                    display: flex !important;
                    opacity: 1 !important;
                    visibility: visible !important;
                    z-index: 10001 !important; /* Above everything including IMA */
                    position: absolute !important;
                    bottom: 0 !important;
                    left: 0 !important;
                    right: 0 !important;
                    width: 100% !important;
                    height: 2.5em !important; /* Compact height for small containers */
                    background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 50%, transparent 100%) !important;
                    pointer-events: auto !important;
                    font-size: 11px !important; /* Smaller font for compact display */
                }

                /* Ensure control buttons are clickable and compact */
                #Trendsposts-video-ad-${safePosition} .vjs-control-bar > *,
                #Trendsposts-banner-ad-${safePosition} .vjs-control-bar > * {
                    pointer-events: auto !important;
                    z-index: 10002 !important;
                    font-size: 11px !important;
                }

                /* Make control bar buttons more compact */
                #Trendsposts-video-ad-${safePosition} .vjs-control-bar .vjs-button,
                #Trendsposts-banner-ad-${safePosition} .vjs-control-bar .vjs-button {
                    width: 2.5em !important;
                    height: 2.5em !important;
                }

                /*
                 * ROOT CAUSE FIX: Block pointer-events on ALL <video> elements.
                 * This prevents the browser's native video click handler from
                 * triggering fullscreen. The video never needs direct clicks —
                 * Video.js controls and IMA overlay handle all interaction.
                 */
                #Trendsposts-video-ad-${safePosition} video,
                #Trendsposts-banner-ad-${safePosition} video {
                    pointer-events: none !important;
                }

                /*
                 * IMA Ad Container — CRITICAL FIX: Must fill FULL height
                 * This ensures VAST ads display in the entire video player area
                 */
                #Trendsposts-video-ad-${safePosition} .video-js [class*="ima-ad-container"],
                #Trendsposts-banner-ad-${safePosition} .video-js [class*="ima-ad-container"],
                #Trendsposts-video-ad-${safePosition} .video-js .ima-ad-container,
                #Trendsposts-banner-ad-${safePosition} .video-js .ima-ad-container {
                    position: absolute !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100% !important;
                    height: 100% !important;
                    max-width: 100% !important;
                    max-height: 100% !important;
                    z-index: 10000 !important;
                    pointer-events: auto !important;
                    display: block !important;
                }

                /* IMA video element inside ad container - FULL HEIGHT */
                #Trendsposts-video-ad-${safePosition} .ima-ad-container video,
                #Trendsposts-banner-ad-${safePosition} .ima-ad-container video,
                #Trendsposts-video-ad-${safePosition} [class*="ima-ad-container"] video,
                #Trendsposts-banner-ad-${safePosition} [class*="ima-ad-container"] video {
                    position: absolute !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100% !important;
                    height: 100% !important;
                    max-width: 100% !important;
                    max-height: 100% !important;
                    object-fit: cover !important;
                    pointer-events: none !important;
                }

                /* IMA controls and UI elements - FULLY VISIBLE */
                #Trendsposts-video-ad-${safePosition} [class*="ima"] [class*="controls"],
                #Trendsposts-banner-ad-${safePosition} [class*="ima"] [class*="controls"],
                #Trendsposts-video-ad-${safePosition} [class*="ima"] [class*="ui"],
                #Trendsposts-banner-ad-${safePosition} [class*="ima"] [class*="ui"] {
                    pointer-events: auto !important;
                    z-index: 10001 !important;
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                }
                
                /* IMA skip button - prominent and visible */
                #Trendsposts-video-ad-${safePosition} [class*="ima"] [class*="skip"],
                #Trendsposts-banner-ad-${safePosition} [class*="ima"] [class*="skip"],
                #Trendsposts-video-ad-${safePosition} .ima-skip-button,
                #Trendsposts-banner-ad-${safePosition} .ima-skip-button {
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                    z-index: 10002 !important;
                    pointer-events: auto !important;
                }
                
                /* IMA countdown and ad label */
                #Trendsposts-video-ad-${safePosition} [class*="ima"] [class*="countdown"],
                #Trendsposts-banner-ad-${safePosition} [class*="ima"] [class*="countdown"],
                #Trendsposts-video-ad-${safePosition} [class*="ima"] [class*="ad-label"],
                #Trendsposts-banner-ad-${safePosition} [class*="ima"] [class*="ad-label"] {
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                    z-index: 10002 !important;
                }
                
                /* IMA progress bar (yellow line) - FULLY VISIBLE */
                #Trendsposts-video-ad-${safePosition} [class*="ima"] [class*="progress"],
                #Trendsposts-banner-ad-${safePosition} [class*="ima"] [class*="progress"],
                #Trendsposts-video-ad-${safePosition} .ima-progress-div,
                #Trendsposts-banner-ad-${safePosition} .ima-progress-div {
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                    z-index: 10002 !important;
                    height: 4px !important;
                    background: rgba(255, 255, 255, 0.3) !important;
                }
                
                /* IMA progress bar fill (yellow) */
                #Trendsposts-video-ad-${safePosition} [class*="ima"] [class*="progress"] [class*="fill"],
                #Trendsposts-banner-ad-${safePosition} [class*="ima"] [class*="progress"] [class*="fill"] {
                    background: #ffeb3b !important;
                    height: 100% !important;
                }
                
                /* Responsive tablet - FIT TO AD SLOT SIZE */
                @media (max-width: 768px) and (min-width: 481px) {
                    #Trendsposts-video-ad-${safePosition},
                    #Trendsposts-banner-ad-${safePosition} {
                        width: ${containerSizing?.tablet.width || maxW}px !important;
                        height: ${containerSizing?.tablet.height || maxH}px !important;
                        max-width: ${containerSizing?.tablet.width || maxW}px !important;
                        max-height: ${containerSizing?.tablet.height || maxH}px !important;
                    }
                    #Trendsposts-video-ad-${safePosition} .video-js,
                    #Trendsposts-banner-ad-${safePosition} .video-js {
                        width: ${containerSizing?.tablet.width || maxW}px !important;
                        height: ${containerSizing?.tablet.height || maxH}px !important;
                    }
                }
                
                /* Responsive mobile - FIT TO AD SLOT SIZE */
                @media (max-width: 480px) {
                    #Trendsposts-video-ad-${safePosition},
                    #Trendsposts-banner-ad-${safePosition} {
                        width: ${containerSizing?.mobile.width || maxW}px !important;
                        height: ${containerSizing?.mobile.height || maxH}px !important;
                        max-width: ${containerSizing?.mobile.width || maxW}px !important;
                        max-height: ${containerSizing?.mobile.height || maxH}px !important;
                    }
                    #Trendsposts-video-ad-${safePosition} .video-js,
                    #Trendsposts-banner-ad-${safePosition} .video-js {
                        width: ${containerSizing?.mobile.width || maxW}px !important;
                        height: ${containerSizing?.mobile.height || maxH}px !important;
                    }
                }

                /* Hide Video.js fullscreen button to prevent manual triggers */
                #Trendsposts-video-ad-${safePosition} .vjs-fullscreen-control,
                #Trendsposts-banner-ad-${safePosition} .vjs-fullscreen-control {
                    display: none !important;
                }
            `;
            container.appendChild(styleOverride);

            // Attempt to initialize Video.js + IMA if libraries are loaded
            if (typeof window !== "undefined") {
                const initPlayer = async () => {
                    // Abort if cleanup already ran (HMR race condition)
                    if (isCancelled) {
                        return;
                    }

                    const videojs = (window as any).videojs;
                    if (!videojs) {
                        return;
                    }

                    try {
                        const targetId = isBanner ? `nv-banner-video-player-${safePosition}` : `nv-video-player-${safePosition}`;

                        // Dispose any existing player with this ID before creating new one
                        try {
                            const existing = videojs.getPlayer?.(targetId) || videojs.players?.[targetId];
                            if (existing && typeof existing.dispose === 'function') {
                                existing.dispose();
                            }
                        } catch (e) {}

                        // Small delay to ensure DOM is ready
                        await new Promise(resolve => setTimeout(resolve, 100));

                        // Re-check after async delay
                        if (isCancelled) {
                            return;
                        }

                        // Check if the DOM element still exists
                        const el = document.getElementById(targetId);
                        if (!el) {
                            return;
                        }

                        player = videojs(targetId, {
                            autoplay: 'muted',
                            muted: true,
                            controls: true,
                            preload: "auto",
                            fluid: false,
                            responsive: false,
                            fill: false,
                            width: maxW,
                            height: maxH,
                            nativeControlsForTouch: false,
                            userActions: {
                                doubleClick: false,
                                click: false
                            }
                        });
                        playerRef.current = player;

                        // Initialize IMA Ads Manager SYNCHRONOUSLY right after player creation
                        if (typeof player.ima === 'function' && vastUrl && vastUrl.trim() !== "") {
                            try {
                                player.ima({
                                    id: targetId,
                                    adTagUrl: resolveVastUrl(vastUrl),
                                    vpaidMode: (window as any).google?.ima?.ImaSdkSettings?.VpaidMode?.INSECURE || 2,
                                    debug: false,
                                    disableCustomPlaybackForIOS10Plus: false,
                                    nativeControlsForTouch: false,
                                    autoComputeAdSize: true,
                                    showCountdown: true,
                                    showControlsForJSAds: true,
                                    adLabel: 'Advertisement',
                                    adsRenderingSettings: {
                                        restoreCustomPlaybackStateOnAdBreakComplete: true,
                                        enablePreloading: true,
                                        useStyledLinearAds: true,
                                        useStyledNonLinearAds: true,
                                    }
                                });
                            } catch (e) {
                            }
                        }

                        // Set content video (required to trigger 'play' and start preroll ads)
                        const fallbackMedia = ad?.mediaUrl || ad?.url;
                        // Tiny official Google IMA dummy video for standalone ad slots
                        const DUMMY_VIDEO = "https://storage.googleapis.com/gvabox/media/samples/stock.mp4";
                        
                        try {
                            player.src({
                                src: fallbackMedia || DUMMY_VIDEO,
                                type: fallbackMedia?.endsWith(".mp3") ? "audio/mpeg" : "video/mp4",
                            });
                            player.load();
                        } catch (e) {
                        }

                        player.ready(() => {
                            if (isCancelled) return;
                            // Player ready
                            
                            // Explicitly call play() because injecting the src dynamically 
                            // bypasses the initial HTML5 autoplay evaluation.
                            // This is REQUIRED to trigger the IMA preroll ad on Next.js soft navigation.
                            setTimeout(() => {
                                if (isCancelled) return;
                                try {
                                    const playPromise = player.play();
                                    if (playPromise !== undefined) {
                                        playPromise.catch((e: any) => {
                                        });
                                    }
                                } catch (e) {
                                }
                            }, 50);

                            player.on('ads-ad-started', () => {
                                setIsAdPlaying(true);
                                // Add "Sponsored Video" label
                                const label = document.createElement('div');
                                label.id = `sponsored-label-${safePosition}`;
                                label.style.cssText = `
                                    position: absolute;
                                    top: 10px;
                                    left: 50%;
                                    transform: translateX(-50%);
                                    background: rgba(0,0,0,0.8);
                                    color: #fff;
                                    font-size: 12px;
                                    font-weight: 600;
                                    padding: 5px 12px;
                                    border-radius: 4px;
                                    letter-spacing: 0.05em;
                                    pointer-events: none;
                                    z-index: 10003;
                                    display: block;
                                `;
                                label.textContent = 'Sponsored Video';
                                const videoContainer = document.getElementById(isBanner ? `Trendsposts-banner-ad-${safePosition}` : `Trendsposts-video-ad-${safePosition}`);
                                if (videoContainer) {
                                    videoContainer.appendChild(label);
                                }
                                
                                // Show IMA controls
                                const imaContainer = videoContainer?.querySelector('[class*="ima-ad-container"]');
                                if (imaContainer) {
                                    (imaContainer as HTMLElement).style.display = 'block';
                                }
                            });

                            // Resume ad/video when user returns from click-through tab
                            const handleVisibilityChange = () => {
                                if (document.visibilityState === 'visible' && playerRef.current) {
                                    try {
                                        // If IMA ad is active, resume the ad (not the content video)
                                        const adsManager = playerRef.current.ima?.getAdsManager?.();
                                        if (adsManager) {
                                            adsManager.resume();
                                        } else {
                                            playerRef.current.play();
                                        }
                                    } catch (e) {
                                        try { playerRef.current.play(); } catch (e2) {}
                                    }
                                }
                            };
                            document.addEventListener('visibilitychange', handleVisibilityChange);
                            (player as any).__nvVisibility = handleVisibilityChange;

                            player.on('ads-ad-ended', () => {
                                setIsAdPlaying(false);
                                // Remove "Sponsored Video" label
                                const label = document.getElementById(`sponsored-label-${safePosition}`);
                                if (label) {
                                    label.style.display = 'none';
                                    label.remove();
                                }
                                
                                // Hide IMA container when content plays
                                const videoContainer = document.getElementById(isBanner ? `Trendsposts-banner-ad-${safePosition}` : `Trendsposts-video-ad-${safePosition}`);
                                const imaContainer = videoContainer?.querySelector('[class*="ima-ad-container"]');
                                if (imaContainer) {
                                    (imaContainer as HTMLElement).style.display = 'none';
                                }
                                
                                try { player.play(); } catch (e) {}
                            });

                            player.on('ads-all-ads-completed', () => {
                                setIsAdPlaying(false);
                                // Remove "Sponsored Video" label
                                const label = document.getElementById(`sponsored-label-${safePosition}`);
                                if (label) {
                                    label.style.display = 'none';
                                    label.remove();
                                }
                                
                                // Hide IMA container when content plays
                                const videoContainer = document.getElementById(isBanner ? `Trendsposts-banner-ad-${safePosition}` : `Trendsposts-video-ad-${safePosition}`);
                                const imaContainer = videoContainer?.querySelector('[class*="ima-ad-container"]');
                                if (imaContainer) {
                                    (imaContainer as HTMLElement).style.display = 'none';
                                }
                                
                                // Mark that we need to reload ads on next cycle
                                (player as any).__needsAdReload = true;
                                
                                try { player.play(); } catch (e) {}
                            });

                            player.on('adserror', () => {
                                setIsAdPlaying(false);
                                // Remove "Sponsored Video" label
                                const label = document.getElementById(`sponsored-label-${safePosition}`);
                                if (label) {
                                    label.style.display = 'none';
                                    label.remove();
                                }
                                
                                // Hide IMA container on error
                                const videoContainer = document.getElementById(isBanner ? `Trendsposts-banner-ad-${safePosition}` : `Trendsposts-video-ad-${safePosition}`);
                                const imaContainer = videoContainer?.querySelector('[class*="ima-ad-container"]');
                                if (imaContainer) {
                                    (imaContainer as HTMLElement).style.display = 'none';
                                }
                                
                                try { player.play(); } catch (e) {}
                            });

                            // Handle video errors
                            player.on('error', (e: any) => {
                                // Don't reload, just log the error
                            });

                            // Auto-loop: after content ends, reload player to get fresh ad
                            player.on('ended', () => {
                                if (vastUrl && vastUrl.trim() !== "" && (player as any).__needsAdReload) {
                                    // Force re-initialization by setting initializedRef to false
                                    // This will trigger the effect to re-run on next render
                                    initializedRef.current = false;
                                    setHmrForceKey(k => k + 1);
                                } else {
                                    // No VAST URL or no reload needed - just loop the content video
                                    try {
                                        player.currentTime(0);
                                        player.play();
                                    } catch (e) {}
                                }
                            });

                            if (isBanner) {
                                player.on("ads-ad-started", () => {
                                    const companionSlots = player.ima?.getCompanionAds(728, 90);
                                    if (companionSlots && companionSlots.length > 0) {
                                        const cmp = document.getElementById(`nv-companion-ad-${position}`);
                                        if (cmp) cmp.innerHTML = companionSlots[0].getContent();
                                    }
                                });
                            }
                        });
                    } catch (e) {
                    }
                };

                const loadScript = (src: string) => new Promise((resolve) => {
                    if (document.querySelector(`script[src="${src}"]`)) {
                        return resolve(true);
                    }
                    const s = document.createElement('script');
                    s.src = src;
                    s.onload = resolve;
                    document.head.appendChild(s);
                });

                const waitForPlugins = () => {
                    let checkCount = 0;
                    const check = () => {
                        if (isCancelled) return;
                        const vjs = (window as any).videojs;
                        checkCount++;
                        if (checkCount > 100) {
                             initPlayer(); // Try anyway
                             return;
                        }
                        if (vjs) {
                            const hasIma = vjs.prototype?.ima || vjs.ima || vjs.getPlugin?.('ima');
                            if (vastUrl && !hasIma) {
                                setTimeout(check, 50);
                                return;
                            }
                            initPlayer();
                        } else {
                            setTimeout(check, 50);
                        }
                    };
                    check();
                };

                const vjsExists = !!(window as any).videojs;
                const imaExists = vjsExists && !!((window as any).videojs.prototype?.ima || (window as any).videojs.ima || (window as any).videojs.getPlugin?.('ima'));

                if (!imaExists) {
                    // Need to load stuff
                    const baseScripts = [];
                    if (!vjsExists) {
                        if (!document.querySelector('link[href*="video-js.css"]')) {
                            const l = document.createElement('link');
                            l.rel = 'stylesheet';
                            l.href = 'https://vjs.zencdn.net/8.10.0/video-js.css';
                            document.head.appendChild(l);
                        }
                        baseScripts.push(loadScript("https://vjs.zencdn.net/8.10.0/video.min.js"));
                    }
                    baseScripts.push(loadScript("https://imasdk.googleapis.com/js/sdkloader/ima3.js"));

                    Promise.all(baseScripts).then(() => {
                        return Promise.all([
                            loadScript("https://unpkg.com/videojs-contrib-ads@6/dist/videojs.ads.min.js"),
                            loadScript("https://unpkg.com/videojs-ima@1/dist/videojs.ima.min.js")
                        ]);
                    }).then(() => {
                        waitForPlugins();
                    });
                } else {
                    waitForPlugins();
                }
            }
            return;
        }

        // --- Regular HTML/Script ad ---
        if (ad.code?.trim()) {
            // For direct_video template, the script should NOT be executed
            // Our controlled player above handles it
            if (ad?.templateType === 'direct_video') {
                // Skipping script execution for direct_video template
                return;
            }

            container.innerHTML = "";

            // Provider ads (Google AdSense, Ad Manager, etc.) are rendered exactly as provided
            // No modifications to their code - they manage their own UI, tracking, and behavior
            if (isProviderAd) {
                // Rendering provider ad: {providerInfo?.name}
            }

            const isFullHtmlDocument = ad.code.trim().toLowerCase().startsWith("<!doctype html") || ad.code.trim().toLowerCase().startsWith("<html");
            const hasScripts = ad.code.includes("<script");

            // We use an iframe if it's a complete HTML document, or if it's a custom script ad (non-provider)
            // that requires document.write or isolation.
            const needsIframe = isFullHtmlDocument || (!isProviderAd && hasScripts);

            if (needsIframe) {
                const iframe = document.createElement("iframe");
                iframe.style.width = "100%";
                iframe.style.height = "100%";
                iframe.style.border = "none";
                iframe.style.overflow = "hidden";

                container.appendChild(iframe);

                const doc = iframe.contentWindow?.document;
                if (doc) {
                    doc.open();
                    if (isFullHtmlDocument) {
                        doc.write(ad.code);
                    } else {
                        doc.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>body { margin: 0; padding: 0; overflow: hidden; height: 100%; width: 100%; }</style>
</head>
<body>
${ad.code}
</body>
</html>`);
                    }
                    doc.close();
                }
            } else if (hasScripts) {
                // Known provider ad (e.g. Google AdSense) that requires top-level window access.
                // We inject scripts directly into the DOM while preserving execution order.
                const wrapper = document.createElement("div");
                wrapper.innerHTML = ad.code;

                const inlineScripts: Element[] = [];
                const externalScripts: Element[] = [];
                const nonScripts: Element[] = [];

                Array.from(wrapper.children).forEach((child) => {
                    if (child.tagName === "SCRIPT") {
                        if (child.getAttribute("src")) {
                            externalScripts.push(child);
                        } else {
                            inlineScripts.push(child);
                        }
                    } else {
                        nonScripts.push(child);
                    }
                });

                // Append non-script elements first
                nonScripts.forEach((child) => {
                    container.appendChild(child.cloneNode(true));
                });

                // Execute inline scripts first
                inlineScripts.forEach((child) => {
                    const script = document.createElement("script");
                    if (child.getAttribute("type")) {
                        script.type = child.getAttribute("type")!;
                    }
                    script.textContent = child.textContent || "";
                    container.appendChild(script);
                });

                // Then load external scripts
                externalScripts.forEach((child) => {
                    const script = document.createElement("script");
                    script.src = child.getAttribute("src")!;
                    if (child.getAttribute("type")) {
                        script.type = child.getAttribute("type")!;
                    }
                    if (child.getAttribute("async")) {
                        script.async = true;
                    }
                    container.appendChild(script);
                });
            } else {
                // Simple HTML snippet without scripts
                container.innerHTML = ad.code;
            }
            return;
        }

        // --- Image-only ad (mediaUrl, no code) ---
        if (ad?.mediaUrl?.trim()) {
            container.innerHTML = "";
            const img = document.createElement("img");
            img.src = ad.mediaUrl;
            img.alt = "Advertisement";
            img.style.cssText = "width:100%;height:100%;object-fit:cover;border-radius:8px;";
            if (ad.clickThroughUrl || ad.url) {
                const a = document.createElement("a");
                a.href = ad.clickThroughUrl || ad.url || "#";
                a.target = "_blank";
                a.rel = "noopener";
                a.appendChild(img);
                container.appendChild(a);
            } else {
                container.appendChild(img);
            }
            return;
        }

        // Cleanup function — runs when effect deps change OR on unmount
        return () => {
            isCancelled = true;
            setIsAdPlaying(false);
            initializedRef.current = false;

            const playerToDispose = playerRef.current || player;
            if (playerToDispose) {
                // Clean up visibilitychange listener
                try {
                    if ((playerToDispose as any).__nvVisibility) {
                        document.removeEventListener('visibilitychange', (playerToDispose as any).__nvVisibility);
                    }
                } catch (e) {}
                try {
                    playerToDispose.dispose();
                } catch (e) {}
                playerRef.current = null;
                player = null;
            }

            // Also dispose by element ID (catches orphaned players)
            if (typeof window !== 'undefined' && (window as any).videojs) {
                const vjs = (window as any).videojs;
                for (const id of [`nv-banner-video-player-${safePosition}`, `nv-video-player-${safePosition}`]) {
                    try {
                        const p = vjs.getPlayer?.(id) || vjs.players?.[id];
                        if (p && typeof p.dispose === 'function') p.dispose();
                    } catch (e) {}
                }
            }
        };
    }, [ad, position, isVastAd, isDirectVideo, vastUrl, ad?.mediaUrl, ad?.url, width, isProviderAd, providerInfo, containerSizing, hmrForceKey, visitorData]);

    if (isLoading) {
        return (
            <div
                className={`animate-pulse bg-[var(--flex-gray-7)] rounded ${className}`}
                style={{ width: fullWidth ? "100%" : width, height }}
            />
        );
    }

    if (!ad || !ad.enabled || isClosed) {
        return null;
    }

    // Don't render if ad has no actual content configured
    const hasContent = !!(
        ad.code?.trim() ||
        ad.mediaUrl?.trim() ||
        ad.url?.trim() ||
        ad.vastUrl?.trim() ||
        ad.vastTagUrl?.trim() ||
        ad.nativeContent
    );
    if (!hasContent) {
        return null;
    }

    const displayLabel = appearance.showLabel ? appearance.labelText : "";

    // Apply size constraints from configuration — responsive per viewport
    const containerStyle: React.CSSProperties = {
        maxWidth: "100%",
        height: "100%",
        width: "100%",
        overflow: "visible",
        position: isPopoverOpen ? "relative" : undefined,
        zIndex: isPopoverOpen ? 999999 : undefined,
    };

    // Apply appearance settings
    const appearanceStyle: React.CSSProperties = {
        border: appearance.borderStyle !== "none"
            ? `${appearance.borderWidth}px ${appearance.borderStyle} ${appearance.borderColor}`
            : "none",
        backgroundColor: appearance.backgroundColor,
        borderRadius: `${appearance.borderRadius}px`,
        boxShadow: appearance.boxShadow,
        position: "relative",
        padding: `${appearance.padding?.top ?? 0}px ${appearance.padding?.right ?? 0}px ${appearance.padding?.bottom ?? 0}px ${appearance.padding?.left ?? 0}px`,
        margin: `${appearance.margin?.top ?? 0}px ${appearance.margin?.right ?? 0}px ${appearance.margin?.bottom ?? 0}px ${appearance.margin?.left ?? 0}px`,
        transform: `scale(${appearance.containerScale ?? 1})`,
        transformOrigin: "center top",
    };

    return (
        <>
            <div
                className={`ad-container ${className} flex flex-col items-start justify-start ${fullWidth ? "w-full" : "mx-auto"}`}
                data-ad-position={position}
                onClick={handleAdClick}
                style={{ ...containerStyle, ...appearanceStyle, overflow: "visible" }}
            >
                {/* Responsive CSS for tablet and mobile sizes + Universal Image/Video scaling */}
                {containerSizing && isMounted && (
                    <style dangerouslySetInnerHTML={{
                        __html: `
                        [data-ad-position="${position}"] .ad-media-wrapper {
                            cursor: ${ad.clickThroughUrl || ad.url || isVastAd ? 'pointer' : 'default'} !important;
                        }

                        /* Universal image and video scaling for ALL ad types - COVER mode (no black bars) */
                        [data-ad-position="${position}"] img,
                        [data-ad-position="${position}"] video:not(.video-js):not(.vjs-tech) {
                            width: 100% !important;
                            height: 100% !important;
                            object-fit: ${appearance.objectFit} !important;
                            display: block !important;
                            margin: 0 auto !important;
                            position: relative !important;
                            transform: scale(${appearance.mediaScale}) !important;
                        }

                        /* Target dimensions for the actual media wrapper */
                        [data-ad-position="${position}"] .ad-media-wrapper {
                            width: ${containerSizing.desktop.width}px !important;
                            height: ${containerSizing.desktop.height}px !important;
                            max-width: 100% !important;
                            max-height: 100% !important;
                            overflow: hidden !important;
                        }

                        /* Force ONLY the media container and its children to fill the wrapper */
                        [data-ad-position="${position}"] .ad-media-wrapper > div:first-child,
                        [data-ad-position="${position}"] .ad-media-wrapper > div:first-child iframe,
                        [data-ad-position="${position}"] #Trendsposts-video-ad-${position},
                        [data-ad-position="${position}"] #Trendsposts-banner-ad-${position} {
                            width: 100% !important;
                            height: 100% !important;
                            max-width: 100% !important;
                            max-height: 100% !important;
                        }
                        
                        /* Container responsive sizing */
                        @media (max-width: 768px) and (min-width: 481px) {
                            [data-ad-position="${position}"] .ad-media-wrapper {
                                width: ${containerSizing.tablet.width}px !important;
                                height: ${containerSizing.tablet.height}px !important;
                                max-height: 100% !important;
                            }
                        }
                        @media (max-width: 480px) {
                            [data-ad-position="${position}"] .ad-media-wrapper {
                                width: ${containerSizing.mobile.width}px !important;
                                height: ${containerSizing.mobile.height}px !important;
                                max-height: 100% !important;
                            }
                        }
                    `}} />
                )}

                <div className="relative w-full h-full flex items-center justify-center group">
                    <div 
                        className="ad-media-wrapper relative"
                        onClick={handleAdClick}
                    >
                        {/* AD Badge - On actual ad content (video/image) */}
                        {displayLabel && (
                            <div className="absolute top-2 start-2 z-50 pointer-events-none">
                                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/60 text-white/90 backdrop-blur-sm">
                                    AD
                                </span>
                            </div>
                        )}
                        
                        <div
                            ref={adContainerRef}
                            className="w-full h-full relative overflow-hidden z-0"
                        >
                        </div>

                        {/* Overlay panel for ad options, similar to Google Ads style */}
                        {!isProviderAd && (appearance.showInfoIcon || appearance.showCloseButton) && (
                            <AdActionsPopover
                                onOpenChange={setIsPopoverOpen}
                                side={position === "sticky-footer" ? "top" : "bottom"}
                                onSubmit={async (reason, customText) => {
                                    if (!ad || !ad._id) return;
                                    try {
                                        await fetch(`/api/ads/${ad._id}/analytics`, {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({
                                                event: "close",
                                                closeReason: reason,
                                                customText: customText || undefined,
                                            }),
                                        });
                                        if (reason !== "reported_ad") {
                                            setIsClosed(true);
                                        }
                                    } catch (err) {
                                        console.error("Failed to track close reason:", err);
                                    }
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
