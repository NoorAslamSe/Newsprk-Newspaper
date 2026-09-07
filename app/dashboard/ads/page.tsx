"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Power, PowerOff, Eye, Pencil, Trash2, Settings } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AdSnippetEditor from "@/components/admin/AdSnippetEditor";
import SearchBar from "@/components/admin/SearchBar";
import ArticleSearchBar from "@/components/admin/ArticleSearchBar";
import ArticleList from "@/components/admin/ArticleList";
import ArticleAdEditor from "@/components/admin/ArticleAdEditor";
import AdPreviewModal from "@/components/admin/AdPreviewModal";
import AdSettingsPanel from "@/components/admin/AdSettingsPanel";
import { EditingPosition } from "@/components/admin/AdSnippetEditor";
import { POSITION_SIZE_CONFIG } from "@/lib/constants/adSizes";

type PageType = "homepage" | "article" | "category" | "website";
type AdPosition = string;

type AdSnippet = {
  _id: string;
  name: string;
  label: string;
  pageType: PageType;
  position: AdPosition;
  type: "html" | "image" | "video" | "vast";
  url: string;
  vastUrl: string;
  mediaUrl?: string;
  vastTagUrl?: string;
  code: string;
  status: boolean;
  enabled: boolean;
  createdAt?: string;
  templateId?: string;
  templateVariables?: Record<string, any>;
  customCode?: boolean;
  width?: string;
  height?: string;
};

type AdsResponse = {
  items: AdSnippet[];
};

// Exported for backward compatibility — now uses the constants module
export const AD_SIZE_CONFIG: Record<string, {
  desktop: { width: number; height: number };
  mobile: { width: number; height: number };
  label: string;
}> = Object.fromEntries(
  Object.entries(POSITION_SIZE_CONFIG).map(([key, cfg]) => [
    key,
    {
      desktop: cfg.desktop,
      mobile: cfg.mobile,
      label: cfg.label,
    },
  ])
);

// Predefined ad positions for each page type
const PAGE_CONFIG: {
  type: PageType;
  label: string;
  description: string;
  positions: { id: AdPosition; name: string; description: string }[];
}[] = [
  {
    type: "homepage",
    label: "Homepage",
    description: "Ad placements on the main homepage",
    positions: [
      { id: "header-leaderboard", name: `Header Leaderboard Ad (${POSITION_SIZE_CONFIG["header-leaderboard"]?.label || "728×90"})`, description: "Above trending ticker in header, highest visibility" },
      { id: "top-leaderboard", name: `Top Leaderboard Ad (ATF — ${POSITION_SIZE_CONFIG["top-leaderboard"]?.label || "728×90"})`, description: "Above the fold, highest visibility" },
      { id: "sticky-footer", name: `Sticky Footer Ad (${POSITION_SIZE_CONFIG["sticky-footer"]?.label || "728×90"})`, description: "Persistent at bottom of page" },
      { id: "in-feed-1", name: `In-Feed Native 1 (${POSITION_SIZE_CONFIG["in-feed-1"]?.label || "300×250"})`, description: "Between Card #3 and #4 in Latest News Grid" },
      { id: "in-feed-2", name: `In-Feed Native 2 (${POSITION_SIZE_CONFIG["in-feed-2"]?.label || "300×250"})`, description: "Below the 6-item Latest News Grid" },
      { id: "in-feed-3", name: `In-Feed Native 3 (${POSITION_SIZE_CONFIG["in-feed-3"]?.label || "300×250"})`, description: "Top Stories — after 3rd article" },
      { id: "in-feed-4", name: `In-Feed Native 4 (${POSITION_SIZE_CONFIG["in-feed-4"]?.label || "300×250"})`, description: "Top Stories — after 6th article" },
      { id: "in-feed-5", name: `In-Feed Native 5 (${POSITION_SIZE_CONFIG["in-feed-5"]?.label || "300×250"})`, description: "Top Stories — sidebar ad" },
      { id: "in-feed-6", name: `In-Feed Native 6 (${POSITION_SIZE_CONFIG["in-feed-6"]?.label || "300×250"})`, description: "Most Viewed — sidebar ad" },
      { id: "in-feed-7", name: `In-Feed Native 7 (${POSITION_SIZE_CONFIG["in-feed-7"]?.label || "300×250"})`, description: "Popular News — sidebar ad" },
      { id: "in-feed-8", name: `In-Feed Native 8 (${POSITION_SIZE_CONFIG["in-feed-8"]?.label || "300×250"})`, description: "Tech & Innovation — sidebar ad" },
      { id: "in-feed-9", name: `In-Feed Native 9 (${POSITION_SIZE_CONFIG["in-feed-9"]?.label || "300×250"})`, description: "Editor's Picks — sidebar ad" },
      { id: "in-feed-10", name: `In-Feed Native 10 (${POSITION_SIZE_CONFIG["in-feed-10"]?.label || "300×250"})`, description: "Latest Articles — after items 4 and 8" },
      { id: "in-feed-11", name: `In-Feed Native 11 (${POSITION_SIZE_CONFIG["in-feed-11"]?.label || "240×160"})`, description: "Latest Reviews — after featured review" },
      { id: "in-feed-12", name: `In-Feed Native 12 (${POSITION_SIZE_CONFIG["in-feed-12"]?.label || "240×160"})`, description: "Featured Carousel — inline slide ad" },
      { id: "in-feed-13", name: `In-Feed Native 13 (${POSITION_SIZE_CONFIG["in-feed-13"]?.label || "336×280"})`, description: "Hero Slider — right side card" },
      { id: "in-feed-14", name: `In-Feed Native 14 (${POSITION_SIZE_CONFIG["in-feed-14"]?.label || "336×520"})`, description: "Hero Slider — center slider replacement" },
      { id: "in-feed-15", name: `In-Feed Native 15 (${POSITION_SIZE_CONFIG["in-feed-15"]?.label || "336×280"})`, description: "Hero Slider — left side card" },
      { id: "in-feed-x", name: `In-Feed Native X (${POSITION_SIZE_CONFIG["in-feed-x"]?.label || "300×250"} — Repeating)`, description: "Repeats every 10 cards" },
      { id: "sidebar-sticky", name: `Sidebar Sticky (${POSITION_SIZE_CONFIG["sidebar-sticky"]?.label || "300×600"})`, description: "Right sidebar, follows scroll" },
      { id: "in-content-1", name: `Sidebar Rectangle (${POSITION_SIZE_CONFIG["in-content-1"]?.label || "300×250"})`, description: "Right sidebar, below social counters" },
      { id: "video-section", name: `Video Section Ad (${POSITION_SIZE_CONFIG["video-section"]?.label || "860×484"})`, description: "YouTube video section — VAST preroll ad" },
    ],
  },
  {
    type: "article",
    label: "Article Page",
    description: "Ad placements on article/post pages",
    positions: [
      { id: "top-leaderboard", name: `Top Leaderboard Ad (ATF — ${POSITION_SIZE_CONFIG["top-leaderboard"]?.label || "728×90"})`, description: "Above the fold" },
      { id: "atf-rectangle", name: `ATF Rectangle Ad (${POSITION_SIZE_CONFIG["atf-rectangle"]?.label || "336×280"})`, description: "Highest value position" },
      { id: "sticky-footer", name: `Sticky Footer Ad (${POSITION_SIZE_CONFIG["sticky-footer"]?.label || "728×90"})`, description: "Persistent at bottom" },
      { id: "in-content-1", name: `In-Content 1 (${POSITION_SIZE_CONFIG["in-content-1"]?.label || "336×280"})`, description: "After Paragraph 2" },
      { id: "in-content-2", name: `In-Content 2 (${POSITION_SIZE_CONFIG["in-content-2"]?.label || "336×280"})`, description: "After Paragraph 6" },
      { id: "sidebar-sticky", name: `Sidebar Sticky (${POSITION_SIZE_CONFIG["sidebar-sticky"]?.label || "300×600"})`, description: "Desktop only, follows scroll" },
      { id: "in-feed-1", name: `In-Feed Native 1 (${POSITION_SIZE_CONFIG["in-feed-1"]?.label || "300×250"})`, description: "After hero image" },
      { id: "in-feed-2", name: `In-Feed Native 2 (${POSITION_SIZE_CONFIG["in-feed-2"]?.label || "300×250"})`, description: "After in-content 2" },
      { id: "sidebar-infeed", name: `Sidebar In-Feed Native (${POSITION_SIZE_CONFIG["sidebar-infeed"]?.label || "300×250"})`, description: "Native ad in right sidebar between content sections" },
    ],
  },
  {
    type: "category",
    label: "Category Page",
    description: "Ad placements on category listing pages",
    positions: [
      { id: "top-leaderboard", name: `Top Leaderboard (ATF — ${POSITION_SIZE_CONFIG["top-leaderboard"]?.label || "728×90"})`, description: "Above the fold" },
      { id: "sticky-footer", name: `Sticky Footer Ad (${POSITION_SIZE_CONFIG["sticky-footer"]?.label || "728×90"})`, description: "Persistent at bottom" },
      { id: "in-feed-x", name: `In-Feed Ad (${POSITION_SIZE_CONFIG["in-feed-x"]?.label || "300×250"} — Repeating)`, description: "Repeats every 8 posts" },
    ],
  },
  {
    type: "website",
    label: "Static/Legal Pages",
    description: "Ad placements on static pages (About, Privacy, etc.)",
    positions: [
      { id: "sticky-footer", name: `Sticky Footer Ad (${POSITION_SIZE_CONFIG["sticky-footer"]?.label || "728×90"})`, description: "Persistent at bottom" },
    ],
  },
];

async function fetchAds(pageType?: PageType): Promise<AdsResponse> {
  const url = new URL("/api/ads", window.location.origin);
  if (pageType) url.searchParams.set("pageType", pageType);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load ads");
  return res.json();
}

async function fetchArticles(searchQuery: string, page: number) {
  const url = new URL("/api/articles", window.location.origin);
  url.searchParams.set("limit", "20");
  url.searchParams.set("page", page.toString());
  url.searchParams.set("sort", "ads");
  if (searchQuery) url.searchParams.set("search", searchQuery);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load articles");
  return res.json();
}

async function fetchArticle(slug: string) {
  const res = await fetch(`/api/articles/${slug}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load article");
  return res.json();
}

export default function AdsPage() {
  const queryClient = useQueryClient();

  // State
  const [activeTab, setActiveTab] = React.useState<PageType>("homepage");
  const [editingPosition, setEditingPosition] = React.useState<EditingPosition | null>(null);
  const [templates, setTemplates] = React.useState<any[]>([]);
  const [adPositionSearch, setAdPositionSearch] = React.useState("");
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  const [articleSearchQuery, setArticleSearchQuery] = React.useState("");
  const [articlePage, setArticlePage] = React.useState(1);
  const [selectedArticleSlug, setSelectedArticleSlug] = React.useState<string | null>(null);
  const [articleSubTab, setArticleSubTab] = React.useState<"global" | "overrides">("global");

  // Preview modal state
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewData, setPreviewData] = React.useState<{
    code: string;
    vastTagUrl: string;
    mediaUrl: string;
    adType: "html" | "image" | "video" | "vast" | "audio" | "native_feed";
    position: string;
    adSnippetId?: string;
    nativeContent?: any;
  } | null>(null);

  // Load templates for display
  React.useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response = await fetch('/api/templates');
        if (response.ok) {
          const data = await response.json();
          setTemplates(data.items || []);
        }
      } catch (error) {
        console.error('Failed to load templates:', error);
      }
    };
    loadTemplates();
  }, []);

  // Fetch ads for current tab
  const { data, isLoading: adsLoading } = useQuery({
    queryKey: ["ads", activeTab],
    queryFn: () => fetchAds(activeTab),
  });

  // Fetch articles for article-specific mode
  const { data: articlesData, isLoading: articlesLoading, error: articlesError } = useQuery({
    queryKey: ["articles", articleSearchQuery, articlePage],
    queryFn: () => fetchArticles(articleSearchQuery, articlePage),
    enabled: activeTab === "article",
  });

  // Fetch single article when editing
  const { data: selectedArticle } = useQuery({
    queryKey: ["article", selectedArticleSlug],
    queryFn: () => fetchArticle(selectedArticleSlug!),
    enabled: !!selectedArticleSlug,
  });

  // Show tab-aware toast when ads data loads
  React.useEffect(() => {
    if (!data || adsLoading || activeTab === "article") return;
    const pageConfig = PAGE_CONFIG.find(p => p.type === activeTab);
    const totalPositions = pageConfig?.positions.length ?? 0;
    const configuredCount = data.items.length;
    if (configuredCount === 0) {
      toast.info(`No ads configured yet for ${pageConfig?.label ?? activeTab}`);
    } else {
      toast.success(`${configuredCount} of ${totalPositions} ad positions configured for ${pageConfig?.label ?? activeTab}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Show toast when article list loads on article tab
  React.useEffect(() => {
    if (!articlesData || articlesLoading || activeTab !== "article") return;
    const total = articlesData.pagination?.totalCount ?? articlesData.articles?.length ?? 0;
    const withAds = (articlesData.articles ?? []).filter(
      (a: any) => a.adOverrides && a.adOverrides.length > 0
    ).length;
    if (total === 0) {
      toast.info("No articles found");
    } else {
      toast.success(`${total} articles found — ${withAds} configured with custom ads`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articlesData]);

  // Save/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (editData: EditingPosition) => {
      const existingAd = data?.items?.find(
        (a) => a.pageType === editData.pageType && a.position === editData.position
      );

      // Native feed ads are "non-empty" if they have nativeContent with title
      const isNativeFeed = editData.templateType === "native_feed";
      const isEmpty = isNativeFeed
        ? !(editData.nativeContent?.title?.trim())
        : (
            (editData.type === 'html' && editData.code.trim() === "") ||
            (editData.type !== 'html' && editData.type !== 'vast' && editData.url.trim() === "") ||
            (editData.type === 'vast' && editData.vastUrl.trim() === "")
          );

      if (isEmpty) {
        if (existingAd) {
          const res = await fetch(`/api/ads/${existingAd._id}`, { method: "DELETE" });
          if (!res.ok) throw new Error("Failed to delete ad");
        }
        return { deleted: true };
      } else {
        const url = existingAd ? `/api/ads/${existingAd._id}` : "/api/ads";
        const method = existingAd ? "PUT" : "POST";

        const positionConfig = PAGE_CONFIG
          .find(p => p.type === editData.pageType)
          ?.positions.find(pos => pos.id === editData.position);

        const payload: Record<string, any> = {
          name: `${editData.pageType}-${editData.position}-${Date.now()}`,
          label: positionConfig?.name || editData.position,
          pageType: editData.pageType,
          position: editData.position,
          type: editData.type,
          url: editData.url,
          vastUrl: editData.vastUrl,
          code: editData.code,
          status: editData.status,
          enabled: editData.enabled,
          // New structured data fields
          mediaUrl: editData.mediaUrl || editData.url,
          vastTagUrl: editData.vastTagUrl || editData.vastUrl,
          clickThroughUrl: editData.clickThroughUrl,
          templateType: editData.templateType || "legacy",
          creativeType: editData.creativeType || "",
        };

        // Include native content fields for native_feed ads
        if (isNativeFeed && editData.nativeContent) {
          payload.nativeContent = editData.nativeContent;
          // Use nativeContent.clickThroughUrl as the main clickThroughUrl
          payload.clickThroughUrl = editData.nativeContent.clickThroughUrl || editData.clickThroughUrl;
        }
        if (editData.trackingPixels) {
          payload.trackingPixels = editData.trackingPixels;
        }

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const json = await res.json();
          throw new Error(json?.error ?? "Save failed");
        }
        return res.json();
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      if (result.deleted) {
        toast.success("Ad position cleared successfully!");
      } else {
        toast.success("Ad position saved successfully!");
      }
      setEditingPosition(null);
    },
    onError: (error: Error) => {
      toast.error(`Failed to save ad: ${error.message}`);
    },
  });

  // Delete ad mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ pageType, position }: { pageType: PageType; position: string }) => {
      const existingAd = data?.items?.find(
        (a) => a.pageType === pageType && a.position === position
      );
      if (!existingAd) throw new Error("No ad to remove");
      const res = await fetch(`/api/ads/${existingAd._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete ad");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      toast.success("Ad removed successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove ad: ${error.message}`);
    },
  });

  // Toggle enabled status
  const toggleMutation = useMutation({
    mutationFn: async (toggleData: { pageType: PageType; position: string; enabled: boolean }) => {
      const existingAd = data?.items?.find(
        (a) => a.pageType === toggleData.pageType && a.position === toggleData.position
      );
      if (!existingAd) throw new Error("No ad configured for this position");

      const res = await fetch(`/api/ads/${existingAd._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...existingAd, enabled: toggleData.enabled }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json?.error ?? "Update failed");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      toast.success(`Ad position ${variables.enabled ? 'enabled' : 'disabled'} successfully!`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update ad: ${error.message}`);
    },
  });

  // Update article ad overrides
  const updateArticleOverridesMutation = useMutation({
    mutationFn: async ({ slug, adOverrides }: { slug: string; adOverrides: any[] }) => {
      const res = await fetch(`/api/articles/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adOverrides }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json?.error ?? "Update failed");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      queryClient.invalidateQueries({ queryKey: ["article", variables.slug] });
      toast.success("Article ad overrides saved successfully!");
      setSelectedArticleSlug(null);
    },
    onError: (error: Error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });

  const handleEditPosition = (pageType: PageType, position: string) => {
    const existingAd = data?.items?.find(
      (a) => a.pageType === pageType && a.position === position
    );

    setEditingPosition({
      pageType,
      position,
      type: existingAd?.type || "html",
      url: existingAd?.url || "",
      vastUrl: existingAd?.vastUrl || existingAd?.vastTagUrl || "",
      code: existingAd?.code || "",
      status: existingAd?.status ?? existingAd?.enabled ?? true,
      enabled: existingAd?.enabled ?? true,
      // Carry over structured media fields
      mediaUrl: (existingAd as any)?.mediaUrl || existingAd?.url || "",
      clickThroughUrl: (existingAd as any)?.clickThroughUrl || "",
      vastTagUrl: (existingAd as any)?.vastTagUrl || "",
      creativeType: (existingAd as any)?.creativeType || "",
      // Carry over template type and native content if present
      templateType: (existingAd as any)?.templateType || undefined,
      nativeContent: (existingAd as any)?.nativeContent || undefined,
      trackingPixels: (existingAd as any)?.trackingPixels || undefined,
    });
  };

  const handlePreviewAd = (ad: AdSnippet, position: string) => {
    const isNative = (ad as any).templateType === "native_feed";
    const adType: "html" | "image" | "video" | "vast" | "audio" | "native_feed" =
      isNative ? "native_feed" :
      (ad.vastUrl || ad.vastTagUrl) ? "vast" :
      ad.type === "video" ? "video" :
      ad.type === "image" ? "image" :
      ad.mediaUrl && /\.(mp3|wav|ogg)$/i.test(ad.mediaUrl) ? "audio" :
      ad.mediaUrl && /\.(mp4|webm|mov)$/i.test(ad.mediaUrl) ? "video" :
      ad.mediaUrl && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(ad.mediaUrl) ? "image" :
      "html";

    setPreviewData({
      code: ad.code || "",
      vastTagUrl: ad.vastUrl || ad.vastTagUrl || "",
      mediaUrl: ad.mediaUrl || ad.url || "",
      adType,
      position,
      adSnippetId: ad._id,
      nativeContent: (ad as any).nativeContent,
    });
    setPreviewOpen(true);
  };

  const handleSave = () => {
    if (!editingPosition) return;
    saveMutation.mutate(editingPosition);
  };

  const handleSaveFromPreview = async () => {
    if (!previewData || !previewData.adSnippetId) return;
    toast.success("Ad configuration confirmed and synced!");
    setPreviewOpen(false);
  };

  const handleCancel = () => {
    setEditingPosition(null);
  };

  const handleToggleEnabled = (pageType: PageType, position: string, enabled: boolean) => {
    toggleMutation.mutate({ pageType, position, enabled });
  };

  const handleRemoveAd = (pageType: PageType, position: string) => {
    deleteMutation.mutate({ pageType, position });
  };

  // Filter positions based on search query
  const filterPositions = (positions: typeof PAGE_CONFIG[0]["positions"]) => {
    if (!adPositionSearch.trim()) return positions;
    const query = adPositionSearch.toLowerCase();
    return positions.filter(pos =>
      pos.name.toLowerCase().includes(query) ||
      pos.description.toLowerCase().includes(query) ||
      pos.id.toLowerCase().includes(query)
    );
  };

  const getFilteredPageConfigs = () => {
    if (!adPositionSearch.trim()) return PAGE_CONFIG;
    return PAGE_CONFIG.map(config => ({
      ...config,
      positions: filterPositions(config.positions)
    })).filter(config => config.positions.length > 0);
  };

  const filteredPageConfigs = getFilteredPageConfigs();

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
        searchInput?.focus();
      }
      // Ctrl/Cmd + , to open settings
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        setSettingsOpen(true);
      }
      // Escape to close dialogs
      if (e.key === 'Escape') {
        if (settingsOpen) setSettingsOpen(false);
        if (editingPosition) setEditingPosition(null);
        if (previewOpen) setPreviewOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settingsOpen, editingPosition, previewOpen]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">Ads Manager</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Manage advertisement placements across your website. Enable/disable positions, configure ad snippets, and preview ads.
        </p>
      </div>

      {/* Search Bar and Settings */}
      <div className="flex items-center justify-between gap-4">
        <SearchBar
          value={adPositionSearch}
          onChange={setAdPositionSearch}
          placeholder="Search ad positions by name, position, or description... (Ctrl+K)"
          className="max-w-md flex-1"
        />
        <div className="relative group">
          <Button
            variant="default"
            onClick={() => setSettingsOpen(true)}
            className="shrink-0 bg-black text-white hover:bg-gray-900 border border-black dark:bg-white dark:text-black dark:hover:bg-gray-200 dark:border-white transition-all shadow-md font-bold px-6"
            aria-label="Open ad settings"
            title="Open Settings (Ctrl+,)"
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as PageType)}>
        <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          {filteredPageConfigs.map((config) => (
            <TabsTrigger
              key={config.type}
              value={config.type}
              className="data-[state=active]:bg-[#ef4444] data-[state=active]:text-white hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
            >
              {config.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {filteredPageConfigs.map((config) => (
          <TabsContent key={config.type} value={config.type} className="space-y-4">
            {config.type === "article" ? (
              // Article Page Tab — Two sub-tabs: Global Article Ads + Article Overrides
              <div className="space-y-4">
                <Tabs value={articleSubTab} onValueChange={(v) => setArticleSubTab(v as "global" | "overrides")}>
                  <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <TabsTrigger value="global" className="data-[state=active]:bg-[#ef4444] data-[state=active]:text-white hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors">
                      Global Article Ads
                    </TabsTrigger>
                    <TabsTrigger value="overrides" className="data-[state=active]:bg-[#ef4444] data-[state=active]:text-white hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors">
                      Article Overrides
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="global" className="space-y-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Configure global ad positions that apply to ALL articles. Articles can override these with custom ads in the "Article Overrides" tab.
                    </div>

                    {adsLoading ? (
                      <div className="grid gap-4">
                        {[1, 2, 3].map((i) => (
                          <Card key={i} className="relative border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 animate-pulse">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="space-y-2 flex-1">
                                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                                </div>
                              </div>
                            </CardHeader>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {config.positions.map((pos) => {
                          const ad = data?.items?.find(
                            (a) => a.pageType === "article" && a.position === pos.id
                          );
                          const isNativeAd = (ad as any)?.templateType === "native_feed" && (ad as any)?.nativeContent?.title;
                          const hasCode = (ad && ad.code.trim() !== "") || isNativeAd;
                          const isEnabled = ad?.enabled ?? false;

                          return (
                            <Card key={pos.id} className="relative border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:shadow-md transition-shadow">
                              <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                  <div className="space-y-1">
                                    <CardTitle className="text-base text-gray-900 dark:text-gray-100">{pos.name}</CardTitle>
                                    <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                                      {pos.description}
                                    </CardDescription>
                                    {isNativeAd ? (
                                      <Badge variant="outline" className="text-xs border-orange-300 text-orange-700 dark:border-orange-600 dark:text-orange-400">
                                        📰 Native Feed Ad
                                      </Badge>
                                    ) : hasCode && (
                                      <Badge variant="outline" className="text-xs">
                                        {ad?.type} format
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {ad && (
                                      <Badge 
                                        variant={isEnabled ? "default" : "secondary"}
                                        className={isEnabled ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}
                                      >
                                        {isEnabled ? (
                                          <><Power className="mr-1 h-3 w-3" />Enabled</>
                                        ) : (
                                          <><PowerOff className="mr-1 h-3 w-3" />Disabled</>
                                        )}
                                      </Badge>
                                    )}
                                    {!hasCode && (
                                      <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400">
                                        Not Configured
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {hasCode && (
                                      <div className="flex items-center space-x-2">
                                        <Switch
                                          checked={isEnabled}
                                          onCheckedChange={(enabled) =>
                                            handleToggleEnabled("article", pos.id, enabled)
                                          }
                                          disabled={toggleMutation.isPending}
                                          aria-label={`Toggle ad visibility for ${pos.name}`}
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">
                                          {isEnabled ? "Visible on website" : "Hidden from website"}
                                        </span>
                                      </div>
                                    )}
                                    {!hasCode && (
                                      <span className="text-sm text-gray-500 dark:text-gray-500">
                                        No ad snippet configured
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex gap-2">
                                    {hasCode && ad && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePreviewAd(ad, pos.id)}
                                        className="text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-400 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-950/50 transition-colors"
                                      >
                                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                                        Preview
                                      </Button>
                                    )}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEditPosition("article", pos.id)}
                                      className="border-gray-300 hover:bg-gray-100 hover:border-gray-400 dark:border-gray-600 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                                    >
                                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                                      {hasCode ? "Edit Ad" : "Add Ad"}
                                    </Button>
                                    {hasCode && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRemoveAd("article", pos.id)}
                                        disabled={deleteMutation.isPending}
                                        className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-950/50 transition-colors disabled:opacity-50"
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
                    )}
                  </TabsContent>

                  <TabsContent value="overrides" className="space-y-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Override global ads for specific articles. Select an article below to manage its custom ad placements. Per-article overrides always take priority over global defaults.
                    </div>

                    {selectedArticleSlug && selectedArticle ? (
                      <ArticleAdEditor
                        article={selectedArticle}
                        onBack={() => setSelectedArticleSlug(null)}
                        onSave={(adOverrides) => {
                          updateArticleOverridesMutation.mutate({
                            slug: selectedArticleSlug,
                            adOverrides,
                          });
                        }}
                        isSaving={updateArticleOverridesMutation.isPending}
                      />
                    ) : (
                      <div className="space-y-4">
                        <ArticleSearchBar
                          value={articleSearchQuery}
                          onChange={(value) => {
                            setArticleSearchQuery(value);
                            setArticlePage(1);
                          }}
                        />
                        <ArticleList
                          articles={articlesData?.articles || []}
                          pagination={articlesData?.pagination || {
                            currentPage: 1,
                            totalPages: 1,
                            totalCount: 0,
                            hasNextPage: false,
                            hasPrevPage: false,
                          }}
                          onEdit={(slug) => setSelectedArticleSlug(slug)}
                          onPageChange={setArticlePage}
                          isLoading={articlesLoading}
                          error={articlesError as Error}
                        />
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              // Other tabs (homepage, category, website)
              <>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {config.description}
                </div>

                {adsLoading ? (
                  // Loading skeleton
                  <div className="grid gap-4">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="relative border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 animate-pulse">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                            </div>
                            <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                            <div className="flex gap-2">
                              <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                              <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : config.positions.length === 0 ? (
                  // Empty state when no positions match search
                  <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-4 mb-4">
                        <Settings className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        No ad positions found
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-md">
                        No ad positions match your search. Try adjusting your search terms or clear the search to see all positions.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                  {config.positions.map((pos) => {
                    const ad = data?.items?.find(
                      (a) => a.pageType === activeTab && a.position === pos.id
                    );
                    const isNativeAd = (ad as any)?.templateType === "native_feed" && (ad as any)?.nativeContent?.title;
                    const hasCode = (ad && ad.code.trim() !== "") || isNativeAd;
                    const isEnabled = ad?.enabled ?? false;
                    const template = ad?.templateId ? templates.find(t => t.id === ad.templateId) : null;

                    return (
                      <Card key={pos.id} className="relative border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <CardTitle className="text-base text-gray-900 dark:text-gray-100">{pos.name}</CardTitle>
                              <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                                {pos.description}
                              </CardDescription>
                              {template && (
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="secondary" className="text-xs">
                                    Template: {template.name}
                                  </Badge>
                                  {ad?.customCode && (
                                    <Badge variant="outline" className="text-xs">
                                      Custom Code
                                    </Badge>
                                  )}
                                </div>
                              )}
                              {isNativeAd ? (
                                <Badge variant="outline" className="text-xs border-orange-300 text-orange-700 dark:border-orange-600 dark:text-orange-400">
                                  📰 Native Feed Ad
                                </Badge>
                              ) : hasCode && (
                                <Badge variant="outline" className="text-xs">
                                  {ad?.type} format
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {ad && (
                                <Badge 
                                  variant={isEnabled ? "default" : "secondary"}
                                  className={isEnabled ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}
                                >
                                  {isEnabled ? (
                                    <>
                                      <Power className="mr-1 h-3 w-3" />
                                      Enabled
                                    </>
                                  ) : (
                                    <>
                                      <PowerOff className="mr-1 h-3 w-3" />
                                      Disabled
                                    </>
                                  )}
                                </Badge>
                              )}
                              {!hasCode && (
                                <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400">
                                  Not Configured
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {hasCode && (
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    checked={isEnabled}
                                    onCheckedChange={(enabled) =>
                                      handleToggleEnabled(activeTab, pos.id, enabled)
                                    }
                                    disabled={toggleMutation.isPending}
                                    aria-label={`Toggle ad visibility for ${pos.name}`}
                                  />
                                  <span className="text-sm text-gray-700 dark:text-gray-300">
                                    {isEnabled ? "Visible on website" : "Hidden from website"}
                                  </span>
                                </div>
                              )}
                              {!hasCode && (
                                <span className="text-sm text-gray-500 dark:text-gray-500">
                                  No ad snippet configured
                                </span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {/* Preview Ad */}
                              {hasCode && ad && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePreviewAd(ad, pos.id)}
                                  className="text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-400 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-950/50 dark:hover:border-blue-600 transition-colors"
                                  aria-label={`Preview ad for ${pos.name}`}
                                >
                                  <Eye className="mr-1.5 h-3.5 w-3.5" />
                                  Preview Ad
                                </Button>
                              )}
                              {/* Edit / Add */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditPosition(activeTab, pos.id)}
                                className="border-gray-300 hover:bg-gray-100 hover:border-gray-400 dark:border-gray-600 dark:hover:bg-gray-800 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300 transition-colors"
                                aria-label={hasCode ? `Edit ad for ${pos.name}` : `Add ad for ${pos.name}`}
                              >
                                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                                {hasCode ? "Edit Ad" : "Add Ad"}
                              </Button>
                              {/* Remove Ad */}
                              {hasCode && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoveAd(activeTab, pos.id)}
                                  disabled={deleteMutation.isPending}
                                  className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-950/50 dark:hover:border-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  aria-label={`Remove ad from ${pos.name}`}
                                >
                                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                  Remove Ad
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                )}
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Edit Position Dialog */}
      <Dialog open={!!editingPosition} onOpenChange={() => setEditingPosition(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Ad Position</DialogTitle>
            <DialogDescription>
              {editingPosition && (
                <>
                  {PAGE_CONFIG.find(p => p.type === editingPosition.pageType)?.positions
                    .find(pos => pos.id === editingPosition.position)?.name} —{" "}
                  {PAGE_CONFIG.find(p => p.type === editingPosition.pageType)?.label}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {editingPosition && (
            <AdSnippetEditor
              editingPosition={editingPosition}
              setEditingPosition={setEditingPosition}
              onSave={handleSave}
              onCancel={handleCancel}
              isLoading={saveMutation.isPending}
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
          nativeContent={previewData.nativeContent}
          position={previewData.position}
          title={`Preview — ${PAGE_CONFIG.flatMap(c => c.positions).find(p => p.id === previewData.position)?.name || previewData.position}`}
          allowSizingAdjustment={true}
          onSaveAd={handleSaveFromPreview}
        />
      )}

      {/* Settings Panel */}
      <AdSettingsPanel
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </div>
  );
}