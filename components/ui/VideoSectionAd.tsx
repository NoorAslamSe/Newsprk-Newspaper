"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import VastVideoPlayer from "./VastVideoPlayer";
import type { PageType, AdPosition } from "@/lib/models/AdSnippet";

interface Props {
    pageType: PageType;
    position: AdPosition;
}

export default function VideoSectionAd({ pageType, position }: Props) {
    const [adTriggered, setAdTriggered] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Fetch ad data for video-section position
    const { data, isLoading } = useQuery({
        queryKey: ["ads", pageType, position],
        queryFn: async () => {
            const res = await fetch(
                `/api/ads?pageType=${pageType}&position=${position}&activeOnly=true`,
                { cache: "no-store" }
            );
            if (!res.ok) return { items: [] };
            return res.json() as Promise<{ items: any[] }>;
        },
        staleTime: 0,
        gcTime: 0,
    });

    const ad = data?.items?.find((a: any) =>
        a.pageType === pageType && a.position === position && a.enabled !== false
    );
    const vastUrl = (ad?.vastTagUrl || ad?.vastUrl || "").trim();
    const contentUrl = (ad?.mediaUrl || ad?.externalMediaUrl || ad?.url || "").trim();
    const posterUrl = (ad?.mediaUrl || "").trim();
    const hasVastAd = !!vastUrl;

    // IntersectionObserver: trigger ad when section scrolls into view
    useEffect(() => {
        if (!hasVastAd || adTriggered) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !adTriggered) {
                    setAdTriggered(true);
                }
            },
            { threshold: 0.3 }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, [hasVastAd, adTriggered]);

    // Loading state
    if (isLoading) {
        return (
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black">
                <div className="text-white text-sm">Loading video...</div>
            </div>
        );
    }

    // No ad configured at all
    if (!ad || (!hasVastAd && !contentUrl)) {
        return (
            <div ref={containerRef} className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black">
                <div className="text-center">
                    <div className="text-white text-lg mb-2">Video Section</div>
                    <div className="text-gray-400 text-sm">Configure a video ad in Dashboard → Ads Manager</div>
                </div>
            </div>
        );
    }

    // Has VAST ad but NOT scrolled into view yet → show poster/placeholder
    if (hasVastAd && !adTriggered) {
        return (
            <div ref={containerRef} className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black cursor-pointer">
                {posterUrl ? (
                    <img
                        src={posterUrl}
                        alt="Video thumbnail"
                        className="w-full h-full object-cover"
                        style={{ position: "absolute", top: 0, left: 0 }}
                    />
                ) : (
                    <div className="text-center">
                        <div className="text-white text-4xl mb-2">&#9654;</div>
                        <div className="text-gray-400 text-sm">Scroll to play video</div>
                    </div>
                )}
            </div>
        );
    }

    // Scrolled into view → play VAST ad first, then content video
    if (hasVastAd && adTriggered) {
        return (
            <div ref={containerRef} className="absolute top-0 left-0 w-full h-full">
                <VastVideoPlayer
                    vastUrl={vastUrl}
                    contentUrl={contentUrl || undefined}
                    position={position}
                    width={1920}
                    height={1080}
                    autoplay={true}
                    muted={true}
                    loop={false}
                />
            </div>
        );
    }

    // No VAST ad, just content video → play directly
    if (contentUrl) {
        return (
            <div ref={containerRef} className="absolute top-0 left-0 w-full h-full">
                <VastVideoPlayer
                    vastUrl="about:blank"
                    contentUrl={contentUrl}
                    position={position}
                    width={1920}
                    height={1080}
                    autoplay={false}
                    muted={true}
                    loop={true}
                />
            </div>
        );
    }

    return null;
}
