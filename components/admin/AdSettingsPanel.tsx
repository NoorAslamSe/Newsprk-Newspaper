"use client";

import * as React from "react";
import { useState } from "react";
import { Settings, Save, RotateCcw, Eye, EyeOff, X as CloseIcon, Info, Monitor, Tablet, Smartphone, Loader2, Heart, BarChart3, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { POSITION_SIZE_CONFIG } from "@/lib/constants/adSizes";

// Import PAGE_CONFIG structure
const PAGE_CONFIG: {
  type: "homepage" | "article" | "category" | "website";
  label: string;
  description: string;
  positions: { id: string; name: string; description: string }[];
}[] = [
  {
    type: "homepage",
    label: "Homepage",
    description: "Ad placements on the main homepage",
    positions: [
      { id: "top-leaderboard", name: "Top Leaderboard", description: "Above the fold, highest visibility" },
      { id: "sticky-footer", name: "Sticky Footer", description: "Persistent at bottom of page" },
      { id: "in-feed-1", name: "In-Feed Native 1", description: "Between Card #3 and #4" },
      { id: "in-feed-2", name: "In-Feed Native 2", description: "Between Card #7 and #8" },
      { id: "in-feed-x", name: "In-Feed Native X", description: "Repeats every 10 cards" },
    ],
  },
  {
    type: "article",
    label: "Article Page",
    description: "Ad placements on article/post pages",
    positions: [
      { id: "top-leaderboard", name: "Top Leaderboard", description: "Above the fold" },
      { id: "atf-rectangle", name: "ATF Rectangle", description: "Highest value position" },
      { id: "sticky-footer", name: "Sticky Footer", description: "Persistent at bottom" },
      { id: "in-content-1", name: "In-Content 1", description: "After Paragraph 2" },
      { id: "in-content-2", name: "In-Content 2", description: "After Paragraph 6" },
      { id: "sidebar-sticky", name: "Sidebar Sticky", description: "Desktop only, follows scroll" },
      { id: "sidebar-infeed", name: "Sidebar In-Feed Native", description: "Native ad in right sidebar" },
    ],
  },
  {
    type: "category",
    label: "Category Page",
    description: "Ad placements on category listing pages",
    positions: [
      { id: "top-leaderboard", name: "Top Leaderboard", description: "Above the fold" },
      { id: "sticky-footer", name: "Sticky Footer", description: "Persistent at bottom" },
      { id: "in-feed-x", name: "In-Feed Ad", description: "Repeats every 8 posts" },
    ],
  },
  {
    type: "website",
    label: "Static/Legal Pages",
    description: "Ad placements on static pages (About, Privacy, etc.)",
    positions: [
      { id: "sticky-footer", name: "Sticky Footer", description: "Persistent at bottom" },
    ],
  },
];
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface AdSettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
  // Advanced Media Styling
  objectFit: "cover" | "contain" | "fill" | "none";
  mediaScale: number;
  containerScale: number;
  padding: { top: number; right: number; bottom: number; left: number };
  margin: { top: number; right: number; bottom: number; left: number };
}

interface SlotSizeConfig {
  desktop: { width: number; height: number };
  tablet: { width: number; height: number };
  mobile: { width: number; height: number };
}

type SlotSizingSettings = Record<string, SlotSizeConfig>;

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
  objectFit: "contain",
  mediaScale: 1,
  containerScale: 1,
  padding: { top: 0, right: 0, bottom: 0, left: 0 },
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
};

const SHADOW_PRESETS = [
  { label: "None", value: "none" },
  { label: "Small", value: "0 1px 3px rgba(0,0,0,0.12)" },
  { label: "Medium", value: "0 4px 6px rgba(0,0,0,0.1)" },
  { label: "Large", value: "0 10px 15px rgba(0,0,0,0.1)" },
  { label: "Extra Large", value: "0 20px 25px rgba(0,0,0,0.15)" },
];

export default function AdSettingsPanel({ open, onOpenChange }: AdSettingsPanelProps) {
  const [appearance, setAppearance] = useState<AppearanceSettings>(DEFAULT_APPEARANCE);
  const [slotSizing, setSlotSizing] = useState<SlotSizingSettings>({});
  const [isSaving, setIsSaving] = useState(false);
  const [editingPosition, setEditingPosition] = useState<string | null>(null);
  const [activePageType, setActivePageType] = useState<"homepage" | "article" | "category" | "website">("homepage");
  const [articles, setArticles] = useState<{ _id: string; title: string }[]>([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [showOtherReasonsDialog, setShowOtherReasonsDialog] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Fetch articles for Article Page tab
  React.useEffect(() => {
    if (activePageType === "article") {
      setIsLoadingArticles(true);
      fetch("/api/articles?limit=50")
        .then(res => res.json())
        .then(data => {
          setArticles(data.items || []);
        })
        .finally(() => setIsLoadingArticles(false));
    }
  }, [activePageType, open]);

  React.useEffect(() => {
    fetch("/api/settings")
      .then(async res => {
        if (!res.ok) {
          // 401 = not authenticated, 403 = forbidden, 500 = server error
          // Fall back to defaults silently — the user is likely already authenticated
          // in the admin area, but the session may not be propagated to this route yet.
          console.warn(`[AdSettingsPanel] GET /api/settings returned ${res.status} — using defaults`);
          initializeSlotSizing();
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (!data) return; // non-ok response already handled above
        const value = data.item || {};
        if (value.adSlotSizing) {
          setSlotSizing(value.adSlotSizing);
        } else {
          initializeSlotSizing();
        }
        
        if (value.adAppearance) {
          setAppearance({
            ...DEFAULT_APPEARANCE,
            ...value.adAppearance,
            padding: { ...DEFAULT_APPEARANCE.padding, ...(value.adAppearance.padding || {}) },
            margin: { ...DEFAULT_APPEARANCE.margin, ...(value.adAppearance.margin || {}) }
          });
        }
      })
      .catch(e => {
        console.error("Failed to load global ad settings:", e);
        initializeSlotSizing();
      });
  }, [open]);

  // Fetch analytics data
  React.useEffect(() => {
    if (open) {
      setIsLoadingAnalytics(true);
      fetch("/api/ads/analytics")
        .then(res => res.json())
        .then(data => setAnalytics(data))
        .catch(e => console.error("Failed to load analytics:", e))
        .finally(() => setIsLoadingAnalytics(false));
    }
  }, [open]);

  const initializeSlotSizing = () => {
    const initialSizing: SlotSizingSettings = {};
    Object.keys(POSITION_SIZE_CONFIG).forEach((position) => {
      const config = POSITION_SIZE_CONFIG[position];
      initialSizing[position] = {
        desktop: { ...config.containerDesktop },
        tablet: { ...config.containerTablet },
        mobile: { ...config.containerMobile },
      };
    });
    setSlotSizing(initialSizing);
  };

  const updateSlotSize = (posId: string, viewport: keyof SlotSizeConfig, field: 'width' | 'height', value: number) => {
    setSlotSizing(prev => ({
      ...prev,
      [posId]: {
        ...prev[posId],
        [viewport]: {
          ...prev[posId][viewport],
          [field]: value
        }
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save settings to database
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adAppearance: appearance,
          adSlotSizing: slotSizing
        })
      });
      if (!res.ok) throw new Error("Failed to save settings");

      // Also keep in localStorage as a backup / fast load
      localStorage.setItem("adAppearanceSettings", JSON.stringify(appearance));
      localStorage.setItem("adSlotSizingSettings", JSON.stringify(slotSizing));
      
      toast.success("Settings saved successfully!");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = async () => {
    setIsSaving(true);
    try {
      // 1. Reset local state
      const defaultSizing: SlotSizingSettings = {};
      Object.keys(POSITION_SIZE_CONFIG).forEach((position) => {
        const config = POSITION_SIZE_CONFIG[position];
        defaultSizing[position] = {
          desktop: { ...config.containerDesktop },
          tablet: { ...config.containerTablet },
          mobile: { ...config.containerMobile },
        };
      });

      setAppearance(DEFAULT_APPEARANCE);
      setSlotSizing(defaultSizing);
      setActivePageType("homepage");
      setEditingPosition(null);

      // 2. Persist to database immediately
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adAppearance: DEFAULT_APPEARANCE,
          adSlotSizing: defaultSizing
        })
      });
      if (!res.ok) throw new Error("Failed to persist reset");

      // 3. Clear local storage
      localStorage.removeItem("adAppearanceSettings");
      localStorage.removeItem("adSlotSizingSettings");

      toast.success("All settings have been permanently factory reset");
      setShowResetConfirm(false);
    } catch (error) {
      console.error("Reset failed:", error);
      toast.error("Failed to reset settings to defaults");
    } finally {
      setIsSaving(false);
    }
  };

  // Load settings on mount (moved entirely into the single fetch above)

  // Preview styles
  const previewStyle: React.CSSProperties = {
    border: appearance.borderStyle !== "none" 
      ? `${appearance.borderWidth}px ${appearance.borderStyle} ${appearance.borderColor}`
      : "none",
    backgroundColor: appearance.backgroundColor,
    borderRadius: `${appearance.borderRadius}px`,
    boxShadow: appearance.boxShadow,
    position: "relative",
    padding: `${appearance.padding?.top ?? 0}px ${appearance.padding?.right ?? 0}px ${appearance.padding?.bottom ?? 0}px ${appearance.padding?.left ?? 0}px`,
    margin: `${appearance.margin?.top ?? 0}px ${appearance.margin?.right ?? 0}px ${appearance.margin?.bottom ?? 0}px ${appearance.margin?.left ?? 0}px`,
    transform: `scale(${appearance.containerScale})`,
    transformOrigin: "center top",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Settings className="h-5 w-5 text-red-500" />
            Ad Campaign Settings
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Configure global appearance, sizing, and tracking settings for all ad slots
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="appearance" className="mt-4">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-gray-800 p-1 border border-gray-200 dark:border-gray-700">
            <TabsTrigger value="appearance" className="data-[state=active]:bg-[#ef4444] data-[state=active]:text-white text-xs lg:text-sm">Appearance</TabsTrigger>
            <TabsTrigger value="sizing" className="data-[state=active]:bg-[#ef4444] data-[state=active]:text-white text-xs lg:text-sm">Sizing & Scaling</TabsTrigger>
            <TabsTrigger value="global" className="data-[state=active]:bg-[#ef4444] data-[state=active]:text-white text-xs lg:text-sm">Global Visibility</TabsTrigger>
            <TabsTrigger value="tracking" className="data-[state=active]:bg-[#ef4444] data-[state=active]:text-white text-xs lg:text-sm">Analytics</TabsTrigger>
          </TabsList>

          {/* ─── APPEARANCE TAB ─────────────────────────────────── */}
          <TabsContent value="appearance" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
              {/* Left: Controls */}
              <div className="space-y-6">
                {/* Border Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Border Settings</CardTitle>
                    <CardDescription>
                      Configure the border style for ad containers
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Border Style</Label>
                        <Select
                          value={appearance.borderStyle}
                          onValueChange={(value: any) =>
                            setAppearance({ ...appearance, borderStyle: value })
                          }
                        >
                          <SelectTrigger>
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

                      <div className="space-y-2">
                        <Label>Border Width (px)</Label>
                        <div className="flex items-center gap-3">
                          <Slider
                            value={[appearance.borderWidth]}
                            onValueChange={([value]) =>
                              setAppearance({ ...appearance, borderWidth: value })
                            }
                            max={10}
                            step={1}
                            className="flex-1"
                            disabled={appearance.borderStyle === "none"}
                          />
                          <span className="text-sm font-mono w-8 text-gray-600 dark:text-gray-400">
                            {appearance.borderWidth}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Border Color</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="color"
                            value={appearance.borderColor}
                            onChange={(e) =>
                              setAppearance({ ...appearance, borderColor: e.target.value })
                            }
                            className="w-16 h-9 p-1"
                            disabled={appearance.borderStyle === "none"}
                          />
                          <Input
                            type="text"
                            value={appearance.borderColor}
                            onChange={(e) =>
                              setAppearance({ ...appearance, borderColor: e.target.value })
                            }
                            className="flex-1 font-mono text-xs"
                            disabled={appearance.borderStyle === "none"}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Border Radius (px)</Label>
                        <div className="flex items-center gap-3">
                          <Slider
                            value={[appearance.borderRadius]}
                            onValueChange={([value]) =>
                              setAppearance({ ...appearance, borderRadius: value })
                            }
                            max={50}
                            step={1}
                            className="flex-1"
                          />
                          <span className="text-sm font-mono w-8 text-gray-600 dark:text-gray-400">
                            {appearance.borderRadius}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Background & Shadow */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Background & Shadow</CardTitle>
                    <CardDescription>
                      Set background color and shadow effects
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Background Color</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          value={appearance.backgroundColor}
                          onChange={(e) =>
                            setAppearance({ ...appearance, backgroundColor: e.target.value })
                          }
                          className="w-16 h-9 p-1"
                        />
                        <Input
                          type="text"
                          value={appearance.backgroundColor}
                          onChange={(e) =>
                            setAppearance({ ...appearance, backgroundColor: e.target.value })
                          }
                          className="flex-1 font-mono text-xs"
                          placeholder="transparent or #ffffff"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Box Shadow</Label>
                      <Select
                        value={appearance.boxShadow}
                        onValueChange={(value) =>
                          setAppearance({ ...appearance, boxShadow: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SHADOW_PRESETS.map((preset) => (
                            <SelectItem key={preset.value} value={preset.value}>
                              {preset.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right: Live Preview */}
              <div className="space-y-4">
                <Card className="sticky top-4">
                  <CardHeader>
                    <CardTitle className="text-base">Live Preview</CardTitle>
                    <CardDescription>
                      See how your ad container will look
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Preview Container */}
                      <div className="p-8 bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center justify-center overflow-hidden">
                        <div style={previewStyle} className="transition-all duration-300">
                          {/* Label Row */}
                          {(appearance.showLabel || appearance.showInfoIcon || appearance.showCloseButton) && (
                            <div className="flex items-center justify-between gap-4 mb-2 min-w-[200px]">
                              {appearance.showInfoIcon ? (
                                <button className="p-1.5 rounded-full bg-white dark:bg-gray-800 text-gray-500 shadow-md border border-gray-100 dark:border-gray-800">
                                  <Info className="h-3 w-3" />
                                </button>
                              ) : <div className="w-5" />}

                              {appearance.showLabel && (
                                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 whitespace-nowrap bg-white/90 dark:bg-gray-800/90 px-4 py-1.5 rounded-full shadow-sm border border-gray-100 dark:border-gray-700">
                                  {appearance.labelText}
                                </div>
                              )}

                              {appearance.showCloseButton ? (
                                <button className="p-1.5 rounded-full bg-white dark:bg-gray-800 text-gray-400 shadow-md border border-gray-100 dark:border-gray-800">
                                  <CloseIcon className="h-3 w-3" />
                                </button>
                              ) : <div className="w-5" />}
                            </div>
                          )}

                          {/* Ad Content Placeholder */}
                          <div className="bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded min-h-[300px] w-full relative overflow-hidden flex items-center justify-center text-gray-600 dark:text-gray-400 text-xs">
                            <div 
                              className="absolute inset-0 bg-red-400/10 flex items-center justify-center border-2 border-dashed border-red-200/50"
                              style={{ 
                                objectFit: appearance.objectFit as any,
                                transform: `scale(${appearance.mediaScale})`,
                              }}
                            >
                              <div className="text-center">
                                <Monitor className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                <p className="font-bold uppercase tracking-tighter text-xl">Preview Content Area</p>
                                <p className="text-[10px] mt-1 opacity-70">Testing Object Fit: {appearance.objectFit}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Preview Info */}
                      <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/50 rounded-lg">
                        <p className="font-semibold text-foreground">Preview Details:</p>
                        <ul className="space-y-0.5 ml-2">
                          <li>• Border: {appearance.borderStyle} {appearance.borderWidth}px</li>
                          <li>• Radius: {appearance.borderRadius}px</li>
                          <li>• Shadow: {SHADOW_PRESETS.find(p => p.value === appearance.boxShadow)?.label}</li>
                          <li>• Label: {appearance.showLabel ? "Visible" : "Hidden"}</li>
                          <li>• Close Button: {appearance.showCloseButton ? "Enabled" : "Disabled"}</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ─── GLOBAL SETTINGS TAB ───────────────────────────── */}
          <TabsContent value="global" className="space-y-6 mt-6">
            <div className="max-w-2xl mx-auto space-y-6">
              <Card className="border-red-100 dark:border-red-900/30">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="h-4 w-4 text-red-500" />
                    Global Ad Visibility & Controls
                  </CardTitle>
                  <CardDescription>These toggles affect all advertisements across your entire platform instantly.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 transition-all hover:shadow-sm">
                      <div className="space-y-1">
                        <Label className="text-sm font-bold">Show Ad Identification Label</Label>
                        <p className="text-xs text-muted-foreground">Standard "Advertisement" text displayed above the ad slot.</p>
                      </div>
                      <Switch
                        checked={appearance.showLabel}
                        onCheckedChange={(checked) => setAppearance({ ...appearance, showLabel: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 transition-all hover:shadow-sm">
                      <div className="space-y-1">
                        <Label className="text-sm font-bold text-blue-600">Global Info Icon (Why this ad?)</Label>
                        <p className="text-xs text-muted-foreground">Enables the privacy and information icon next to labels.</p>
                      </div>
                      <Switch
                        checked={appearance.showInfoIcon}
                        onCheckedChange={(checked) => setAppearance({ ...appearance, showInfoIcon: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 transition-all hover:shadow-sm">
                      <div className="space-y-1">
                        <Label className="text-sm font-bold text-red-600">Global Close Button</Label>
                        <p className="text-xs text-muted-foreground">Allows users to report and hide advertisements they dislike.</p>
                      </div>
                      <Switch
                        checked={appearance.showCloseButton}
                        onCheckedChange={(checked) => setAppearance({ ...appearance, showCloseButton: checked })}
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-gray-800">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-bold text-gray-400">Custom Label Text</Label>
                      <Input
                        value={appearance.labelText}
                        onChange={(e) => setAppearance({ ...appearance, labelText: e.target.value })}
                        placeholder="Advertisement"
                        className="h-10 text-sm font-medium"
                      />
                      <p className="text-[10px] text-gray-400">Default is "ADVERTISEMENT". Changes apply to all slots.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
                <div className="flex gap-3">
                  <div className="p-1 bg-yellow-100 dark:bg-yellow-900/40 rounded shadow-sm">
                    <Info className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-yellow-800 dark:text-yellow-200">System Consistency</p>
                    <p className="text-[11px] text-yellow-700 dark:text-yellow-400 leading-relaxed">
                      Provider-level ads (e.g. Google AdSense) manage their own icons. These settings primarily affect local video, image, and HTML ad snippets.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ─── SIZING & SCALING TAB ───────────────────────── */}
          <TabsContent value="sizing" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 xl:grid-cols-[450px_1fr] gap-6 pb-20">
              <div className="space-y-6">
                {/* 1. Scaling & Media Behavior */}
                <Card className="border-red-100 dark:border-red-900/20 shadow-sm overflow-hidden">
                  <div className="bg-red-50/50 dark:bg-red-950/20 px-4 py-2 border-b border-red-100 dark:border-red-900/30 flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-red-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-red-900 dark:text-red-100">Scaling & Media Fitting</span>
                  </div>
                  <CardContent className="space-y-6 pt-6">
                    {/* Container Scaling */}
                    <div className="space-y-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm font-bold">Global Container Scale</Label>
                        <span className="text-xs font-mono bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-100 px-2 py-0.5 rounded">{(appearance.containerScale * 100).toFixed(0)}%</span>
                      </div>
                      <Slider
                        value={[appearance.containerScale * 100]}
                        onValueChange={([val]) => setAppearance({ ...appearance, containerScale: val / 100 })}
                        min={30}
                        max={150}
                        step={1}
                      />
                      <p className="text-[10px] text-muted-foreground italic">Affects the entire ad slot including border, padding, and labels.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-gray-400">Object Fit</Label>
                        <Select
                          value={appearance.objectFit}
                          onValueChange={(val: any) => setAppearance({ ...appearance, objectFit: val })}
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cover">Cover (Crop)</SelectItem>
                            <SelectItem value="contain">Contain (Fit)</SelectItem>
                            <SelectItem value="fill">Stretch</SelectItem>
                            <SelectItem value="none">Actual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-gray-400">Media Zoom</Label>
                        <div className="flex items-center gap-3">
                          <Slider
                            value={[appearance.mediaScale * 100]}
                            onValueChange={([val]) => setAppearance({ ...appearance, mediaScale: val / 100 })}
                            min={50}
                            max={200}
                            step={1}
                            className="flex-1"
                          />
                          <span className="text-[10px] font-mono w-8">{(appearance.mediaScale * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                       <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Container Spacing Override</Label>
                       <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <span className="text-[9px] text-gray-400 font-bold uppercase block text-center">Padding</span>
                            <div className="grid grid-cols-2 gap-1">
                               {['top', 'bottom', 'left', 'right'].map(s => (
                                 <Input 
                                  key={s} 
                                  type="number" 
                                  placeholder={s[0].toUpperCase()}
                                  value={(appearance.padding as any)[s]}
                                  onChange={(e) => setAppearance({...appearance, padding: {...appearance.padding, [s]: parseInt(e.target.value) || 0}})}
                                  className="h-7 text-[9px] text-center"
                                 />
                               ))}
                            </div>
                         </div>
                         <div className="space-y-2">
                            <span className="text-[9px] text-gray-400 font-bold uppercase block text-center">Margin</span>
                            <div className="grid grid-cols-2 gap-1">
                               {['top', 'bottom', 'left', 'right'].map(s => (
                                 <Input 
                                  key={s} 
                                  type="number" 
                                  placeholder={s[0].toUpperCase()}
                                  value={(appearance.margin as any)[s]}
                                  onChange={(e) => setAppearance({...appearance, margin: {...appearance.margin, [s]: parseInt(e.target.value) || 0}})}
                                  className="h-7 text-[9px] text-center"
                                 />
                               ))}
                            </div>
                         </div>
                       </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 2. Position Viewport Sizing */}
                <Card className="shadow-sm">
                  <CardHeader className="py-4 font-bold border-b bg-gray-50/50 dark:bg-gray-900/50">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <Tablet className="h-4 w-4 text-gray-400" />
                         Viewport Specifics
                      </div>
                      <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{activePageType}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="flex border-b overflow-x-auto scrollbar-hide bg-white dark:bg-black">
                      {PAGE_CONFIG.map((config) => (
                        <button
                          key={config.type}
                          onClick={() => setActivePageType(config.type)}
                          className={cn(
                            "px-4 py-2 text-[10px] font-black tracking-tighter transition-colors border-b-4 uppercase",
                            activePageType === config.type
                              ? "border-red-500 text-red-600 bg-red-50/20"
                              : "border-transparent text-gray-500 hover:text-gray-700"
                          )}
                        >
                          {config.label}
                        </button>
                      ))}
                    </div>

                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {PAGE_CONFIG.find((c) => c.type === activePageType)?.positions.map((pos) => {
                          const size = slotSizing[pos.id] || {
                            desktop: POSITION_SIZE_CONFIG[pos.id]?.containerDesktop,
                            tablet: POSITION_SIZE_CONFIG[pos.id]?.containerTablet,
                            mobile: POSITION_SIZE_CONFIG[pos.id]?.containerMobile,
                          };
                          return (
                            <div
                              key={pos.id}
                              onClick={() => setEditingPosition(pos.id)}
                              className={cn(
                                "p-3 rounded-xl border-2 transition-all cursor-pointer",
                                editingPosition === pos.id 
                                  ? "border-red-500 bg-red-50/50 dark:bg-red-900/20" 
                                  : "border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 hover:border-gray-200"
                              )}
                            >
                              <div className="text-[10px] font-black uppercase truncate mb-2">{pos.name}</div>
                              <div className="grid grid-cols-3 gap-1 opacity-60">
                                 {['D', 'T', 'M'].map((v, i) => (
                                   <div key={v} className="text-center">
                                      <div className="text-[8px] font-bold">{v}</div>
                                      <div className="text-[8px] font-mono leading-none">
                                        {[size.desktop, size.tablet, size.mobile][i].width}
                                      </div>
                                   </div>
                                 ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {editingPosition && (
                        <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-red-100 dark:border-red-900/30 shadow-lg animate-in fade-in zoom-in duration-200">
                           <div className="flex justify-between items-center mb-3">
                              <span className="text-[10px] font-black text-red-600 uppercase italic">Configure: {editingPosition}</span>
                              <Button variant="ghost" size="sm" onClick={() => setEditingPosition(null)} className="h-6 w-6 p-0 rounded-full">×</Button>
                           </div>
                           <div className="grid grid-cols-3 gap-3">
                             {['desktop', 'tablet', 'mobile'].map(v => (
                               <div key={v} className="space-y-2">
                                  <div className="flex flex-col gap-1 items-center">
                                     <Input 
                                      type="number" 
                                      value={slotSizing[editingPosition]?.[v as keyof SlotSizeConfig]?.width ?? 0}
                                      onChange={(e) => updateSlotSize(editingPosition, v as keyof SlotSizeConfig, 'width', parseInt(e.target.value))}
                                      className="h-7 text-center text-[10px] font-mono"
                                      placeholder="W"
                                     />
                                     <Input 
                                      type="number" 
                                      value={slotSizing[editingPosition]?.[v as keyof SlotSizeConfig]?.height ?? 0}
                                      onChange={(e) => updateSlotSize(editingPosition, v as keyof SlotSizeConfig, 'height', parseInt(e.target.value))}
                                      className="h-7 text-center text-[10px] font-mono"
                                      placeholder="H"
                                     />
                                  </div>
                               </div>
                             ))}
                           </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 3. High Fidelity Live Preview */}
              <div className="space-y-4">
                <Card className="sticky top-4 border-emerald-100 dark:border-emerald-900/20 shadow-2xl overflow-hidden min-h-[700px]">
                   <CardHeader className="bg-emerald-50/50 dark:bg-emerald-950/20 py-3 border-b border-emerald-100 dark:border-emerald-900/30">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-emerald-600" />
                            <CardTitle className="text-sm uppercase font-black tracking-widest text-emerald-900 dark:text-emerald-100">Interactive Scaling Preview</CardTitle>
                         </div>
                         <div className="flex gap-2">
                            <div className="h-2 w-2 rounded-full bg-red-400" />
                            <div className="h-2 w-2 rounded-full bg-yellow-400" />
                            <div className="h-2 w-2 rounded-full bg-green-400" />
                         </div>
                      </div>
                   </CardHeader>
                   <CardContent className="p-0 bg-gray-50/50 dark:bg-black/40 min-h-[640px] flex items-center justify-center relative overflow-hidden">
                      {/* Grid background for scale reference */}
                      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                      
                      <div style={previewStyle} className="transition-all duration-700 ease-out transform shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-lg p-0">
                         {/* Header row with CIRCLE BACKGROUND ICONS as requested */}
                         {(appearance.showLabel || appearance.showInfoIcon || appearance.showCloseButton) && (
                            <div className="flex items-center justify-between gap-4 mb-3 p-1">
                               {appearance.showInfoIcon ? (
                                  <div className="flex items-center gap-2">
                                     <button className="p-2 rounded-full bg-white dark:bg-gray-800 text-gray-500 shadow-xl border border-gray-100 dark:border-gray-700 hover:scale-110 active:scale-90 transition-all">
                                        <Info className="h-4 w-4" />
                                     </button>
                                     <button className="p-2 rounded-full bg-white dark:bg-gray-800 text-gray-500 shadow-xl border border-gray-100 dark:border-gray-700 hover:scale-110 active:scale-90 transition-all text-red-400">
                                        <Heart className="h-4 w-4" />
                                     </button>
                                  </div>
                               ) : <div className="w-10"/>}

                               {appearance.showLabel && (
                                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 bg-gray-50/50 dark:bg-gray-900/50 px-6 py-1.5 rounded-full border border-gray-100 dark:border-gray-800 flex-1 text-center shadow-inner">
                                     {appearance.labelText}
                                  </div>
                               )}

                               {appearance.showCloseButton ? (
                                  <button className="p-2 rounded-full bg-white dark:bg-gray-800 text-gray-400 shadow-xl border border-gray-100 dark:border-gray-700 hover:scale-110 active:scale-90 transition-all">
                                     <CloseIcon className="h-4 w-4" />
                                  </button>
                               ) : <div className="w-10"/>}
                            </div>
                         )}

                         <div className="bg-white dark:bg-black rounded w-full min-h-[450px] relative overflow-hidden flex items-center justify-center border border-gray-100 dark:border-gray-900 shadow-inner">
                            <div 
                              className="absolute inset-4 bg-emerald-400/5 flex flex-col items-center justify-center border-4 border-dashed border-emerald-500/10 rounded-3xl m-2"
                              style={{ 
                                objectFit: appearance.objectFit as any,
                                transform: `scale(${appearance.mediaScale})`,
                              }}
                            >
                               <div className="text-center space-y-4">
                                  <div className="relative inline-block">
                                     <Monitor className="h-20 w-20 text-emerald-500/20" />
                                     <div className="absolute inset-0 flex items-center justify-center">
                                       <span className="text-3xl font-black text-emerald-600/40">{(appearance.mediaScale * 100).toFixed(0)}%</span>
                                     </div>
                                  </div>
                                  <h2 className="text-2xl font-black text-gray-200 dark:text-gray-800 uppercase tracking-tighter">Media Rendering Area</h2>
                                  <div className="flex gap-2 justify-center">
                                     <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">{appearance.objectFit} mode</span>
                                     <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">Scale: {appearance.containerScale.toFixed(1)}x</span>
                                  </div>
                               </div>
                            </div>
                         </div>
                      </div>
                      
                      {/* Scale Marker */}
                      <div className="absolute bottom-6 flex items-center gap-6 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-white dark:bg-gray-950 px-6 py-2 rounded-full border border-gray-100 dark:border-gray-900 shadow-lg select-none">
                         <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-emerald-500"/> Current Transform: {appearance.containerScale.toFixed(2)}x</div>
                         <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-red-500"/> Fit: {appearance.objectFit}</div>
                      </div>
                   </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ─── SIZING TAB ─────────────────────────────────────── */}
          <TabsContent value="sizing-legacy" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ad Slot Container Sizing</CardTitle>
                <CardDescription>
                  Configure global container dimensions for all ad positions. These settings affect both the website and preview modal.
                </CardDescription>
              </CardHeader>
              <CardContent>


                {/* Nested Tabs for Page Types */}
                <Tabs value={activePageType} onValueChange={(v: any) => setActivePageType(v)}>
                  <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    {PAGE_CONFIG.map((config) => (
                      <TabsTrigger
                        key={config.type}
                        value={config.type}
                        className="data-[state=active]:bg-[#ef4444] data-[state=active]:text-white hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors text-xs"
                      >
                        {config.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {PAGE_CONFIG.map((pageConfig) => (
                    <TabsContent key={pageConfig.type} value={pageConfig.type} className="space-y-3 mt-4">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                        {pageConfig.description}
                      </p>

                      {pageConfig.type === "article" && (
                        <Card className="bg-gray-50/30 dark:bg-black/20 mb-6 border-dashed">
                          <CardHeader className="py-2 px-4">
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase text-gray-400">
                              <span>Available for Content Selection:</span>
                              {isLoadingArticles && <Loader2 className="h-3 w-3 animate-spin text-red-500" />}
                            </div>
                          </CardHeader>
                          <CardContent className="pb-3 px-4">
                            <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar scroll-smooth">
                              {articles.map(a => (
                                <div key={a._id} className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800 rounded text-[10px] whitespace-nowrap flex items-center gap-1.5 shadow-sm group hover:border-red-200 transition-colors">
                                  <span className="max-w-[150px] truncate">{a.title}</span>
                                </div>
                              ))}
                              {articles.length === 0 && !isLoadingArticles && (
                                <span className="text-[10px] text-gray-400 italic">No articles found</span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {pageConfig.positions.map((pos) => {
                        const config = POSITION_SIZE_CONFIG[pos.id];
                        if (!config) return null;

                        const sizing = slotSizing[pos.id] || {
                          desktop: config.containerDesktop,
                          tablet: config.containerTablet,
                          mobile: config.containerMobile,
                        };
                        const isEditing = editingPosition === pos.id;

                        return (
                          <Card key={pos.id} className="border-gray-200 dark:border-gray-700">
                            <CardContent className="pt-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {pos.name}
                                  </h4>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    {pos.description}
                                  </p>
                                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                                    Default: {config.label}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {pos.id.includes('in-content') && activePageType === 'article' && (
                                    <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                      Global
                                    </span>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingPosition(isEditing ? null : pos.id)}
                                    className="text-xs shrink-0"
                                  >
                                    {isEditing ? "Done" : "Edit Sizing"}
                                  </Button>
                                </div>
                              </div>

                              {isEditing ? (
                                <div className="space-y-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                                  {/* Desktop */}
                                  <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                                      <Monitor className="h-3.5 w-3.5" />
                                      Desktop Container
                                    </Label>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <Input
                                          type="number"
                                          value={sizing.desktop.width}
                                          onChange={(e) => {
                                            const newSizing = { ...slotSizing };
                                            newSizing[pos.id] = {
                                              ...sizing,
                                              desktop: { ...sizing.desktop, width: parseInt(e.target.value) || 0 },
                                            };
                                            setSlotSizing(newSizing);
                                          }}
                                          className="text-xs h-9"
                                          placeholder="Width"
                                        />
                                        <span className="text-[10px] text-gray-500 dark:text-gray-400 block mt-1">Width (px)</span>
                                      </div>
                                      <div>
                                        <Input
                                          type="number"
                                          value={sizing.desktop.height}
                                          onChange={(e) => {
                                            const newSizing = { ...slotSizing };
                                            newSizing[pos.id] = {
                                              ...sizing,
                                              desktop: { ...sizing.desktop, height: parseInt(e.target.value) || 0 },
                                            };
                                            setSlotSizing(newSizing);
                                          }}
                                          className="text-xs h-9"
                                          placeholder="Height"
                                        />
                                        <span className="text-[10px] text-gray-500 dark:text-gray-400 block mt-1">Height (px)</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Tablet */}
                                  <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                                      <Tablet className="h-3.5 w-3.5" />
                                      Tablet Container
                                    </Label>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <Input
                                          type="number"
                                          value={sizing.tablet.width}
                                          onChange={(e) => {
                                            const newSizing = { ...slotSizing };
                                            newSizing[pos.id] = {
                                              ...sizing,
                                              tablet: { ...sizing.tablet, width: parseInt(e.target.value) || 0 },
                                            };
                                            setSlotSizing(newSizing);
                                          }}
                                          className="text-xs h-9"
                                          placeholder="Width"
                                        />
                                        <span className="text-[10px] text-gray-500 dark:text-gray-400 block mt-1">Width (px)</span>
                                      </div>
                                      <div>
                                        <Input
                                          type="number"
                                          value={sizing.tablet.height}
                                          onChange={(e) => {
                                            const newSizing = { ...slotSizing };
                                            newSizing[pos.id] = {
                                              ...sizing,
                                              tablet: { ...sizing.tablet, height: parseInt(e.target.value) || 0 },
                                            };
                                            setSlotSizing(newSizing);
                                          }}
                                          className="text-xs h-9"
                                          placeholder="Height"
                                        />
                                        <span className="text-[10px] text-gray-500 dark:text-gray-400 block mt-1">Height (px)</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Mobile */}
                                  <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                                      <Smartphone className="h-3.5 w-3.5" />
                                      Mobile Container
                                    </Label>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <Input
                                          type="number"
                                          value={sizing.mobile.width}
                                          onChange={(e) => {
                                            const newSizing = { ...slotSizing };
                                            newSizing[pos.id] = {
                                              ...sizing,
                                              mobile: { ...sizing.mobile, width: parseInt(e.target.value) || 0 },
                                            };
                                            setSlotSizing(newSizing);
                                          }}
                                          className="text-xs h-9"
                                          placeholder="Width"
                                        />
                                        <span className="text-[10px] text-gray-500 dark:text-gray-400 block mt-1">Width (px)</span>
                                      </div>
                                      <div>
                                        <Input
                                          type="number"
                                          value={sizing.mobile.height}
                                          onChange={(e) => {
                                            const newSizing = { ...slotSizing };
                                            newSizing[pos.id] = {
                                              ...sizing,
                                              mobile: { ...sizing.mobile, height: parseInt(e.target.value) || 0 },
                                            };
                                            setSlotSizing(newSizing);
                                          }}
                                          className="text-xs h-9"
                                          placeholder="Height"
                                        />
                                        <span className="text-[10px] text-gray-500 dark:text-gray-400 block mt-1">Height (px)</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="grid grid-cols-3 gap-3 text-xs pt-2">
                                  <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded">
                                    <Monitor className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400 shrink-0" />
                                    <span className="text-gray-700 dark:text-gray-300 font-mono">
                                      {sizing.desktop.width}×{sizing.desktop.height}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded">
                                    <Tablet className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400 shrink-0" />
                                    <span className="text-gray-700 dark:text-gray-300 font-mono">
                                      {sizing.tablet.width}×{sizing.tablet.height}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded">
                                    <Smartphone className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400 shrink-0" />
                                    <span className="text-gray-700 dark:text-gray-300 font-mono">
                                      {sizing.mobile.width}×{sizing.mobile.height}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── TRACKING TAB ───────────────────────────────────── */}
          <TabsContent value="tracking" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Analytics Tracking</CardTitle>
                <CardDescription>
                  Configure how ad performance is tracked and measured
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Eye className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                        Automatic Tracking Enabled
                      </p>
                      <p className="text-xs text-emerald-800 dark:text-emerald-200">
                        The following metrics are automatically tracked for all ads:
                      </p>
                      <ul className="text-xs text-emerald-800 dark:text-emerald-200 space-y-1 ml-4">
                        <li>• <strong>Impressions:</strong> Counted when ad becomes visible in viewport</li>
                        <li>• <strong>Clicks:</strong> Tracked when user clicks on ad content</li>
                        <li>• <strong>Closes:</strong> Recorded when user closes ad (if close button enabled)</li>
                        <li>• <strong>Close Reasons:</strong> User-selected reason for closing ad</li>
                        <li>• <strong>CTR:</strong> Automatically calculated (Clicks / Impressions × 100)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-red-500" />
                      Close Reason Statistics
                    </h4>
                    {isLoadingAnalytics && <Loader2 className="h-3 w-3 animate-spin text-gray-400" />}
                  </div>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                    {[
                      { key: "inappropriate", label: "Inappropriate", color: "bg-red-500" },
                      { key: "coveredContent", label: "Covered Content", color: "bg-orange-500" },
                      { key: "seenMultiple", label: "Seen Multiple", color: "bg-amber-500" },
                      { key: "notInterested", label: "Not Interested", color: "bg-blue-500" },
                      { key: "other", label: "Other", color: "bg-gray-500" },
                    ].map((reason) => {
                      const count = analytics?.totals?.closeReasons?.[reason.key] || 0;
                      const isOther = reason.key === "other";
                      return (
                        <div
                          key={reason.key}
                          onClick={() => isOther && count > 0 && setShowOtherReasonsDialog(true)}
                          className={cn(
                            "flex flex-col gap-1 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 shadow-sm transition-all",
                            isOther && count > 0 && "cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-md active:scale-95 group/card"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className={cn("w-2 h-2 rounded-full", reason.color)} />
                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                              {count}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400">
                              {reason.label}
                            </span>
                            {isOther && count > 0 && (
                              <Eye className="h-3 w-3 text-gray-400 opacity-0 group-hover/card:opacity-100 transition-opacity" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800">
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Total Impressions</p>
                      <p className="text-xl font-bold">{analytics?.totals?.impressions || 0}</p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800">
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Total Clicks</p>
                      <p className="text-xl font-bold">{analytics?.totals?.clicks || 0}</p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800">
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Overall CTR</p>
                      <p className="text-xl font-bold text-emerald-600">{(analytics?.totals?.ctr || 0).toFixed(2)}%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Reset Confirmation Dialog */}
        <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
                <RotateCcw className="h-5 w-5" />
                Reset to Defaults?
              </DialogTitle>
              <DialogDescription className="pt-2">
                This will revert all ad appearance and slot sizing settings back to their original factory defaults. This action cannot be undone unless you save before exiting.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowResetConfirm(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmReset} className="bg-amber-600 hover:bg-amber-700">
                Yes, Reset All
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Other Reasons Detailed View Dialog */}
        <Dialog open={showOtherReasonsDialog} onOpenChange={setShowOtherReasonsDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="p-6 pb-2 bg-gray-50 dark:bg-gray-900/50">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-gray-500" />
                </div>
                Custom Feedback (Other Reasons)
              </DialogTitle>
              <DialogDescription>
                Detailed reasons provided by website users when closing ads.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 pt-4 custom-scrollbar bg-white dark:bg-gray-950">
              {analytics?.totals?.otherReasonTexts?.length > 0 ? (
                <div className="grid gap-4">
                  {analytics.totals.otherReasonTexts.map((item: any, idx: number) => (
                    <div key={idx} className="group/item p-4 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-100 dark:border-gray-800 transition-all hover:shadow-md hover:border-gray-200 dark:hover:border-gray-700">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/40 flex flex-col items-center justify-center shrink-0 border border-red-200 dark:border-red-900/50">
                            <span className="text-[8px] uppercase font-bold text-red-600 dark:text-red-400 leading-none mb-0.5">Sr#</span>
                            <span className="text-[12px] font-black text-red-700 dark:text-red-300 leading-none">
                              {(idx + 1).toString().padStart(2, '0')}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Target Ad</p>
                            <p className="font-bold text-blue-600 dark:text-blue-400 text-sm leading-tight">{item.adName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Date</p>
                          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                            {new Date(item.date).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-gray-200/50 dark:border-gray-800/50">
                        <div className="flex gap-3">
                          <div className="mt-1">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-red-500 opacity-50">
                              <path d="M3 21c3 0 7-1 7-8V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h4" />
                              <path d="M13 21c3 0 7-1 7-8V5c0-1.1-.9-2-2-2h-3c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h4" />
                            </svg>
                          </div>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-relaxed italic">
                            {item.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center border border-dashed border-gray-200 dark:border-gray-800">
                    <MessageSquare className="h-8 w-8 text-gray-300" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-gray-700 dark:text-gray-300 italic">No feedback stories yet</p>
                    <p className="text-xs text-gray-500 max-w-[200px]">Custom reasons will appear here once users submit them.</p>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-sm flex justify-between items-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-2">
                Total Feedback: {analytics?.totals?.otherReasonTexts?.length || 0}
              </span>
              <Button variant="outline" onClick={() => setShowOtherReasonsDialog(false)} className="h-9 font-bold px-6">
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button variant="outline" onClick={handleReset} className="text-gray-600 dark:text-gray-400">
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset to Defaults
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
