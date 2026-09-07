"use client";

import * as React from "react";
import { ArrowLeft, Power, PowerOff, Eye, Pencil, Trash2, Save, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import AdSnippetEditor, { EditingPosition } from "./AdSnippetEditor";
import AdPreviewModal from "./AdPreviewModal";
import { POSITION_SIZE_CONFIG } from "@/lib/constants/adSizes";

interface AdOverride {
  position: string;
  adSnippetId: string;
  width?: number;
  height?: number;
}

interface Article {
  _id: string;
  slug: string;
  title: string;
  date: string;
  adOverrides: AdOverride[];
}

interface AdSnippetData {
  _id: string;
  name: string;
  label: string;
  pageType: string;
  position: string;
  code: string;
  enabled: boolean;
  type?: string;
  templateType?: string;
  creativeType?: string;
  mediaUrl?: string;
  url?: string;
  vastTagUrl?: string;
  clickThroughUrl?: string;
  width?: string;
  height?: string;
  padding?: string;
  margin?: string;
}

interface ArticleAdEditorProps {
  article: Article;
  onBack: () => void;
  onSave: (adOverrides: AdOverride[]) => void;
  isSaving?: boolean;
}

// Article template positions
const ARTICLE_POSITIONS = [
  { 
    id: "top-leaderboard", 
    name: `Top Leaderboard Ad (ATF — ${POSITION_SIZE_CONFIG["top-leaderboard"]?.label || "728×90"})`, 
    description: "Above the fold, highest visibility" 
  },
  { 
    id: "atf-rectangle", 
    name: `ATF Rectangle Ad (${POSITION_SIZE_CONFIG["atf-rectangle"]?.label || "336×280"})`, 
    description: "Highest value position" 
  },
  { 
    id: "sticky-footer", 
    name: `Sticky Footer Ad (${POSITION_SIZE_CONFIG["sticky-footer"]?.label || "728×90"})`, 
    description: "Persistent at bottom" 
  },
  { 
    id: "in-content-1", 
    name: `In-Content 1 (${POSITION_SIZE_CONFIG["in-content-1"]?.label || "336×280"})`, 
    description: "After Paragraph 2" 
  },
  { 
    id: "in-content-2", 
    name: `In-Content 2 (${POSITION_SIZE_CONFIG["in-content-2"]?.label || "336×280"})`, 
    description: "After Paragraph 6" 
  },
  { 
    id: "sidebar-sticky", 
    name: `Sidebar Sticky (${POSITION_SIZE_CONFIG["sidebar-sticky"]?.label || "300×600"})`, 
    description: "Desktop only, follows scroll" 
  },
  { 
    id: "sidebar-infeed", 
    name: `Sidebar In-Feed Native (${POSITION_SIZE_CONFIG["sidebar-infeed"]?.label || "300×250"})`, 
    description: "Native ad in right sidebar" 
  },
];

export default function ArticleAdEditor({
  article,
  onBack,
  onSave,
  isSaving = false,
}: ArticleAdEditorProps) {
  const [localOverrides, setLocalOverrides] = React.useState<AdOverride[]>(
    article.adOverrides || []
  );
  const [editingPosition, setEditingPosition] = React.useState<EditingPosition | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
  const [loadingPosition, setLoadingPosition] = React.useState<string | null>(null);

  // Preview modal state
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewData, setPreviewData] = React.useState<{
    code: string;
    vastTagUrl: string;
    mediaUrl: string;
    adType: "html" | "image" | "video" | "vast" | "audio";
    position: string;
    adSnippetId?: string;
  } | null>(null);

  // Cache loaded ad snippet data for preview
  const [adSnippetCache, setAdSnippetCache] = React.useState<Record<string, AdSnippetData>>({});

  // Fetch global article ads (non-override) for the "Use Global Default" option
  const [globalAds, setGlobalAds] = React.useState<AdSnippetData[]>([]);
  React.useEffect(() => {
    fetch("/api/ads?pageType=article&activeOnly=true", { cache: "no-store" })
      .then(res => res.json())
      .then(data => setGlobalAds(data.items || []))
      .catch(() => {});
  }, []);

  // Get the global ad for a specific position
  const getGlobalAdForPosition = (positionId: string) => {
    return globalAds.find(a => a.position === positionId && a.enabled);
  };

  // Get ad configuration for a position (override or site-wide)
  const getOverrideForPosition = (positionId: string) => {
    return localOverrides.find((o) => o.position === positionId);
  };

  const loadAdSnippet = async (adSnippetId: string): Promise<AdSnippetData | null> => {
    // Check cache first
    if (adSnippetCache[adSnippetId]) return adSnippetCache[adSnippetId];

    try {
      const res = await fetch(`/api/ads/${adSnippetId}`);
      if (res.ok) {
        const data = await res.json();
        const snippet = data.item as AdSnippetData;
        setAdSnippetCache((prev) => ({ ...prev, [adSnippetId]: snippet }));
        return snippet;
      }
    } catch (err) {
      console.error("Failed to load ad snippet details", err);
    }
    return null;
  };

  // Handle override selection change from dropdown
  const handleOverrideChange = async (positionId: string, value: string) => {
    if (value === "global") {
      // Remove this position's override
      const existingOverride = localOverrides.find(o => o.position === positionId);
      if (existingOverride) {
        // Delete the ad snippet from DB
        try {
          await fetch(`/api/ads/${existingOverride.adSnippetId}`, { method: "DELETE" });
        } catch (e) {
          console.warn("Could not delete ad snippet from DB");
        }
        const newOverrides = localOverrides.filter(o => o.position !== positionId);
        setLocalOverrides(newOverrides);
        onSave(newOverrides);
        toast.success("Reverted to global default for this position");
      }
      return;
    }

    // value is an adSnippetId — create/update override
    const existingOverride = localOverrides.find(o => o.position === positionId);
    let updatedOverrides;

    if (existingOverride) {
      // Update existing override
      updatedOverrides = localOverrides.map(o =>
        o.position === positionId ? { ...o, adSnippetId: value } : o
      );
    } else {
      // Add new override
      updatedOverrides = [...localOverrides, { position: positionId, adSnippetId: value }];
    }

    setLocalOverrides(updatedOverrides);
    onSave(updatedOverrides);
    toast.success("Override saved for this position");
  };

  const handleEditPosition = async (positionId: string) => {
    const override = getOverrideForPosition(positionId);

    let snippet: AdSnippetData | null = null;
    let adCode = "";
    let adEnabled = true;

    if (override) {
      try {
        setLoadingPosition(positionId);
        snippet = await loadAdSnippet(override.adSnippetId);
        if (snippet) {
          adCode = snippet.code || "";
          adEnabled = snippet.enabled ?? true;
        }
      } finally {
        setLoadingPosition(null);
      }
    }

    setEditingPosition({
      pageType: "article",
      position: positionId,
      type: (snippet?.type as any) || "html",
      code: adCode,
      url: snippet?.mediaUrl || snippet?.url || "",
      vastUrl: snippet?.vastTagUrl || "",
      status: adEnabled,
      enabled: adEnabled,
      mediaUrl: snippet?.mediaUrl || snippet?.url || "",
      vastTagUrl: snippet?.vastTagUrl || "",
      clickThroughUrl: snippet?.clickThroughUrl || "",
      templateType: snippet?.templateType || "legacy",
      creativeType: snippet?.creativeType || "",
      templateId: undefined,
      templateVariables: {},
      customCode: true,
    });
  };

  const handlePreviewPosition = async (positionId: string) => {
    const override = getOverrideForPosition(positionId);
    if (!override) return;

    try {
      setLoadingPosition(positionId);
      const snippet = await loadAdSnippet(override.adSnippetId);
      if (snippet) {
        const adType: "html" | "image" | "video" | "vast" | "audio" =
          snippet.vastTagUrl ? "vast" :
          snippet.type === "video" ? "video" :
          snippet.type === "image" ? "image" :
          snippet.mediaUrl && /\.(mp3|wav|ogg)$/i.test(snippet.mediaUrl) ? "audio" :
          snippet.mediaUrl && /\.(mp4|webm|mov)$/i.test(snippet.mediaUrl) ? "video" :
          snippet.mediaUrl && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(snippet.mediaUrl) ? "image" :
          "html";

        setPreviewData({
          code: snippet.code || "",
          vastTagUrl: snippet.vastTagUrl || "",
          mediaUrl: snippet.mediaUrl || "",
          adType,
          position: positionId,
          adSnippetId: snippet._id,
        });
        setPreviewOpen(true);
      } else {
        toast.error("Failed to load ad data for preview");
      }
    } finally {
      setLoadingPosition(null);
    }
  };

  const handleSavePosition = async () => {
    if (!editingPosition) return;

    const existingOverrideIndex = localOverrides.findIndex(
      (o) => o.position === editingPosition.position
    );

    // If code is empty, remove the override
    if (editingPosition.code.trim() === "") {
      if (existingOverrideIndex !== -1) {
        const newOverrides = localOverrides.filter((_, i) => i !== existingOverrideIndex);
        setLocalOverrides(newOverrides);
        onSave(newOverrides); // Instant sync
      }
      setEditingPosition(null);
      return;
    }

    try {
      // Check if we already have an override for this position
      const existingOverride = localOverrides.find(
        (o) => o.position === editingPosition.position
      );

      let adSnippetId: string;

      if (existingOverride) {
        // Update existing ad snippet
        const res = await fetch(`/api/ads/${existingOverride.adSnippetId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `${article.slug}-${editingPosition.position}-${Date.now()}`,
            label: `${article.title} - ${editingPosition.position}`,
            pageType: "article",
            position: editingPosition.position,
            type: editingPosition.type,
            code: editingPosition.code,
            mediaUrl: editingPosition.mediaUrl || editingPosition.url,
            vastTagUrl: editingPosition.vastTagUrl || editingPosition.vastUrl,
            clickThroughUrl: editingPosition.clickThroughUrl,
            templateType: editingPosition.templateType,
            creativeType: editingPosition.creativeType,
            enabled: editingPosition.enabled,
            isArticleOverride: true,
          }),
        });

        if (!res.ok) throw new Error("Failed to update ad snippet");
        const data = await res.json();
        adSnippetId = data.item._id;
        // Update cache
        setAdSnippetCache((prev) => ({ ...prev, [adSnippetId]: data.item }));
      } else {
        // Create new ad snippet
        const res = await fetch("/api/ads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `${article.slug}-${editingPosition.position}-${Date.now()}`,
            label: `${article.title} - ${editingPosition.position}`,
            pageType: "article",
            position: editingPosition.position,
            type: editingPosition.type,
            code: editingPosition.code,
            mediaUrl: editingPosition.mediaUrl || editingPosition.url,
            vastTagUrl: editingPosition.vastTagUrl || editingPosition.vastUrl,
            clickThroughUrl: editingPosition.clickThroughUrl,
            templateType: editingPosition.templateType,
            creativeType: editingPosition.creativeType,
            enabled: editingPosition.enabled,
            isArticleOverride: true,
          }),
        });

        if (!res.ok) throw new Error("Failed to create ad snippet");
        const data = await res.json();
        adSnippetId = data.item._id;
        setAdSnippetCache((prev) => ({ ...prev, [adSnippetId]: data.item }));
      }

      // Update local overrides
      const newOverride: AdOverride = {
        position: editingPosition.position,
        adSnippetId,
        width: undefined,
        height: undefined,
      };

      let updatedOverrides = [];
      if (existingOverrideIndex !== -1) {
        updatedOverrides = [...localOverrides];
        updatedOverrides[existingOverrideIndex] = newOverride;
      } else {
        updatedOverrides = [...localOverrides, newOverride];
      }

      setLocalOverrides(updatedOverrides);
      onSave(updatedOverrides); // Instant sync
      
      setEditingPosition(null);
      toast.success("Ad position saved and synced!");
    } catch (error) {
      console.error("Failed to save position:", error);
      toast.error("Failed to save ad position. Please try again.");
    }
  };

  const handleRemoveOverride = async (positionId: string) => {
    const override = localOverrides.find((o) => o.position === positionId);
    if (!override) return;

    const confirmed = window.confirm("Are you sure you want to permanently remove this article-specific ad? This will delete the ad configuration from the database.");
    if (!confirmed) return;

    try {
      setLoadingPosition(positionId);
      
      // 1. Physically delete the ad snippet from DB
      const res = await fetch(`/api/ads/${override.adSnippetId}`, { method: "DELETE" });
      if (!res.ok) {
        console.warn("Could not delete ad snippet from DB, it might be already gone.");
      }

      // 2. Remove from local overrides
      const newOverrides = localOverrides.filter((o) => o.position !== positionId);
      setLocalOverrides(newOverrides);
      onSave(newOverrides); // Instant sync
      toast.success("Ad permanently removed and synced");
    } catch (error) {
      console.error("Failed to remove override:", error);
      toast.error("An error occurred while removing the ad");
    } finally {
      setLoadingPosition(null);
    }
  };

  const handleToggleEnabled = async (positionId: string, enabled: boolean) => {
    const override = localOverrides.find((o) => o.position === positionId);
    if (!override) return;

    try {
      setLoadingPosition(positionId);
      const snippet = await loadAdSnippet(override.adSnippetId);
      if (!snippet) throw new Error("Ad snippet not found");

      const res = await fetch(`/api/ads/${override.adSnippetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...snippet, enabled }),
      });

      if (!res.ok) throw new Error("Failed to toggle ad status");
      
      const updatedSnippet = (await res.json()).item;
      // Update cache
      setAdSnippetCache((prev) => ({ ...prev, [override.adSnippetId]: updatedSnippet }));
      toast.success(`Ad ${enabled ? "enabled" : "disabled"} for this article`);
    } catch (err) {
      console.error("Failed to toggle ad status:", err);
      toast.error("Failed to update ad status");
    } finally {
      setLoadingPosition(null);
    }
  };

  const handleSaveFromPreview = async () => {
    if (!previewData || !previewData.adSnippetId) return;
    toast.success("Ad configuration confirmed and synced!");
    setPreviewOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Articles
            </Button>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">{article.title}</h2>
          <p className="text-sm text-muted-foreground">
            Slug: {article.slug}
          </p>
        </div>
      </div>

      {/* Ad Positions */}
      <div className="grid gap-4">
        {ARTICLE_POSITIONS.map((pos) => {
          const override = getOverrideForPosition(pos.id);
          const globalAd = getGlobalAdForPosition(pos.id);
          const isOverride = !!override;
          const isLoading = loadingPosition === pos.id;

          // Resolve which ad is actually shown
          const activeAd = isOverride
            ? adSnippetCache[override.adSnippetId] || { name: "Loading...", enabled: true }
            : globalAd || null;
          const activeName = isOverride
            ? (adSnippetCache[override.adSnippetId]?.name || "Override ad")
            : (globalAd?.name || "No global ad configured");

          return (
            <Card key={pos.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{pos.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {pos.description}
                    </CardDescription>
                    <div className="flex items-center gap-2 mt-2">
                      {isOverride ? (
                        <Badge className="bg-red-600 text-white hover:bg-red-700">
                          Article Override
                        </Badge>
                      ) : globalAd ? (
                        <Badge variant="outline" className="border-emerald-300 text-emerald-700 dark:border-emerald-600 dark:text-emerald-400">
                          <Globe className="mr-1 h-3 w-3" />
                          Using Global Default
                        </Badge>
                      ) : (
                        <Badge variant="outline">Not Configured</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    {/* Override selector dropdown */}
                    <Select
                      value={isOverride ? override.adSnippetId : "global"}
                      onValueChange={(value) => handleOverrideChange(pos.id, value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="w-full max-w-md">
                        <SelectValue placeholder="Select ad configuration...">
                          {isOverride
                            ? `Override: ${activeName}`
                            : globalAd
                              ? `Global: ${globalAd.name}`
                              : "No ad configured"
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="global">
                          <div className="flex items-center gap-2">
                            <Globe className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Use Global Default</span>
                            {globalAd && (
                              <span className="text-xs text-muted-foreground ml-1">
                                ({globalAd.name})
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {isOverride && (
                      <p className="text-xs text-muted-foreground mt-1">
                        This article uses a custom ad for this position. Select "Use Global Default" to revert.
                      </p>
                    )}
                    {!isOverride && globalAd && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Global ad applies to all articles. Select an override to customize for this article.
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isOverride && (
                      <>
                        <div className="flex items-center space-x-2 mr-2">
                          <Switch
                            checked={adSnippetCache[override.adSnippetId]?.enabled !== false}
                            onCheckedChange={(enabled) =>
                              handleToggleEnabled(pos.id, enabled)
                            }
                            disabled={isLoading}
                            aria-label={`Toggle ad visibility for ${pos.name}`}
                          />
                          <span className="text-xs text-muted-foreground">
                            {adSnippetCache[override.adSnippetId]?.enabled !== false ? "Visible" : "Hidden"}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreviewPosition(pos.id)}
                          disabled={isLoading}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-950/30"
                        >
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          {isLoading ? "Loading..." : "Preview"}
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditPosition(pos.id)}
                      disabled={isLoading}
                    >
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      {isLoading ? "Loading..." : isOverride ? "Edit Ad" : "Add Override"}
                    </Button>
                    {isOverride && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveOverride(pos.id)}
                        className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/30"
                      >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Position Dialog */}
      <Dialog open={!!editingPosition} onOpenChange={() => setEditingPosition(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPosition 
                ? ARTICLE_POSITIONS.find((pos) => pos.id === editingPosition.position)?.name || editingPosition.position
                : "Configure Ad Position"}
            </DialogTitle>
            <DialogDescription>
              {editingPosition && (
                <>
                  {ARTICLE_POSITIONS.find((pos) => pos.id === editingPosition.position)?.name} —{" "}
                  {article.title}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {editingPosition && (
            <AdSnippetEditor
              editingPosition={editingPosition}
              setEditingPosition={setEditingPosition}
              onSave={handleSavePosition}
              onCancel={() => setEditingPosition(null)}
              isLoading={false}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Ad Preview Modal */}
      {previewData && (
        <AdPreviewModal
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          adCode={previewData.code}
          vastTagUrl={previewData.vastTagUrl}
          mediaUrl={previewData.mediaUrl}
          adType={previewData.adType}
          position={previewData.position}
          title={`Preview — ${ARTICLE_POSITIONS.find((p) => p.id === previewData.position)?.name || previewData.position}`}
          allowSizingAdjustment={true}
          onSaveAd={handleSaveFromPreview}
        />
      )}
    </div>
  );
}
