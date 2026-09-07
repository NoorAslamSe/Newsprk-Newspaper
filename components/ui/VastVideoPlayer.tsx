"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";

interface VastVideoPlayerProps {
  vastUrl: string;
  contentUrl?: string;
  poster?: string;
  width?: number;
  height?: number;
  position?: string;
  muted?: boolean;
  autoplay?: boolean;
  loop?: boolean;
}

// ── VAST data extracted from XML ──────────────────────────────────────────────
interface VastData {
  mediaUrl: string;
  clickThroughUrl: string | null;
  skipOffsetSeconds: number | null; // null = not skippable
  durationSeconds: number;
  tracking: Record<string, string[]>; // event → array of pixel URLs
  impressionUrls: string[];
}

// ── Parse HH:MM:SS or MM:SS or SS into seconds ────────────────────────────────
function parseTime(t: string): number {
  if (!t) return 0;
  const parts = t.trim().split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

// ── Fire tracking pixels (best-effort, no-throw) ─────────────────────────────
function firePixels(urls: string[]) {
  urls.forEach((url) => {
    try {
      fetch(url, { mode: "no-cors", cache: "no-store" }).catch(() => {});
    } catch (_) {}
  });
}

// ── Parse VAST XML into VastData ──────────────────────────────────────────────
function parseVast(xml: string): VastData | null {
  try {
    const doc = new DOMParser().parseFromString(xml, "text/xml");

    // Media file — prefer mp4 progressive
    const mediaFiles = Array.from(doc.querySelectorAll("MediaFile"));
    const sorted = mediaFiles.sort((a, b) => {
      const aT = (a.getAttribute("type") || "").toLowerCase();
      const bT = (b.getAttribute("type") || "").toLowerCase();
      if (aT.includes("mp4") && !bT.includes("mp4")) return -1;
      if (!aT.includes("mp4") && bT.includes("mp4")) return 1;
      return 0;
    });
    const mediaUrl = sorted[0]?.textContent?.trim();
    if (!mediaUrl) return null;

    // Duration
    const durationStr = doc.querySelector("Duration")?.textContent?.trim() || "0";
    const durationSeconds = parseTime(durationStr);

    // Skip offset — attribute on <Linear skipoffset="HH:MM:SS">
    const linear = doc.querySelector("Linear");
    const skipAttr = linear?.getAttribute("skipoffset") || null;
    const skipOffsetSeconds = skipAttr ? parseTime(skipAttr) : null;

    // Click-through
    const clickThroughUrl =
      doc.querySelector("ClickThrough")?.textContent?.trim() || null;

    // Tracking events
    const tracking: Record<string, string[]> = {};
    doc.querySelectorAll("Tracking").forEach((el) => {
      const event = el.getAttribute("event");
      const url = el.textContent?.trim();
      if (event && url) {
        if (!tracking[event]) tracking[event] = [];
        tracking[event].push(url);
      }
    });

    // Impression pixels
    const impressionUrls: string[] = [];
    doc.querySelectorAll("Impression").forEach((el) => {
      const url = el.textContent?.trim();
      if (url) impressionUrls.push(url);
    });

    return { mediaUrl, clickThroughUrl, skipOffsetSeconds, durationSeconds, tracking, impressionUrls };
  } catch (e) {
    console.warn("[VastVideoPlayer] VAST parse error:", e);
    return null;
  }
}

// ── Dynamic wrapper (SSR disabled) ───────────────────────────────────────────
export default function VastVideoPlayer(props: VastVideoPlayerProps) {
  const pathname = usePathname();
  return (
    <VastVideoPlayerInner
      key={`${pathname}-${props.position || "default"}`}
      {...props}
    />
  );
}

// ── Main component ────────────────────────────────────────────────────────────
type Phase = "loading" | "ad" | "content" | "error";

function VastVideoPlayerInner({
  vastUrl,
  contentUrl,
  poster,
  width = 860,
  height = 484,
  position = "default",
  muted = false,
  autoplay = true,
  loop = false,
}: VastVideoPlayerProps) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [vast, setVast] = useState<VastData | null>(null);

  // Ad playback state
  const [adCurrentTime, setAdCurrentTime] = useState(0);
  const [canSkip, setCanSkip] = useState(false);
  const [adMuted, setAdMuted] = useState(true); // start muted for autoplay, user can unmute

  const adVideoRef = useRef<HTMLVideoElement>(null);
  const contentVideoRef = useRef<HTMLVideoElement>(null);
  const trackedRef = useRef<Set<string>>(new Set());

  // ── Fetch + parse VAST ──────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setPhase("loading");
    setVast(null);
    trackedRef.current = new Set();

    const proxyUrl = `/api/vast-proxy?url=${encodeURIComponent(vastUrl)}`;
    fetch(proxyUrl, { cache: "no-store" })
      .then((r) => (r.ok ? r.text() : Promise.reject(r.status)))
      .then((xml) => {
        if (cancelled) return;
        const data = parseVast(xml);
        if (data) {
          setVast(data);
          setPhase("ad");
        } else {
          setPhase(contentUrl ? "content" : "error");
        }
      })
      .catch(() => {
        if (!cancelled) setPhase(contentUrl ? "content" : "error");
      });

    return () => { cancelled = true; };
  }, [vastUrl, contentUrl]);

  // ── Auto-play ad when phase becomes "ad" ───────────────────────────────────
  useEffect(() => {
    if (phase !== "ad" || !adVideoRef.current || !vast) return;
    
    // Show "Sponsored Video" label when ad plays
    const label = document.getElementById(`vast-sponsored-label-${position}`);
    if (label) {
      label.style.display = 'block';
    }
    
    const v = adVideoRef.current;
    v.currentTime = 0;
    setAdCurrentTime(0);
    setCanSkip(false);
    // Fire impression pixels
    firePixels(vast.impressionUrls);
    v.play().catch(() => {});
  }, [phase, vast, position]);

  // ── Auto-play content when phase becomes "content" ─────────────────────────
  useEffect(() => {
    if (phase !== "content" || !contentVideoRef.current) return;
    
    // Hide "Sponsored Video" label when content plays
    const label = document.getElementById(`vast-sponsored-label-${position}`);
    if (label) {
      label.style.display = 'none';
    }
    
    contentVideoRef.current.play().catch(() => {});
  }, [phase, position]);

  // ── Ad time update → countdown + skip unlock + tracking ───────────────────
  const handleAdTimeUpdate = useCallback(() => {
    if (!adVideoRef.current || !vast) return;
    const t = adVideoRef.current.currentTime;
    setAdCurrentTime(t);

    // Unlock skip button
    if (vast.skipOffsetSeconds !== null && t >= vast.skipOffsetSeconds && !canSkip) {
      setCanSkip(true);
    }

    // Fire tracking pixels at milestones (once each)
    const dur = vast.durationSeconds || adVideoRef.current.duration || 1;
    const pct = t / dur;
    const fire = (event: string) => {
      if (!trackedRef.current.has(event) && vast.tracking[event]) {
        trackedRef.current.add(event);
        firePixels(vast.tracking[event]);
      }
    };
    if (t > 0) fire("start");
    if (pct >= 0.25) fire("firstQuartile");
    if (pct >= 0.5) fire("midpoint");
    if (pct >= 0.75) fire("thirdQuartile");
  }, [vast, canSkip]);

  // ── Ad ended ───────────────────────────────────────────────────────────────
  const handleAdEnded = useCallback(() => {
    if (vast?.tracking?.complete) firePixels(vast.tracking.complete);
    // If content video exists, play it; otherwise re-request ad from VAST URL
    if (contentUrl) {
      setPhase("content");
    } else {
      // No content video - re-request ad from VAST URL to loop
      setPhase("loading");
      setTimeout(() => {
        setPhase("ad");
      }, 100);
    }
  }, [vast, contentUrl]);

  // ── Ad error → skip to content ─────────────────────────────────────────────
  const handleAdError = useCallback(() => {
    setPhase(contentUrl ? "content" : "error");
  }, [contentUrl]);

  // ── Skip button ────────────────────────────────────────────────────────────
  const handleSkip = useCallback(() => {
    if (vast?.tracking?.skip) firePixels(vast.tracking.skip);
    setPhase(contentUrl ? "content" : "error");
  }, [vast, contentUrl]);

  // ── Ad click-through ───────────────────────────────────────────────────────
  const handleAdClick = useCallback(() => {
    if (!vast?.clickThroughUrl) return;
    if (vast.tracking?.clickTracking) firePixels(vast.tracking.clickTracking);
    window.open(vast.clickThroughUrl, "_blank", "noopener,noreferrer");
    // Don't pause ad - let it continue playing
    // adVideoRef.current?.pause(); // REMOVED - ad should keep playing
  }, [vast]);

  // ── Mute toggle ────────────────────────────────────────────────────────────
  const handleMuteToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!adVideoRef.current) return;
    const next = !adMuted;
    adVideoRef.current.muted = next;
    setAdMuted(next);
    if (vast) {
      if (next && vast.tracking?.mute) firePixels(vast.tracking.mute);
      if (!next && vast.tracking?.unmute) firePixels(vast.tracking.unmute);
    }
  }, [adMuted, vast]);

  // ── Countdown display ──────────────────────────────────────────────────────
  const remaining = vast
    ? Math.max(0, Math.ceil((vast.durationSeconds || 0) - adCurrentTime))
    : 0;

  const skipWaitSeconds =
    vast?.skipOffsetSeconds !== null && vast?.skipOffsetSeconds !== undefined
      ? Math.max(0, Math.ceil(vast.skipOffsetSeconds - adCurrentTime))
      : null;

  return (
    <div
      style={{
        width: "100%",
        aspectRatio: "16/9",
        background: "transparent",
        borderRadius: 8,
        overflow: "hidden",
        position: "relative",
        userSelect: "none",
      }}
    >
      {/* Global styles for this player instance */}
      <style>{`
        /* Ensure video controls are always visible and prominent */
        video::-webkit-media-controls-panel {
          display: flex !important;
        }
        video::-webkit-media-controls {
          display: flex !important;
          opacity: 1 !important;
        }
        /* Ensure controls are clickable */
        video::-webkit-media-controls-enclosure {
          pointer-events: auto !important;
        }
      `}</style>
      {/* ── Loading spinner ─────────────────────────────────────────────── */}
      {phase === "loading" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent" }}>
          <div style={{
            width: 36, height: 36,
            border: "3px solid rgba(255,255,255,0.2)",
            borderTopColor: "#fff",
            borderRadius: "50%",
            animation: "nv-spin 0.8s linear infinite",
          }} />
          <style>{`@keyframes nv-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ── Ad phase ────────────────────────────────────────────────────── */}
      {phase === "ad" && vast && (
        <div style={{ position: "absolute", inset: 0 }}>
          {/* Ad video — click opens click-through, controls visible */}
          <video
            ref={adVideoRef}
            src={vast.mediaUrl}
            style={{ 
              width: "100%", 
              height: "100%", 
              objectFit: "cover", 
              cursor: vast.clickThroughUrl ? "pointer" : "default",
              display: "block",
              position: "absolute",
              top: 0,
              left: 0,
            }}
            playsInline
            muted={adMuted}
            controls
            controlsList="nodownload"
            onTimeUpdate={handleAdTimeUpdate}
            onEnded={handleAdEnded}
            onError={handleAdError}
            onClick={handleAdClick}
          />

          {/* Sponsored Video Label - Top center, only during ad */}
          <div 
            id={`vast-sponsored-label-${position}`}
            style={{
              position: "absolute", 
              top: 10, 
              left: "50%", 
              transform: "translateX(-50%)",
              background: "rgba(0,0,0,0.8)", 
              color: "#fff",
              fontSize: 12, 
              fontWeight: 600, 
              padding: "5px 12px",
              borderRadius: 4, 
              letterSpacing: "0.05em",
              pointerEvents: "none", 
              zIndex: 100,
              display: "block",
            }}
          >
            Sponsored Video
          </div>

          {/* Top-left: "Ad" badge + countdown */}
          <div style={{
            position: "absolute", top: 10, left: 10,
            display: "flex", alignItems: "center", gap: 8,
            pointerEvents: "none",
          }}>
            <span style={{
              background: "rgba(0,0,0,0.7)", color: "#fff",
              fontSize: 11, fontWeight: 700, padding: "3px 7px",
              borderRadius: 3, letterSpacing: "0.06em", textTransform: "uppercase",
            }}>
              Ad
            </span>
            {remaining > 0 && (
              <span style={{
                background: "rgba(0,0,0,0.6)", color: "#ddd",
                fontSize: 12, padding: "3px 7px", borderRadius: 3,
              }}>
                {remaining}s
              </span>
            )}
          </div>

          {/* Top-right: mute toggle */}
          <button
            onClick={handleMuteToggle}
            style={{
              position: "absolute", top: 10, right: 10,
              background: "rgba(0,0,0,0.6)", border: "none",
              color: "#fff", borderRadius: "50%",
              width: 32, height: 32, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14,
            }}
            title={adMuted ? "Unmute" : "Mute"}
          >
            {adMuted ? "🔇" : "🔊"}
          </button>

          {/* Bottom-right: skip button */}
          <div style={{ position: "absolute", bottom: 12, right: 12 }}>
            {skipWaitSeconds !== null && skipWaitSeconds > 0 && (
              <div style={{
                background: "rgba(0,0,0,0.7)", color: "#ccc",
                fontSize: 12, padding: "6px 14px", borderRadius: 3,
              }}>
                Skip in {skipWaitSeconds}s
              </div>
            )}
            {canSkip && (
              <button
                onClick={handleSkip}
                style={{
                  background: "rgba(0,0,0,0.85)", color: "#fff",
                  border: "1px solid rgba(255,255,255,0.4)",
                  fontSize: 13, fontWeight: 600,
                  padding: "7px 16px", borderRadius: 3,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                }}
              >
                Skip Ad ›
              </button>
            )}
          </div>

          {/* Progress bar */}
          {vast.durationSeconds > 0 && (
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              height: 3, background: "rgba(255,255,255,0.2)",
            }}>
              <div style={{
                height: "100%",
                width: `${Math.min(100, (adCurrentTime / vast.durationSeconds) * 100)}%`,
                background: "#ef4444",
                transition: "width 0.25s linear",
              }} />
            </div>
          )}
        </div>
      )}

      {/* ── Content video phase ─────────────────────────────────────────── */}
      {phase === "content" && contentUrl && (
        <video
          ref={contentVideoRef}
          src={contentUrl}
          poster={poster}
          style={{ 
            width: "100%", 
            height: "100%", 
            objectFit: "cover",
            display: "block",
            position: "absolute",
            top: 0,
            left: 0,
            background: "transparent",
          }}
          controls
          controlsList="nodownload"
          playsInline
          muted={muted}
          loop={true}
          autoPlay
          onError={() => setPhase("error")}
          onEnded={() => {
            // Loop back to ad if VAST URL exists (re-request ad)
            if (vastUrl) {
              setPhase("loading");
              setTimeout(() => {
                setPhase("ad");
              }, 100);
            }
          }}
        />
      )}

      {/* ── Error / no content ──────────────────────────────────────────── */}
      {phase === "error" && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#666", fontSize: 14,
          background: "transparent",
        }}>
          Video unavailable
        </div>
      )}
    </div>
  );
}
