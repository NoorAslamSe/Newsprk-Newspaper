"use client";

import * as React from "react";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Monitor, Tablet, Smartphone, Maximize2, AlertTriangle,
  CheckCircle2, XCircle, Info, RotateCcw, ImageIcon, Film,
  X as CloseIcon, Palette, Newspaper
} from "lucide-react";
import NativeAdCard from "@/components/ui/NativeAdCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  AD_SIZE_PRESETS,
  POSITION_SIZE_CONFIG,
  getCreativeFitStatus,
  checkResponsiveFit,
  findMatchingPreset,
  type AdSizePreset,
  type ResponsiveFitResult,
} from "@/lib/constants/adSizes";

// ─── Types ────────────────────────────────────────────────────────
type Viewport = "desktop" | "tablet" | "mobile";

interface PerViewportSizing {
  width: number;
  height: number;
  paddingH: number;
  paddingV: number;
  marginH: number;
  marginV: number;
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
}

interface AdPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adCode?: string;
  vastTagUrl?: string;
  mediaUrl?: string;
  adType?: "html" | "image" | "video" | "vast" | "audio" | "native_feed";
  nativeContent?: any;
  position?: string;
  title?: string;
  allowSizingAdjustment?: boolean;
  initialWidth?: number;
  initialHeight?: number;
  onSizingApply?: (sizing: {
    desktop: PerViewportSizing;
    tablet: PerViewportSizing;
    mobile: PerViewportSizing;
    presetName?: string;
  }) => void;
  onAppearanceApply?: (appearance: AppearanceSettings) => void;
  initialAppearance?: AppearanceSettings;
  onSaveAd?: () => void;
  isSaving?: boolean;
}

const DEFAULT_APPEARANCE: AppearanceSettings = {
  borderStyle: "none",
  borderWidth: 0,
  borderColor: "#e5e5e5",
  backgroundColor: "transparent",
  borderRadius: 8,
  boxShadow: "none",
  showLabel: true,
  labelText: "Advertisement",
  showInfoIcon: false,
  showCloseButton: false,
  closeButtonPosition: "top-right",
};

const SHADOW_PRESETS = [
  { label: "None", value: "none" },
  { label: "Small", value: "0 1px 3px rgba(0,0,0,0.12)" },
  { label: "Medium", value: "0 4px 6px rgba(0,0,0,0.1)" },
  { label: "Large", value: "0 10px 15px rgba(0,0,0,0.1)" },
  { label: "Extra Large", value: "0 20px 25px rgba(0,0,0,0.15)" },
];

const VIEWPORT_WIDTHS: Record<Viewport, number> = {
  desktop: 1024,
  tablet: 768,
  mobile: 375,
};

const VIEWPORT_ICONS: Record<Viewport, React.ReactNode> = {
  desktop: <Monitor className="h-3.5 w-3.5" />,
  tablet: <Tablet className="h-3.5 w-3.5" />,
  mobile: <Smartphone className="h-3.5 w-3.5" />,
};

// ─── Fit status badge ────────────────────────────────────────────
function FitStatusBadge({ status }: { status: "within-bounds" | "oversized" | "undersized" }) {
  const configs = {
    "within-bounds": {
      cls: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30",
      icon: <CheckCircle2 className="mr-1 h-3 w-3" />,
      label: "Within Bounds",
    },
    oversized: {
      cls: "bg-red-100 text-red-700 border-red-300 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30",
      icon: <XCircle className="mr-1 h-3 w-3" />,
      label: "Oversized",
    },
    undersized: {
      cls: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30",
      icon: <AlertTriangle className="mr-1 h-3 w-3" />,
      label: "Undersized",
    },
  };
  const c = configs[status];
  return (
    <Badge className={cn(c.cls, "hover:opacity-90")}>
      {c.icon} {c.label}
    </Badge>
  );
}

// ─── Responsive fit indicator ────────────────────────────────────
function ResponsiveFitIndicator({ result }: { result: ResponsiveFitResult }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-xs">
      {(["desktop", "tablet", "mobile"] as const).map((vp) => {
        const r = result[vp];
        return (
          <div
            key={vp}
            className={cn(
              "rounded-md p-2 border text-center",
              r.fits
                ? "bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-400"
                : "bg-red-50 border-red-300 text-red-800 dark:bg-red-950/20 dark:border-red-800 dark:text-red-400"
            )}
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              {VIEWPORT_ICONS[vp]}
              <span className="font-semibold capitalize">{vp}</span>
            </div>
            <div className="text-[10px] leading-tight font-medium">
              {r.fits ? "✓ Fits" : "✗ Needs adjustment"}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Visual progress bar ─────────────────────────────────────────
function DimensionBar({
  label,
  value,
  maxValue,
  containerValue,
  unit = "px",
}: {
  label: string;
  value: number;
  maxValue: number;
  containerValue: number;
  unit?: string;
}) {
  const fillPercent = Math.min((value / maxValue) * 100, 100);
  const containerPercent = Math.min((containerValue / maxValue) * 100, 100);
  const isOverflow = value > containerValue;
  const isTight = value > containerValue * 0.9 && value <= containerValue;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-gray-900 dark:text-gray-100">{label}</span>
        <span className={cn(
          "font-mono text-[11px]",
          isOverflow ? "text-red-600 dark:text-red-400 font-bold" :
          isTight ? "text-amber-600 dark:text-amber-400" :
          "text-gray-600 dark:text-gray-400"
        )}>
          {value}{unit} / {containerValue}{unit}
        </span>
      </div>
      <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="absolute top-0 bottom-0 border-r-2 border-dashed border-gray-500 dark:border-gray-400 z-10"
          style={{ left: `${containerPercent}%` }}
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-all duration-300",
            isOverflow
              ? "bg-gradient-to-r from-red-500 to-red-600"
              : isTight
              ? "bg-gradient-to-r from-amber-400 to-amber-500"
              : "bg-gradient-to-r from-emerald-400 to-emerald-500"
          )}
          style={{ width: `${fillPercent}%` }}
        />
      </div>
    </div>
  );
}

// ─── Media Scaling Tab Content ───────────────────────────────────
function MediaScalingTab({
  viewport,
  sizing,
  containerWidth,
  containerHeight,
  mediaUrl,
  adType,
}: {
  viewport: Viewport;
  sizing: PerViewportSizing;
  containerWidth: number;
  containerHeight: number;
  mediaUrl: string;
  adType: string;
}) {
  const isVideo = /\.(mp4|webm|mov)$/i.test(mediaUrl) || adType === "video";
  const scaledWidth = Math.min(sizing.width, containerWidth - 20);
  const scaledHeight = Math.min(sizing.height, containerHeight - 20);
  const scaleRatio = Math.min(scaledWidth / sizing.width, scaledHeight / sizing.height, 1);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
          {isVideo ? <Film className="h-3.5 w-3.5 text-red-500" /> : <ImageIcon className="h-3.5 w-3.5 text-blue-500" />}
          {isVideo ? "Video" : "Image"} Scaling — {viewport.charAt(0).toUpperCase() + viewport.slice(1)}
        </span>
        <span className="font-mono text-gray-600 dark:text-gray-400">
          Scale: {Math.round(scaleRatio * 100)}%
        </span>
      </div>

      <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-800/50">
        <div className="text-[10px] text-gray-600 dark:text-gray-400 mb-2 font-medium">
          Slot: {containerWidth}×{containerHeight}px · Media renders at: {Math.round(sizing.width * scaleRatio)}×{Math.round(sizing.height * scaleRatio)}px
        </div>
        <div
          className="relative mx-auto border-2 border-dashed border-red-300 dark:border-red-700 rounded"
          style={{ width: `${Math.min(containerWidth, 300)}px`, height: `${Math.min(containerHeight, 200)}px` }}
        >
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-100 dark:bg-blue-900/40 border border-blue-400 dark:border-blue-600 rounded flex items-center justify-center text-[10px] text-blue-700 dark:text-blue-400 font-mono"
            style={{
              width: `${Math.min(sizing.width * scaleRatio, Math.min(containerWidth, 300) - 4)}px`,
              height: `${Math.min(sizing.height * scaleRatio, Math.min(containerHeight, 200) - 4)}px`,
            }}
          >
            {Math.round(sizing.width * scaleRatio)}×{Math.round(sizing.height * scaleRatio)}
          </div>
        </div>
      </div>

      {scaleRatio < 1 && (
        <div className="flex items-start gap-2 p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 rounded-lg text-xs">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <span className="text-amber-800 dark:text-amber-300">
            Media is scaled down to {Math.round(scaleRatio * 100)}% to fit within the {viewport} slot ({containerWidth}×{containerHeight}px).
          </span>
        </div>
      )}

      {scaleRatio >= 1 && (
        <div className="flex items-start gap-2 p-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-700 rounded-lg text-xs">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
          <span className="text-emerald-800 dark:text-emerald-300">
            Media fits within the {viewport} slot at full size.
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────
export default function AdPreviewModal({
  open,
  onOpenChange,
  adCode = "",
  vastTagUrl = "",
  mediaUrl = "",
  adType = "html",
  nativeContent = null,
  position,
  title = "Ad Preview",
  allowSizingAdjustment = true,
  initialWidth,
  initialHeight,
  onSizingApply,
  onAppearanceApply,
  initialAppearance,
  onSaveAd,
  isSaving = false,
}: AdPreviewModalProps) {
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [selectedPresetName, setSelectedPresetName] = useState<string>("");
  const [controlTab, setControlTab] = useState<"sizing" | "appearance">("sizing");
  
  // Appearance state
  const [appearance, setAppearance] = useState<AppearanceSettings>(
    initialAppearance || DEFAULT_APPEARANCE
  );

  // ── Per-viewport independent sizing ───────────────────
  const [desktopSizing, setDesktopSizing] = useState<PerViewportSizing>({
    width: 728, height: 90, paddingH: 0, paddingV: 0, marginH: 0, marginV: 0,
  });
  const [tabletSizing, setTabletSizing] = useState<PerViewportSizing>({
    width: 468, height: 60, paddingH: 0, paddingV: 0, marginH: 0, marginV: 0,
  });
  const [mobileSizing, setMobileSizing] = useState<PerViewportSizing>({
    width: 320, height: 50, paddingH: 0, paddingV: 0, marginH: 0, marginV: 0,
  });

  const sizingMap: Record<Viewport, [PerViewportSizing, React.Dispatch<React.SetStateAction<PerViewportSizing>>]> = {
    desktop: [desktopSizing, setDesktopSizing],
    tablet: [tabletSizing, setTabletSizing],
    mobile: [mobileSizing, setMobileSizing],
  };

  const [currentSizing, setCurrentSizing] = sizingMap[viewport];

  // ── Load container dimensions from Settings Panel (localStorage) ───────────────────────────────────
  const [containerSizing, setContainerSizing] = useState<{
    desktop: { width: number; height: number };
    tablet: { width: number; height: number };
    mobile: { width: number; height: number };
  } | null>(null);

  useEffect(() => {
    if (position) {
      const saved = localStorage.getItem("adSlotSizingSettings");
      if (saved) {
        try {
          const allSizing = JSON.parse(saved);
          if (allSizing[position]) {
            setContainerSizing(allSizing[position]);
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
        } catch (e) {
          console.error("Failed to load slot sizing:", e);
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
  }, [position, open]); // Re-load when modal opens

  // ── Position config (for fallback and creative defaults) ───────────────────────────────────
  const posConfig = position ? POSITION_SIZE_CONFIG[position] : null;

  // ── Container dimensions for active viewport (from Settings or fallback) ─────────
  const containerWidth = useMemo(() => {
    if (containerSizing) {
      return viewport === "desktop" ? containerSizing.desktop.width
        : viewport === "tablet" ? containerSizing.tablet.width
        : containerSizing.mobile.width;
    }
    if (posConfig) {
      return viewport === "desktop" ? posConfig.containerDesktop.width
        : viewport === "tablet" ? posConfig.containerTablet.width
        : posConfig.containerMobile.width;
    }
    return currentSizing.width + 20;
  }, [containerSizing, posConfig, viewport, currentSizing.width]);

  const containerHeight = useMemo(() => {
    if (containerSizing) {
      return viewport === "desktop" ? containerSizing.desktop.height
        : viewport === "tablet" ? containerSizing.tablet.height
        : containerSizing.mobile.height;
    }
    if (posConfig) {
      return viewport === "desktop" ? posConfig.containerDesktop.height
        : viewport === "tablet" ? posConfig.containerTablet.height
        : posConfig.containerMobile.height;
    }
    return currentSizing.height + 20;
  }, [containerSizing, posConfig, viewport, currentSizing.height]);

  // ── Fit status for active viewport ────────────────────
  const fitStatus = useMemo(
    () => getCreativeFitStatus(currentSizing.width, currentSizing.height, containerWidth, containerHeight),
    [currentSizing.width, currentSizing.height, containerWidth, containerHeight]
  );

  const matchedPreset = useMemo(
    () => findMatchingPreset(currentSizing.width, currentSizing.height),
    [currentSizing.width, currentSizing.height]
  );

  // ── Overall responsive fit (uses desktop dimensions) ──
  const responsiveFit = useMemo(
    () => checkResponsiveFit(desktopSizing.width, desktopSizing.height, findMatchingPreset(desktopSizing.width, desktopSizing.height)),
    [desktopSizing.width, desktopSizing.height]
  );

  // ── Initialize from position config ───────────────────
  useEffect(() => {
    if (posConfig) {
      setDesktopSizing((s) => ({ ...s, width: initialWidth || posConfig.desktop.width, height: initialHeight || posConfig.desktop.height }));
      setTabletSizing((s) => ({ ...s, width: posConfig.tablet.width, height: posConfig.tablet.height }));
      setMobileSizing((s) => ({ ...s, width: posConfig.mobile.width, height: posConfig.mobile.height }));
    } else if (initialWidth && initialHeight) {
      setDesktopSizing((s) => ({ ...s, width: initialWidth, height: initialHeight }));
      setTabletSizing((s) => ({ ...s, width: Math.min(initialWidth, 468), height: initialHeight }));
      setMobileSizing((s) => ({ ...s, width: Math.min(initialWidth, 320), height: Math.min(initialHeight, 100) }));
    }
  }, [initialWidth, initialHeight, posConfig]);

  // ── Preset selection (applies to active viewport) ─────
  const handlePresetSelect = useCallback((presetName: string) => {
    const preset = AD_SIZE_PRESETS.find((p) => p.name === presetName);
    if (preset) {
      setCurrentSizing((s) => ({ ...s, width: preset.width, height: preset.height }));
      setSelectedPresetName(preset.name);
    }
  }, [setCurrentSizing]);

  // ── Reset active viewport to defaults ─────────────────
  const handleReset = useCallback(() => {
    if (posConfig) {
      const defaults = viewport === "desktop" ? posConfig.desktop : viewport === "tablet" ? posConfig.tablet : posConfig.mobile;
      setCurrentSizing({ width: defaults.width, height: defaults.height, paddingH: 0, paddingV: 0, marginH: 0, marginV: 0 });
    } else {
      setCurrentSizing({ width: 300, height: 250, paddingH: 0, paddingV: 0, marginH: 0, marginV: 0 });
    }
    setSelectedPresetName("");
  }, [posConfig, viewport, setCurrentSizing]);

  // ── Apply sizing ──────────────────────────────────────
  const handleApply = useCallback(() => {
    onSizingApply?.({
      desktop: desktopSizing,
      tablet: tabletSizing,
      mobile: mobileSizing,
      presetName: selectedPresetName || undefined,
    });
  }, [desktopSizing, tabletSizing, mobileSizing, selectedPresetName, onSizingApply]);

  // ── Max slider values ─────────────────────────────
  const maxWidth = viewport === "mobile" ? 480 : viewport === "tablet" ? 768 : 1200;
  const maxHeight = viewport === "mobile" ? 600 : viewport === "tablet" ? 800 : 800;

  // ── Viewport scale for preview iframe ─────────────
  const previewScale = useMemo(() => {
    const containerMaxWidth = 640;
    const viewportW = VIEWPORT_WIDTHS[viewport];
    return viewportW > containerMaxWidth ? containerMaxWidth / viewportW : 1;
  }, [viewport]);

  // ── Build preview content ─────────────────────────
  const previewContent = useMemo(() => {
    const w = currentSizing.width;
    const h = currentSizing.height;
    const pH = currentSizing.paddingH;
    const pV = currentSizing.paddingV;
    const mH = currentSizing.marginH;
    const mV = currentSizing.marginV;
    const paddingStr = `${pV}px ${pH}px`;
    const marginStr = `${mV}px ${mH}px`;

    // Appearance styles
    const borderStyle = appearance.borderStyle !== "none" 
      ? `${appearance.borderWidth}px ${appearance.borderStyle} ${appearance.borderColor}`
      : "none";
    const bgColor = appearance.backgroundColor;
    const radius = `${appearance.borderRadius}px`;
    const shadow = appearance.boxShadow;

    // Close button position styles
    const closeButtonPos: Record<string, string> = {
      "top-right": "top:8px;right:8px;",
      "top-left": "top:8px;left:8px;",
      "bottom-right": "bottom:8px;right:8px;",
      "bottom-left": "bottom:8px;left:8px;",
    };

    const containerStyles = `border:${borderStyle};background:${bgColor};border-radius:${radius};box-shadow:${shadow};position:relative;`;

    if (adType === "vast" && vastTagUrl) {
      return `
        <div style="width:${w}px;height:${h}px;padding:${paddingStr};margin:${marginStr};${containerStyles}">
          <div style="background:#1a1a2e;color:#e0e0e0;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:8px;font-family:system-ui;height:100%;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            <p style="margin-top:12px;font-size:14px;font-weight:600;">VAST Pre-Roll Ad</p>
            <p style="margin-top:4px;font-size:11px;opacity:0.7;max-width:80%;text-align:center;word-break:break-all;">${vastTagUrl.substring(0, 80)}…</p>
            <p style="margin-top:8px;font-size:10px;color:#ef4444;">Requires VAST-capable player (Google IMA SDK)</p>
          </div>
          ${appearance.showInfoIcon ? `<button style="position:absolute;top:8px;left:8px;width:20px;height:20px;border-radius:50%;background:#e5e7eb;display:flex;align-items:center;justify-content:center;border:none;cursor:pointer;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4b5563" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></button>` : ""}
          ${appearance.showCloseButton ? `<button style="position:absolute;${closeButtonPos[appearance.closeButtonPosition]}width:24px;height:24px;border-radius:50%;background:#1f2937;display:flex;align-items:center;justify-content:center;border:none;cursor:pointer;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>` : ""}
        </div>`;
    }

    if (adType === "audio" && mediaUrl) {
      return `
        <div style="width:${w}px;padding:${paddingStr};margin:${marginStr};${containerStyles}">
          <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);color:#e0e0e0;border-radius:12px;font-family:system-ui;padding:20px;text-align:center;">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
            <p style="margin-top:8px;font-size:13px;font-weight:600;">Audio Ad</p>
            <audio controls style="width:100%;margin-top:12px;"><source src="${mediaUrl}" type="audio/mpeg">Your browser does not support audio.</audio>
          </div>
          ${appearance.showInfoIcon ? `<button style="position:absolute;top:8px;left:8px;width:20px;height:20px;border-radius:50%;background:#e5e7eb;display:flex;align-items:center;justify-content:center;border:none;cursor:pointer;z-index:10;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4b5563" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></button>` : ""}
          ${appearance.showCloseButton ? `<button style="position:absolute;${closeButtonPos[appearance.closeButtonPosition]}width:24px;height:24px;border-radius:50%;background:#1f2937;display:flex;align-items:center;justify-content:center;border:none;cursor:pointer;z-index:10;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>` : ""}
        </div>`;
    }

    if ((adType === "image" || adType === "video") && mediaUrl) {
      const isVideo = /\.(mp4|webm|mov)$/i.test(mediaUrl) || adType === "video";
      // Use container dimensions for the wrapper
      const wrapperW = w;
      const wrapperH = h;
      if (isVideo) {
        return `
          <div style="width:${wrapperW}px;height:${wrapperH}px;padding:${paddingStr};margin:${marginStr};overflow:hidden;display:flex;align-items:center;justify-content:center;${containerStyles}">
            <video src="${mediaUrl}" style="max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;border-radius:8px;background:#000;display:block;" controls autoplay muted loop></video>
            ${appearance.showInfoIcon ? `<button style="position:absolute;top:8px;left:8px;width:20px;height:20px;border-radius:50%;background:#e5e7eb;display:flex;align-items:center;justify-content:center;border:none;cursor:pointer;z-index:10;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4b5563" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></button>` : ""}
            ${appearance.showCloseButton ? `<button style="position:absolute;${closeButtonPos[appearance.closeButtonPosition]}width:24px;height:24px;border-radius:50%;background:#1f2937;display:flex;align-items:center;justify-content:center;border:none;cursor:pointer;z-index:10;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>` : ""}
          </div>`;
      }
      return `
        <div style="width:${wrapperW}px;height:${wrapperH}px;padding:${paddingStr};margin:${marginStr};overflow:hidden;display:flex;align-items:center;justify-content:center;${containerStyles}">
          <img src="${mediaUrl}" alt="Ad Preview" style="max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;border-radius:8px;background:#f5f5f5;display:block;" />
          ${appearance.showInfoIcon ? `<button style="position:absolute;top:8px;left:8px;width:20px;height:20px;border-radius:50%;background:#e5e7eb;display:flex;align-items:center;justify-content:center;border:none;cursor:pointer;z-index:10;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4b5563" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></button>` : ""}
          ${appearance.showCloseButton ? `<button style="position:absolute;${closeButtonPos[appearance.closeButtonPosition]}width:24px;height:24px;border-radius:50%;background:#1f2937;display:flex;align-items:center;justify-content:center;border:none;cursor:pointer;z-index:10;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>` : ""}
        </div>`;
    }

    if (adCode) {
      return `
        <div style="width:${w}px;min-height:${h}px;padding:${paddingStr};margin:${marginStr};overflow:hidden;${containerStyles}">
          ${adCode}
          ${appearance.showInfoIcon ? `<button style="position:absolute;top:8px;left:8px;width:20px;height:20px;border-radius:50%;background:#e5e7eb;display:flex;align-items:center;justify-content:center;border:none;cursor:pointer;z-index:10;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4b5563" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></button>` : ""}
          ${appearance.showCloseButton ? `<button style="position:absolute;${closeButtonPos[appearance.closeButtonPosition]}width:24px;height:24px;border-radius:50%;background:#1f2937;display:flex;align-items:center;justify-content:center;border:none;cursor:pointer;z-index:10;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>` : ""}
        </div>`;
    }

    if (adType === "native_feed" && nativeContent) {
      // For native ads, we don't return HTML string because we'll render a React component instead
      return null;
    }

    return `
      <div style="width:${w}px;height:${h}px;padding:${paddingStr};margin:${marginStr};${containerStyles}">
        <div style="background:repeating-linear-gradient(45deg,#f0f0f0,#f0f0f0 10px,#e0e0e0 10px,#e0e0e0 20px);border-radius:8px;display:flex;align-items:center;justify-content:center;font-family:system-ui;color:#888;height:100%;">
          <p style="font-size:14px;">No ad content to preview</p>
        </div>
        ${appearance.showInfoIcon ? `<button style="position:absolute;top:8px;left:8px;width:20px;height:20px;border-radius:50%;background:#e5e7eb;display:flex;align-items:center;justify-content:center;border:none;cursor:pointer;z-index:10;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4b5563" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></button>` : ""}
        ${appearance.showCloseButton ? `<button style="position:absolute;${closeButtonPos[appearance.closeButtonPosition]}width:24px;height:24px;border-radius:50%;background:#1f2937;display:flex;align-items:center;justify-content:center;border:none;cursor:pointer;z-index:10;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>` : ""}
      </div>`;
  }, [adType, adCode, vastTagUrl, mediaUrl, nativeContent, currentSizing, containerWidth, containerHeight, appearance]);

  const iframeSrcDoc = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      display: flex; justify-content: center; align-items: flex-start;
      min-height: 100vh; padding: 20px;
      background: repeating-conic-gradient(#f5f5f5 0% 25%, transparent 0% 50%) 50% / 20px 20px;
      font-family: system-ui, -apple-system, sans-serif;
    }
    @media (prefers-color-scheme: dark) {
      body { background: repeating-conic-gradient(#222 0% 25%, transparent 0% 50%) 50% / 20px 20px; }
    }
    .container-outline {
      border: 2px dashed rgba(239, 68, 68, 0.4); border-radius: 12px;
      padding: 10px; position: relative;
    }
    .container-label {
      position: absolute; top: -10px; left: 12px;
      background: #ef4444; color: white; font-size: 10px;
      padding: 2px 8px; border-radius: 4px; font-weight: 600;
    }
    .ad-label {
      text-align: center; font-size: 10px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.05em;
      color: #888; margin-bottom: 8px;
    }
  </style>
</head>
<body>
  <div class="container-outline" style="width:${containerWidth}px;min-height:${containerHeight}px;">
    <div class="container-label">Container ${containerWidth}×${containerHeight}</div>
    ${appearance.showLabel ? `<div class="ad-label">${appearance.labelText}</div>` : ""}
    ${previewContent}
  </div>
</body>
</html>`;

  // ── Grouped presets by category ────────────────────
  const groupedPresets = useMemo(() => {
    const groups: Record<string, AdSizePreset[]> = {};
    for (const p of AD_SIZE_PRESETS) {
      if (!groups[p.category]) groups[p.category] = [];
      groups[p.category].push(p);
    }
    return groups;
  }, []);

  const isMediaType = adType === "image" || adType === "video";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Maximize2 className="h-5 w-5 text-red-500" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            {position && posConfig
              ? `Position: ${position} — ${posConfig.label}`
              : "Preview and adjust ad sizing before saving"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 mt-4">
          {/* ── Left: Preview Area ──────────────────────────── */}
          <div className="space-y-4">
            {/* Viewport selector */}
            <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
              {(["desktop", "tablet", "mobile"] as const).map((vp) => (
                <button
                  key={vp}
                  onClick={() => setViewport(vp)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    viewport === vp
                      ? "bg-red-600 text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-gray-700"
                  )}
                >
                  {VIEWPORT_ICONS[vp]}
                  <span className="capitalize">{vp}</span>
                  <span className="text-[10px] opacity-70">{VIEWPORT_WIDTHS[vp]}px</span>
                </button>
              ))}
            </div>

            {/* Fit status row */}
            <div className="flex items-center gap-3 flex-wrap">
              <FitStatusBadge status={fitStatus} />
              {matchedPreset && (
                <Badge variant="outline" className="text-xs text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600">
                  {matchedPreset.iabName} ({matchedPreset.width}×{matchedPreset.height})
                </Badge>
              )}
              <span className="text-xs text-gray-600 dark:text-gray-400 ml-auto font-mono">
                Creative: {currentSizing.width}×{currentSizing.height} · Container: {containerWidth}×{containerHeight}
              </span>
            </div>

            {/* Preview iframe */}
            <div
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-900/50"
              style={{ maxWidth: `${VIEWPORT_WIDTHS[viewport] * previewScale + 40}px`, margin: "0 auto" }}
            >
              <div className="bg-gray-100 dark:bg-gray-800 px-3 py-1.5 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <span className="text-[10px] text-gray-500 dark:text-gray-500 flex-1 text-center font-mono">
                  {viewport} preview — {VIEWPORT_WIDTHS[viewport]}px viewport
                </span>
              </div>
              <div
                style={{
                  width: `${VIEWPORT_WIDTHS[viewport]}px`,
                  transformOrigin: "top left",
                  height: adType === "native_feed" ? "auto" : `${Math.max(containerHeight + 60, 200) * previewScale}px`,
                  transform: adType === "native_feed" ? "none" : `scale(${previewScale})`,
                }}
                className={cn(adType === "native_feed" && "p-6 mx-auto")}
              >
                {adType === "native_feed" && nativeContent ? (
                  <div className={cn(
                    "mx-auto",
                    viewport === "mobile" ? "max-w-[375px]" : viewport === "tablet" ? "max-w-[600px]" : "max-w-[800px]"
                  )}>
                    <div className="text-[10px] font-bold text-orange-600 mb-2 uppercase tracking-wider flex items-center gap-1">
                      <Newspaper className="h-3 w-3" /> Native Feed Ad Preview
                    </div>
                    <NativeAdCard
                      ad={{ _id: "preview", nativeContent }}
                      variant={nativeContent.layout || (viewport === "desktop" ? "grid" : "list")}
                    />
                    <p className="mt-4 text-[10px] text-muted-foreground text-center italic">
                      Note: Native ads automatically adapt to the feed width and article styling.
                    </p>
                  </div>
                ) : (
                  <iframe
                    srcDoc={iframeSrcDoc}
                    className="w-full border-0"
                    style={{
                      width: `${VIEWPORT_WIDTHS[viewport]}px`,
                      height: `${Math.max(containerHeight + 80, 300)}px`,
                    }}
                    sandbox="allow-scripts"
                    title="Ad Preview"
                  />
                )}
              </div>
            </div>

            {/* Responsive fit indicators */}
            <ResponsiveFitIndicator result={responsiveFit} />

            {/* Error/warning messages */}
            {fitStatus === "oversized" && (
              <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-300 dark:border-red-800 rounded-lg text-sm">
                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-red-800 dark:text-red-300">
                    Creative exceeds container bounds
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                    The ad creative ({currentSizing.width}×{currentSizing.height}) is larger than the {viewport} container ({containerWidth}×{containerHeight}).
                    Reduce the size or choose a smaller preset.
                  </p>
                </div>
              </div>
            )}

            {/* Media scaling tabs — only for image/video */}
            {isMediaType && mediaUrl && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <Tabs defaultValue="desktop">
                  <TabsList className="w-full grid grid-cols-3 bg-gray-100 dark:bg-gray-800 rounded-none">
                    <TabsTrigger value="desktop" className="text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100">
                      <Monitor className="h-3 w-3 mr-1" /> Desktop
                    </TabsTrigger>
                    <TabsTrigger value="tablet" className="text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100">
                      <Tablet className="h-3 w-3 mr-1" /> Tablet
                    </TabsTrigger>
                    <TabsTrigger value="mobile" className="text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100">
                      <Smartphone className="h-3 w-3 mr-1" /> Mobile
                    </TabsTrigger>
                  </TabsList>
                  {(["desktop", "tablet", "mobile"] as const).map((vp) => {
                    const vpConfig = posConfig
                      ? vp === "desktop" ? posConfig.containerDesktop : vp === "tablet" ? posConfig.containerTablet : posConfig.containerMobile
                      : { width: sizingMap[vp][0].width + 20, height: sizingMap[vp][0].height + 20 };
                    return (
                      <TabsContent key={vp} value={vp} className="p-3 mt-0">
                        <MediaScalingTab
                          viewport={vp}
                          sizing={sizingMap[vp][0]}
                          containerWidth={vpConfig.width}
                          containerHeight={vpConfig.height}
                          mediaUrl={mediaUrl}
                          adType={adType}
                        />
                      </TabsContent>
                    );
                  })}
                </Tabs>
              </div>
            )}
          </div>

          {/* ── Right: Sizing & Appearance Controls ─────── */}
          {allowSizingAdjustment && (
            <div className="space-y-5 border-l border-gray-200 dark:border-gray-700 pl-6">
              {/* Tab Selector */}
              <Tabs value={controlTab} onValueChange={(v) => setControlTab(v as "sizing" | "appearance")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="sizing" className="text-xs">
                    <Maximize2 className="h-3 w-3 mr-1" /> Sizing
                  </TabsTrigger>
                  <TabsTrigger value="appearance" className="text-xs">
                    <Palette className="h-3 w-3 mr-1" /> Appearance
                  </TabsTrigger>
                </TabsList>

                {/* ── SIZING TAB ─────────────────────────────── */}
                <TabsContent value="sizing" className="space-y-5 mt-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      Sizing — <span className="capitalize text-red-600">{viewport}</span>
                    </h3>
                    <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs h-7 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
                      <RotateCcw className="mr-1 h-3 w-3" /> Reset
                    </Button>
                  </div>

                  <p className="text-[11px] text-gray-500 dark:text-gray-500 -mt-3">
                    These controls only affect the <strong className="text-gray-800 dark:text-gray-300">{viewport}</strong> viewport. Switch tabs above to adjust other screen sizes independently.
                  </p>

              {/* Preset selector */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-800 dark:text-gray-200">Size Preset</Label>
                <Select value={selectedPresetName} onValueChange={handlePresetSelect}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Choose a preset size..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(groupedPresets).map(([category, presets]) => (
                      <React.Fragment key={category}>
                        <div className="px-2 py-1.5 text-[10px] font-bold text-gray-500 dark:text-gray-500 uppercase tracking-wider">
                          {category}
                        </div>
                        {presets.map((p) => (
                          <SelectItem key={p.name} value={p.name} className="text-xs">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-900 dark:text-gray-100">{p.name}</span>
                              <span className="text-gray-500 dark:text-gray-500 font-mono">{p.width}×{p.height}</span>
                              {p.mobileCompatible && <Smartphone className="h-3 w-3 text-emerald-500" />}
                            </div>
                          </SelectItem>
                        ))}
                      </React.Fragment>
                    ))}
                  </SelectContent>
                </Select>

                {/* Position-recommended presets */}
                {posConfig && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-gray-700 dark:text-gray-300 uppercase tracking-wider font-bold block">
                      Recommended for this position
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {posConfig.recommendedPresets.map((name) => {
                        const p = AD_SIZE_PRESETS.find((s) => s.name === name);
                        if (!p) return null;
                        return (
                          <button
                            key={name}
                            onClick={() => handlePresetSelect(name)}
                            className={cn(
                              "text-[11px] px-2.5 py-1 rounded-md border transition-all font-medium",
                              selectedPresetName === name
                                ? "bg-red-600 text-white border-red-600"
                                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-red-400 hover:text-red-600 dark:hover:text-red-400"
                            )}
                          >
                            {p.width}×{p.height}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Width slider */}
              <div className="space-y-2">
                <DimensionBar label="Width" value={currentSizing.width} maxValue={maxWidth} containerValue={containerWidth} />
                <Slider
                  value={[currentSizing.width]}
                  onValueChange={([v]) => setCurrentSizing((s) => ({ ...s, width: v }))}
                  min={50} max={maxWidth} step={1}
                />
              </div>

              {/* Height slider */}
              <div className="space-y-2">
                <DimensionBar label="Height" value={currentSizing.height} maxValue={maxHeight} containerValue={containerHeight} />
                <Slider
                  value={[currentSizing.height]}
                  onValueChange={([v]) => setCurrentSizing((s) => ({ ...s, height: v }))}
                  min={30} max={maxHeight} step={1}
                />
              </div>

              {/* Padding — H and V */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100">Padding</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">Horizontal</span>
                      <span className="font-mono text-gray-500 dark:text-gray-500">{currentSizing.paddingH}px</span>
                    </div>
                    <Slider
                      value={[currentSizing.paddingH]}
                      onValueChange={([v]) => setCurrentSizing((s) => ({ ...s, paddingH: v }))}
                      min={0} max={40} step={1}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">Vertical</span>
                      <span className="font-mono text-gray-500 dark:text-gray-500">{currentSizing.paddingV}px</span>
                    </div>
                    <Slider
                      value={[currentSizing.paddingV]}
                      onValueChange={([v]) => setCurrentSizing((s) => ({ ...s, paddingV: v }))}
                      min={0} max={40} step={1}
                    />
                  </div>
                </div>
              </div>

              {/* Margin — H and V */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100">Margin</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">Horizontal</span>
                      <span className="font-mono text-gray-500 dark:text-gray-500">{currentSizing.marginH}px</span>
                    </div>
                    <Slider
                      value={[currentSizing.marginH]}
                      onValueChange={([v]) => setCurrentSizing((s) => ({ ...s, marginH: v }))}
                      min={0} max={40} step={1}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">Vertical</span>
                      <span className="font-mono text-gray-500 dark:text-gray-500">{currentSizing.marginV}px</span>
                    </div>
                    <Slider
                      value={[currentSizing.marginV]}
                      onValueChange={([v]) => setCurrentSizing((s) => ({ ...s, marginV: v }))}
                      min={0} max={40} step={1}
                    />
                  </div>
                </div>
              </div>

              {/* Matched preset info */}
              {matchedPreset && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-xs space-y-1">
                  <div className="flex items-center gap-1 font-semibold text-gray-900 dark:text-gray-100">
                    <Info className="h-3 w-3 text-blue-500" />
                    {matchedPreset.iabName}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">{matchedPreset.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {matchedPreset.mobileCompatible && (
                      <Badge variant="outline" className="text-[10px] h-5 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600">
                        <Smartphone className="mr-1 h-2.5 w-2.5" /> Mobile OK
                      </Badge>
                    )}
                    {matchedPreset.tabletCompatible && (
                      <Badge variant="outline" className="text-[10px] h-5 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600">
                        <Tablet className="mr-1 h-2.5 w-2.5" /> Tablet OK
                      </Badge>
                    )}
                  </div>
                </div>
              )}
                </TabsContent>

                {/* ── APPEARANCE TAB ────────────────────────────── */}
                <TabsContent value="appearance" className="space-y-5 mt-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      Appearance Settings
                    </h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setAppearance(DEFAULT_APPEARANCE)} 
                      className="text-xs h-7 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    >
                      <RotateCcw className="mr-1 h-3 w-3" /> Reset
                    </Button>
                  </div>

                  <p className="text-[11px] text-gray-500 dark:text-gray-500 -mt-3">
                    Customize the visual appearance of the ad container including borders, background, and controls.
                  </p>

                  {/* Border Settings */}
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold text-gray-800 dark:text-gray-200">Border</Label>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[11px] text-gray-600 dark:text-gray-400">Style</Label>
                        <Select
                          value={appearance.borderStyle}
                          onValueChange={(value: any) => setAppearance({ ...appearance, borderStyle: value })}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="solid">Solid</SelectItem>
                            <SelectItem value="dashed">Dashed</SelectItem>
                            <SelectItem value="dotted">Dotted</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[11px] text-gray-600 dark:text-gray-400">Width (px)</Label>
                        <div className="flex items-center gap-2">
                          <Slider
                            value={[appearance.borderWidth]}
                            onValueChange={([v]) => setAppearance({ ...appearance, borderWidth: v })}
                            max={10}
                            step={1}
                            className="flex-1"
                            disabled={appearance.borderStyle === "none"}
                          />
                          <span className="text-xs font-mono w-6 text-gray-600 dark:text-gray-400">{appearance.borderWidth}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[11px] text-gray-600 dark:text-gray-400">Color</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="color"
                            value={appearance.borderColor}
                            onChange={(e) => setAppearance({ ...appearance, borderColor: e.target.value })}
                            className="w-12 h-8 p-1"
                            disabled={appearance.borderStyle === "none"}
                          />
                          <Input
                            type="text"
                            value={appearance.borderColor}
                            onChange={(e) => setAppearance({ ...appearance, borderColor: e.target.value })}
                            className="flex-1 h-8 font-mono text-xs"
                            disabled={appearance.borderStyle === "none"}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[11px] text-gray-600 dark:text-gray-400">Radius (px)</Label>
                        <div className="flex items-center gap-2">
                          <Slider
                            value={[appearance.borderRadius]}
                            onValueChange={([v]) => setAppearance({ ...appearance, borderRadius: v })}
                            max={50}
                            step={1}
                            className="flex-1"
                          />
                          <span className="text-xs font-mono w-6 text-gray-600 dark:text-gray-400">{appearance.borderRadius}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Background & Shadow */}
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold text-gray-800 dark:text-gray-200">Background & Shadow</Label>
                    
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-gray-600 dark:text-gray-400">Background Color</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          value={appearance.backgroundColor}
                          onChange={(e) => setAppearance({ ...appearance, backgroundColor: e.target.value })}
                          className="w-12 h-8 p-1"
                        />
                        <Input
                          type="text"
                          value={appearance.backgroundColor}
                          onChange={(e) => setAppearance({ ...appearance, backgroundColor: e.target.value })}
                          className="flex-1 h-8 font-mono text-xs"
                          placeholder="transparent or #ffffff"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-gray-600 dark:text-gray-400">Box Shadow</Label>
                      <Select
                        value={appearance.boxShadow}
                        onValueChange={(value) => setAppearance({ ...appearance, boxShadow: value })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SHADOW_PRESETS.map((preset) => (
                            <SelectItem key={preset.value} value={preset.value} className="text-xs">
                              {preset.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Label & Controls have been moved to Global Settings */}
                  <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-xs">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                      <div className="text-blue-800 dark:text-blue-300">
                        <p className="font-bold mb-1">Global Visibility Rules Apply</p>
                        <p>Ad identification labels, close buttons, and privacy icons are now controlled globally from the <strong>Global Visibility</strong> tab in the main settings. These settings apply automatically when the ad goes live.</p>
                      </div>
                    </div>
                  </div>

                  {/* Apply Appearance Button */}
                  {onAppearanceApply && (
                    <Button
                      onClick={() => onAppearanceApply(appearance)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
                    >
                      Apply Appearance
                    </Button>
                  )}
                </TabsContent>
              </Tabs>

              {/* Apply sizing (if callback exists) */}
              {onSizingApply && (
                <Button
                  onClick={handleApply}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
                  disabled={fitStatus === "oversized"}
                >
                  Apply Sizing Only
                </Button>
              )}

              {/* Save Ad (if callback exists) */}
              {onSaveAd && (
                <Button
                  onClick={onSaveAd}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Ad Configuration"}
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
