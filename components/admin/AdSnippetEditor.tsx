"use client";

import * as React from "react";
import { useState, useCallback, useRef } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import {
  Save, X, FileImage, FileVideo,
  Image as ImageIcon, Video, Music, Eye,
  Upload, Code, LayoutTemplate, Info,
  CheckCircle2, AlertTriangle,
  Database, Link2, Newspaper
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DialogFooter } from "@/components/ui/dialog";
import { MediaSelectionModal } from "./MediaSelectionModal";
import type { MediaItem } from "./MediaSelectionModal";
import { cn } from "@/lib/utils";
import { uploadToCDNWithCancel } from "@/lib/uploaders/cdnUploader";
import { uploadToSupabaseWithCancel } from "@/lib/uploaders/supabaseUploader";
import { POSITION_SIZE_CONFIG } from "@/lib/constants/adSizes";
import { validateFile } from "@/lib/utils/fileValidator";
import { validateMediaForTemplate, detectMediaType } from "@/lib/constants/templateMediaRules";

export interface NativeContentData {
  title: string;
  excerpt: string;
  image: string;
  sponsorLabel: string;
  sponsorName: string;
  sponsorLogo: string;
  clickThroughUrl: string;
  category: string;
  categoryColor: string;
  readTime: string;
  author: string;
  layout: "column" | "row";
  cardStyle: "news-grid" | "sidebar-list" | "sidebar-featured" | "latest-articles" | "hero-side" | "review-list" | "carousel";
}

export interface TrackingPixelsData {
  impression: string;
  click: string;
}

export interface EditingPosition {
  pageType: "homepage" | "article" | "category" | "website";
  position: string;
  type: "html" | "image" | "video" | "vast";
  code: string;
  url: string;
  vastUrl: string;
  status: boolean;
  enabled: boolean;
  templateId?: string;
  templateVariables?: Record<string, any>;
  customCode?: boolean;
  // new fields!
  mediaUrl?: string;
  clickThroughUrl?: string;
  vastTagUrl?: string;
  templateType?: string;
  creativeType?: string;
  // Native feed ad fields
  nativeContent?: NativeContentData;
  trackingPixels?: TrackingPixelsData;
}

interface Props {
  editingPosition: EditingPosition;
  setEditingPosition: React.Dispatch<React.SetStateAction<EditingPosition | null>> | ((position: EditingPosition) => void);
  onSave: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

// Predefined ad templates
const PREDEFINED_TEMPLATES = [
  {
    key: "image",
    icon: ImageIcon,
    name: "Image Ad",
    description: "Simple responsive image advertisement",
  },
  {
    key: "html_banner",
    icon: ImageIcon,
    name: "HTML/Image Banner",
    description: "Static image or HTML banner ad (no video)",
  },
  {
    key: "video",
    icon: Video,
    name: "Video Ad",
    description: "Responsive video advertisement with controls",
  },
  {
    key: "video_banner",
    icon: Video,
    name: "Video Banner",
    description: "Video banner with optional VAST ad support",
  },
  {
    key: "audio",
    icon: Music,
    name: "Audio Ad",
    description: "Audio advertisement with custom controls",
  },
  {
    key: "vast_preroll",
    icon: Video,
    name: "VAST Pre-roll Video",
    description: "Autoplay silent video with VAST ads support",
  },
  {
    key: "native_feed",
    icon: Newspaper,
    name: "Native Feed Ad",
    description: "Content-style ad that blends with article cards in feeds",
  },
] as const;

type TemplateKey = typeof PREDEFINED_TEMPLATES[number]["key"];

const TEMPLATE_CODE: Record<TemplateKey, string> = {
  image: `<div style="text-align:center;margin:20px 0;">
  <a href="{{clickUrl}}" target="_blank" rel="noopener">
    <img src="{{mediaUrl}}" alt="Advertisement"
      style="max-width:100%;height:auto;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);" />
  </a>
</div>`,
  html_banner: `<div style="text-align:center;margin:20px 0;">
  <a href="{{clickUrl}}" target="_blank" rel="noopener">
    <img src="{{mediaUrl}}" alt="Advertisement"
      style="max-width:100%;height:auto;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);" />
  </a>
</div>`,
  vast_preroll: `<script>
(function () {
  const VAST_TAG_URL = "{{vastTagUrl}}";
  const VIDEO_URL = "{{mediaUrl}}";
  const CLICK_URL = "{{clickUrl}}";
  const SLOT_ID = "nv-banner-video-player-{{id}}";

  // Create container if not exists (for AdSlot injection)
  let container = document.getElementById(SLOT_ID);
  if (!container) {
    document.write('<div id="' + SLOT_ID + '" class="video-js" style="width:100%;aspect-ratio:16/9;background:#000;border-radius:8px;overflow:hidden;"></div>');
  }

  // Wait for page to be fully interactive
  function initWhenReady() {
    if (typeof videojs === 'undefined') {
      setTimeout(initWhenReady, 100);
      return;
    }

    // Initialize Video.js
    const player = videojs(SLOT_ID, {
      autoplay: 'muted',
      muted: true,
      loop: true,
      controls: true,
      preload: "auto",
      fluid: true
    });

    player.ready(function () {

      // Set main video source FIRST
      if (VIDEO_URL && VIDEO_URL.trim() !== "") {
        player.src({
          src: VIDEO_URL,
          type: "video/mp4"
        });
      }

      // Setup IMA if VAST URL exists
      if (VAST_TAG_URL && VAST_TAG_URL.trim() !== "") {
        player.ima({
          adTagUrl: VAST_TAG_URL,
          debug: true,
          disableCustomPlaybackForIOS10Plus: true
        });

        // Initialize IMA when video starts playing
        player.one('playing', function() {
          setTimeout(() => {
            try {
              player.ima.initializeAdDisplayContainer();
              player.ima.requestAds();
            } catch(e) { 
              console.error("❌ [VAST Template] IMA Init Error", e);
            }
          }, 100);
        });
      }
      
      // Handle click-through if provided
      if(CLICK_URL && CLICK_URL !== "#") {
          player.on('click', () => window.open(CLICK_URL, '_blank'));
      }

      // Handle ad errors
      player.on('adserror', (e) => {
        console.warn("⚠️ [VAST Template] Ad error, playing content video", e);
      });

      // Auto-loop after content ends
      player.on('ended', () => {
        player.play();
      });
    });
  }

  initWhenReady();
})();
</script>`,
  native_feed: "", // Native ads use nativeContent fields instead of a code template
  video_banner: `<script>
(function () {
  const VAST_TAG_URL = "{{vastTagUrl}}";
  const VIDEO_URL = "{{mediaUrl}}";
  const CLICK_URL = "{{clickUrl}}";
  const SLOT_ID = "nv-banner-video-player-{{id}}";

  let container = document.getElementById(SLOT_ID);
  if (!container) {
    document.write('<div id="' + SLOT_ID + '" class="video-js" style="width:100%;aspect-ratio:16/9;background:#000;border-radius:8px;overflow:hidden;"></div>');
  }

  function initWhenReady() {
    if (typeof videojs === 'undefined') {
      setTimeout(initWhenReady, 100);
      return;
    }

    const player = videojs(SLOT_ID, {
      autoplay: 'muted',
      muted: true,
      loop: true,
      controls: true,
      preload: "auto",
      fluid: true
    });

    player.ready(function () {
      if (VIDEO_URL && VIDEO_URL.trim() !== "") {
        player.src({ src: VIDEO_URL, type: "video/mp4" });
      }

      if (VAST_TAG_URL && VAST_TAG_URL.trim() !== "") {
        player.ima({
          adTagUrl: VAST_TAG_URL,
          debug: true,
          disableCustomPlaybackForIOS10Plus: true
        });

        player.one('playing', function() {
          setTimeout(() => {
            try {
              player.ima.initializeAdDisplayContainer();
              player.ima.requestAds();
            } catch(e) { 
              console.error("Video Banner: IMA Init Error", e);
            }
          }, 100);
        });
      }
      
      if(CLICK_URL && CLICK_URL !== "#") {
          player.on('click', () => window.open(CLICK_URL, '_blank'));
      }

      player.on('adserror', (e) => {
        console.warn("Video Banner: Ad error, playing content video", e);
      });

      player.on('ended', () => {
        player.play();
      });
    });
  }

  initWhenReady();
})();
</script>`,
  audio: `<div class="audio-ad-container">
  <audio class="audio-player" controls>
    <source src="{{mediaUrl}}" type="audio/mpeg">
  </audio>
</div>`,
  video: `<script>
(function () {
  const VAST_TAG_URL = "{{vastTagUrl}}";
  const VIDEO_URL = "{{mediaUrl}}";
  const CLICK_URL = "{{clickUrl}}";
  const SLOT_ID = "nv-banner-video-player-{{id}}";

  // Create container if not exists (for AdSlot injection)
  let container = document.getElementById(SLOT_ID);
  if (!container) {
    document.write('<div id="' + SLOT_ID + '" class="video-js" style="width:100%;aspect-ratio:16/9;background:#000;border-radius:8px;overflow:hidden;"></div>');
  }

  // Wait for page to be fully interactive
  function initWhenReady() {
    if (typeof videojs === 'undefined') {
      setTimeout(initWhenReady, 100);
      return;
    }

    // Initialize Video.js
    const player = videojs(SLOT_ID, {
      autoplay: 'muted',
      muted: true,
      loop: true,
      controls: true,
      preload: "auto",
      fluid: true
    });

    player.ready(function () {
      console.log("🎬 [VAST Template] Player Ready");

      // Set main video source FIRST
      if (VIDEO_URL && VIDEO_URL.trim() !== "") {
        player.src({
          src: VIDEO_URL,
          type: "video/mp4"
        });
      }

      // Setup IMA if VAST URL exists
      if (VAST_TAG_URL && VAST_TAG_URL.trim() !== "") {
        player.ima({
          adTagUrl: VAST_TAG_URL,
          debug: true,
          disableCustomPlaybackForIOS10Plus: true
        });

        // Initialize IMA when video starts playing
        player.one('playing', function() {
          setTimeout(() => {
            try {
              player.ima.initializeAdDisplayContainer();
              player.ima.requestAds();
            } catch(e) { 
              console.error("❌ [VAST Template] IMA Init Error", e);
            }
          }, 100);
        });
      }
      
      // Handle click-through if provided
      if(CLICK_URL && CLICK_URL !== "#") {
          player.on('click', () => window.open(CLICK_URL, '_blank'));
      }

      // Handle ad errors
      player.on('adserror', (e) => {
        console.warn("⚠️ [VAST Template] Ad error, playing content video", e);
      });

      // Auto-loop after content ends
      player.on('ended', () => {
        player.play();
      });
    });
  }

  initWhenReady();
})();
</script>`,
};

export default function AdSnippetEditor({
  editingPosition,
  setEditingPosition,
  onSave,
  onCancel,
  isLoading,
}: Props): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<"custom" | "native" | "media">("custom");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastSetBy, setLastSetBy] = useState<"manual" | "upload" | "none">(() => {
    if (editingPosition.mediaUrl || editingPosition.url) return "manual";
    return "none";
  });
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey | "">(() => {
    const type = editingPosition.templateType;
    if (type === "direct_banner") return "image";
    if (type === "html_banner") return "html_banner";
    if (type === "direct_video") return "video";
    if (type === "video_banner") return "video_banner";
    if (type === "audio_ad") return "audio";
    if (type === "vast_preroll") return "vast_preroll";
    if (type === "native_feed") return "native_feed";
    
    // Fallback: detect from code
    const code = editingPosition.code || "";
    if (code.includes('video-js') || code.includes('video/mp4')) return "video";
    if (code.includes('<img')) return "image";
    if (code.includes('<audio')) return "audio";
    
    return "";
  });

  // Native feed ad content state
  const DEFAULT_NATIVE_CONTENT: NativeContentData = {
    title: "", excerpt: "", image: "", sponsorLabel: "Sponsored",
    sponsorName: "", sponsorLogo: "", clickThroughUrl: "",
    category: "", categoryColor: "", readTime: "", author: "", layout: "column", cardStyle: "news-grid",
  };
  const [nativeContent, setNativeContent] = useState<NativeContentData>(
    editingPosition.nativeContent || DEFAULT_NATIVE_CONTENT
  );
  const [trackingPixels, setTrackingPixels] = useState<TrackingPixelsData>(
    editingPosition.trackingPixels || { impression: "", click: "" }
  );
  const [nativeImageSelectionOpen, setNativeImageSelectionOpen] = useState(false);
  const [nativeLogoSelectionOpen, setNativeLogoSelectionOpen] = useState(false);
  const [mediaUrl, setMediaUrl] = useState(editingPosition.mediaUrl || editingPosition.url || "");
  const [clickUrl, setClickUrl] = useState(editingPosition.clickThroughUrl || "");
  const [mediaSelectionOpen, setMediaSelectionOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Apply template — injects media/click/VAST URLs into the code
  const applyTemplate = useCallback(
    (key: TemplateKey, currentMediaUrl: string, currentClickUrl: string) => {
      const updateFn = (prev: EditingPosition | null): EditingPosition | null => {
        if (!prev) return null;
        let code = TEMPLATE_CODE[key];
        // Generic simple replacements
        code = code.replace(/\{\{mediaUrl\}\}/g, currentMediaUrl || "https://via.placeholder.com/400x200?text=Select+Media");
        code = code.replace(/\{\{clickUrl\}\}/g, currentClickUrl || "#");
        code = code.replace(/\{\{vastTagUrl\}\}/g, prev.vastTagUrl || prev.vastUrl || "");
        // Mapped custom VAST replacements
        code = code.replace(/YOUR_VAST_TAG_URL_HERE/g, prev.vastTagUrl || prev.vastUrl || "");
        code = code.replace(/YOUR_CDN_VIDEO_URL_HERE\.mp4/g, currentMediaUrl || "");
        
        // Preserve or generate stable ID
        let id = Date.now().toString();
        const existingIdMatch = prev.code?.match(/nv-banner-video-player-([a-zA-Z0-9_-]+)/);
        if (existingIdMatch && existingIdMatch[1]) {
          id = existingIdMatch[1];
        } else if (prev.position) {
          id = prev.position.replace(/[^a-zA-Z0-9]/g, '-');
        }
        code = code.replace(/\{\{id\}\}/g, id);
        
        let newTemplateType = "legacy";
        if (key === "vast_preroll") newTemplateType = "vast_preroll";
        else if (key === "image") newTemplateType = "direct_banner";
        else if (key === "html_banner") newTemplateType = "html_banner";
        else if (key === "video") newTemplateType = "direct_video";
        else if (key === "video_banner") newTemplateType = "video_banner";
        else if (key === "audio") newTemplateType = "audio_ad";
        else if (key === "native_feed") newTemplateType = "native_feed";

        // Native feed ads don't use code — they use nativeContent fields
        if (key === "native_feed") {
          return {
            ...prev,
            code: "",
            templateType: "native_feed",
            type: "html",
            customCode: false,
            nativeContent: prev.nativeContent || nativeContent,
            trackingPixels: prev.trackingPixels || trackingPixels,
          };
        }

        return { 
          ...prev, 
          code, 
          url: currentMediaUrl,
          mediaUrl: currentMediaUrl,
          clickThroughUrl: currentClickUrl,
          // Only use 'vast' type for video-compatible templates that actually have a VAST URL
          type: (key === "vast_preroll" || (key === "video" && (prev.vastTagUrl || prev.vastUrl))) ? "vast" : "html", 
          templateType: newTemplateType,
          customCode: false,
          // Clear VAST URL when switching to non-video templates (image, audio)
          ...(key === "image" || key === "audio" ? { vastUrl: "", vastTagUrl: "" } : {}),
        };
      };

      if (typeof setEditingPosition === "function") {
          // Check if it's a Dispatch/React.SetStateAction (which takes a function) or a simple callback
          try {
              (setEditingPosition as any)(updateFn);
          } catch(e) {
              (setEditingPosition as any)(updateFn(editingPosition));
          }
      }
    },
    [editingPosition, setEditingPosition]
  );

  const handleTemplateSelect = (key: TemplateKey) => {
    setSelectedTemplate(key);
    applyTemplate(key, mediaUrl, clickUrl);
    setActiveTab("custom"); // Jump to Custom Code so user sees the generated code
    toast.success(`${PREDEFINED_TEMPLATES.find((t) => t.key === key)?.name} template applied!`);
  };

  // CDN dropzone upload
  const onDrop = useCallback(
    async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      // Handle file rejections from dropzone (e.g. too large, wrong type)
      if (fileRejections.length > 0) {
        fileRejections.forEach(({ file, errors }) => {
          errors.forEach(err => {
            const style = { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #f87171' };
            if (err.code === "file-too-large") {
              toast.error(`File "${file.name}" is too large. Max size is 500MB.`, { style });
            } else if (err.code === "file-invalid-type") {
              toast.error(`File type of "${file.name}" is not supported.`, { style });
            } else {
              toast.error(`${file.name}: ${err.message}`, { style });
            }
          });
        });
        return;
      }

      const file = acceptedFiles[0];
      if (!file) return;

      // Immediate validation before starting upload
      const validation = validateFile(file, 'supabase');
      if (!validation.valid) {
        toast.error(validation.error || "File validation failed", {
          style: { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #f87171' }
        });
        return;
      }

      // ─── NEW: Immediate Dimension Validation ───
      const checkDimensions = async () => {
        let maxW = 748;
        let maxH = 110;
        const config = POSITION_SIZE_CONFIG[editingPosition.position as any];
        if (config) {
          maxW = config.desktop.width;
          maxH = config.desktop.height;
        }

        const isVid = file.type.startsWith('video/');
        const dims = await new Promise<{w:number, h:number}>(resolve => {
          const url = URL.createObjectURL(file);
          if (isVid) {
            const v = document.createElement('video');
            v.src = url;
            v.onloadedmetadata = () => {
              resolve({w: v.videoWidth, h: v.videoHeight});
              URL.revokeObjectURL(url);
            };
            v.onerror = () => resolve({w:0, h:0});
          } else {
            const i = new Image();
            i.src = url;
            i.onload = () => {
              resolve({w: i.width, h: i.height});
              URL.revokeObjectURL(url);
            };
            i.onerror = () => resolve({w:0, h:0});
          }
          setTimeout(() => resolve({w:0, h:0}), 3000);
        });

        if (dims.w > 0 && (dims.w >= maxW * 1.5 || dims.h >= maxH * 1.5)) {
          toast.error("MEDIA SIZE VALIDATION FAILED", {
            description: `Media (${dims.w}x${dims.h}) is too large for the ${maxW}x${maxH} slot. Max allowed for quality is ${maxW * 1.5}x${maxH * 1.5} (1.5x).`,
            duration: 8000,
            style: { backgroundColor: '#fee2e2', color: '#991b1b', border: '2px solid #ef4444' }
          });
          return false;
        }
        return true;
      };

      const isDimValid = await checkDimensions();
      if (!isDimValid) return;

      setUploading(true);
      setProgress(0);
      try {
        const { promise } = uploadToSupabaseWithCancel(
          file,
          { folder: "ads", contentType: file.type },
          (p) => setProgress(p)
        );
        const result = await promise;
        const newCreativeType = /\.(mp4|webm)$/i.test(result.url) ? 'video' : /\.(mp3|wav|ogg)$/i.test(result.url) ? 'audio' : 'image';
        
        // Validate media type against selected template
        if (selectedTemplate) {
          const validation = validateMediaForTemplate(selectedTemplate, result.url);
          if (!validation.valid) {
            toast.error(validation.error || "Media type not compatible with selected template", {
              style: { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #f87171' }
            });
            setUploading(false);
            return;
          }
        }
        
        const templateToApply = selectedTemplate || (newCreativeType === 'video' ? 'video' : newCreativeType === 'audio' ? 'audio' : 'image');
        
        if (!selectedTemplate) {
          setSelectedTemplate(templateToApply as TemplateKey);
        }

        // Apply template with new URL
        applyTemplate(templateToApply as TemplateKey, result.url, clickUrl);
        
        setMediaUrl(result.url);
        setLastSetBy("upload");
        
        toast.success("Media uploaded and template applied!");
      } catch (error: any) {
        toast.error(error.message || "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [editingPosition, setEditingPosition, selectedTemplate, clickUrl, applyTemplate]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/gif": [".gif"],
      "image/webp": [".webp"],
      "video/mp4": [".mp4"],
      "video/webm": [".webm"],
      "audio/mpeg": [".mp3"],
      "audio/wav": [".wav"],
    },
    multiple: false,
    maxSize: 524288000,
  });

  // Media library select
  const handleMediaSelect = (media: MediaItem | MediaItem[]) => {
    const item = Array.isArray(media) ? media[0] : media;
    const newMediaUrl = item.url;
    setMediaUrl(newMediaUrl);
    setLastSetBy("upload");
    
    const newCreativeType = /\.(mp4|webm)$/i.test(newMediaUrl) ? 'video' : /\.(mp3|wav|ogg)$/i.test(newMediaUrl) ? 'audio' : 'image';
    const update = { ...editingPosition, url: newMediaUrl, mediaUrl: newMediaUrl, creativeType: newCreativeType };
    
    if (typeof setEditingPosition === "function") {
        (setEditingPosition as any)(update);
    }

    if (selectedTemplate) applyTemplate(selectedTemplate, newMediaUrl, clickUrl);
    setMediaSelectionOpen(false);
    toast.success("Media selected!");
  };

  // Helper to update native content and sync to editingPosition
  const updateNativeField = (field: keyof NativeContentData, value: string) => {
    const updated = { ...nativeContent, [field]: value };
    setNativeContent(updated);
    setEditingPosition({
      ...editingPosition,
      nativeContent: updated,
      templateType: "native_feed",
    });
  };

  const updateTrackingField = (field: keyof TrackingPixelsData, value: string) => {
    const updated = { ...trackingPixels, [field]: value };
    setTrackingPixels(updated);
    setEditingPosition({
      ...editingPosition,
      trackingPixels: updated,
    });
  };

  const isNativeFeed = selectedTemplate === "native_feed";

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className={`grid w-full ${isNativeFeed ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <TabsTrigger value="custom">
            <Code className="mr-2 h-4 w-4" />
            {isNativeFeed ? 'Templates' : 'Custom Code & Templates'}
          </TabsTrigger>
          {isNativeFeed && (
            <TabsTrigger value="native">
              <Newspaper className="mr-2 h-4 w-4" />
              Native Content
            </TabsTrigger>
          )}
          <TabsTrigger value="media">
            <Upload className="mr-2 h-4 w-4" />
            Media Content
          </TabsTrigger>
        </TabsList>

        {/* ─── CUSTOM CODE TAB ───────────────────────────────── */}
        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ad Code & Templates</CardTitle>
              <CardDescription>
                Select a predefined template to start, or paste your custom HTML/JS code.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Template Selection Dropdown */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <LayoutTemplate className="h-4 w-4 text-red-500" />
                  Apply a Template
                </label>
                <Select
                  value={selectedTemplate}
                  onValueChange={(val) => handleTemplateSelect(val as TemplateKey)}
                >
                  <SelectTrigger className="w-full border">
                    <SelectValue placeholder="Choose An Ad Template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PREDEFINED_TEMPLATES.map((tpl) => (
                      <SelectItem key={tpl.key} value={tpl.key}>
                        <div className="flex items-center gap-2">
                          <tpl.icon className="h-4 w-4 text-muted-foreground" />
                          <span>{tpl.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTemplate && (
                  <p className="text-[11px] text-muted-foreground px-1">
                    {PREDEFINED_TEMPLATES.find(t => t.key === selectedTemplate)?.description}
                  </p>
                )}
              </div>

              <div className="relative group">
                <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded font-mono">
                    HTML/JS
                  </span>
                </div>
                <Textarea
                  value={editingPosition.code}
                  onChange={(e) => {
                    const newCode = e.target.value;
                    setEditingPosition({ 
                      ...editingPosition, 
                      code: newCode, 
                      type: "html",
                      customCode: true 
                    });
                    setSelectedTemplate("");
                  }}
                  className="min-h-[500px] font-mono text-xs focus-visible:ring-red-500"
                  placeholder={`<!-- Paste your ad code here -->...`}
                />
              </div>
              
              <div className="flex flex-col gap-4">
                {editingPosition.code && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                    <p className="text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-medium">Code is set</span> — Ready for live injection.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── NATIVE CONTENT TAB (only for native_feed) ──────── */}
        {isNativeFeed && (
          <TabsContent value="native" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Newspaper className="h-4 w-4 text-orange-500" />
                  Native Ad Content
                </CardTitle>
                <CardDescription>
                  Configure the content that will appear as an article-style card in the feed. This ad blends seamlessly with regular articles.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Title */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title <span className="text-red-500">*</span></label>
                  <Input
                    value={nativeContent.title}
                    onChange={(e) => updateNativeField("title", e.target.value)}
                    placeholder="Best Budget Laptops in 2026"
                    maxLength={200}
                    className="focus-visible:ring-orange-500"
                  />
                  <p className="text-[10px] text-muted-foreground">{nativeContent.title.length}/200 — Appears as the article headline</p>
                </div>

                {/* Excerpt */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Excerpt</label>
                  <Textarea
                    value={nativeContent.excerpt}
                    onChange={(e) => updateNativeField("excerpt", e.target.value)}
                    placeholder="Top picks for developers and designers. Compare specs, prices, and performance..."
                    maxLength={500}
                    className="min-h-[80px] focus-visible:ring-orange-500"
                  />
                  <p className="text-[10px] text-muted-foreground">{nativeContent.excerpt.length}/500 — Short description below the title (2 lines max shown)</p>
                </div>

                {/* Featured Image */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Featured Image <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <Input
                      value={nativeContent.image}
                      onChange={(e) => updateNativeField("image", e.target.value)}
                      placeholder="https://cdn.example.com/ad-image.jpg"
                      className="flex-1 font-mono text-xs focus-visible:ring-orange-500"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setNativeImageSelectionOpen(true)}
                    >
                      <ImageIcon className="mr-1 h-3.5 w-3.5" />
                      Browse
                    </Button>
                  </div>
                  {nativeContent.image && (
                    <div className="flex justify-center p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900">
                      <img src={nativeContent.image} alt="Native ad preview" className="max-h-32 object-contain rounded shadow" />
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground">16:10 aspect ratio recommended to match article cards</p>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Info className="h-3.5 w-3.5 text-blue-500" />
                    Sponsor Information
                  </h4>

                  {/* Sponsor Label */}
                  <div className="space-y-2 mb-4">
                    <label className="text-sm font-medium">Sponsor Label <span className="text-xs text-muted-foreground">(appears as badge on image)</span></label>
                    <Input
                      value={nativeContent.sponsorLabel}
                      onChange={(e) => updateNativeField("sponsorLabel", e.target.value)}
                      placeholder="Sponsored"
                      maxLength={100}
                      className="focus-visible:ring-orange-500"
                    />
                    <p className="text-[10px] text-muted-foreground">Default: &quot;Sponsored&quot; — Each ad can have different text</p>
                  </div>

                  {/* Sponsor Name */}
                  <div className="space-y-2 mb-4">
                    <label className="text-sm font-medium">Sponsor Name</label>
                    <Input
                      value={nativeContent.sponsorName}
                      onChange={(e) => updateNativeField("sponsorName", e.target.value)}
                      placeholder="Dell Technologies"
                      maxLength={100}
                      className="focus-visible:ring-orange-500"
                    />
                  </div>

                  {/* Sponsor Logo */}
                  <div className="space-y-2 mb-4">
                    <label className="text-sm font-medium">Sponsor Logo <span className="text-xs text-muted-foreground">(optional)</span></label>
                    <div className="flex gap-2">
                      <Input
                        value={nativeContent.sponsorLogo}
                        onChange={(e) => updateNativeField("sponsorLogo", e.target.value)}
                        placeholder="https://cdn.example.com/logo.png"
                        className="flex-1 font-mono text-xs focus-visible:ring-orange-500"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setNativeLogoSelectionOpen(true)}
                      >
                        <ImageIcon className="mr-1 h-3.5 w-3.5" />
                        Browse
                      </Button>
                    </div>
                    {nativeContent.sponsorLogo && (
                      <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded border">
                        <img src={nativeContent.sponsorLogo} alt="Sponsor logo" className="w-8 h-8 rounded-full object-cover" />
                        <span className="text-xs text-muted-foreground">Logo preview</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Click-Through URL */}
                <div className="space-y-2 border-t pt-4">
                  <label className="text-sm font-medium">Click-Through URL <span className="text-red-500">*</span></label>
                  <Input
                    value={nativeContent.clickThroughUrl}
                    onChange={(e) => updateNativeField("clickThroughUrl", e.target.value)}
                    placeholder="https://advertiser.com/landing-page"
                    className="font-mono text-xs focus-visible:ring-orange-500"
                  />
                  <p className="text-[10px] text-muted-foreground">Opens in new tab when user clicks the ad card</p>
                </div>

                {/* Optional: Match Article Style */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold mb-3">🎯 Optional: Match Article Style</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Category Badge */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Category Badge</label>
                      <Input
                        value={nativeContent.category}
                        onChange={(e) => updateNativeField("category", e.target.value)}
                        placeholder="Technology"
                        maxLength={100}
                        className="text-xs"
                      />
                    </div>
                    {/* Read Time */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Read Time</label>
                      <Input
                        value={nativeContent.readTime}
                        onChange={(e) => updateNativeField("readTime", e.target.value)}
                        placeholder="5 Min Read"
                        maxLength={50}
                        className="text-xs"
                      />
                    </div>
                    {/* Author Name */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Author Name</label>
                      <Input
                        value={nativeContent.author}
                        onChange={(e) => updateNativeField("author", e.target.value)}
                        placeholder="Sponsored"
                        maxLength={100}
                        className="text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Layout */}
                <div className="border-t pt-4">
                  <label className="text-sm font-medium mb-2 block">Card Layout</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => updateNativeField("layout", "column")}
                      className={cn(
                        "flex-1 p-3 rounded-lg border-2 transition-all text-center",
                        nativeContent.layout === "column"
                          ? "border-orange-500 bg-orange-50 dark:bg-orange-950/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                      )}
                    >
                      <div className="w-full h-8 bg-gray-300 dark:bg-gray-600 rounded mb-1" />
                      <div className="w-3/4 h-2 bg-gray-300 dark:bg-gray-600 rounded mx-auto mb-1" />
                      <div className="w-1/2 h-2 bg-gray-200 dark:bg-gray-700 rounded mx-auto" />
                      <p className="text-[10px] font-medium mt-2">Column (Grid)</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateNativeField("layout", "row")}
                      className={cn(
                        "flex-1 p-3 rounded-lg border-2 transition-all text-center",
                        nativeContent.layout === "row"
                          ? "border-orange-500 bg-orange-50 dark:bg-orange-950/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                      )}
                    >
                      <div className="flex gap-2">
                        <div className="w-10 h-8 bg-gray-300 dark:bg-gray-600 rounded shrink-0" />
                        <div className="flex-1 space-y-1">
                          <div className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded" />
                          <div className="w-2/3 h-2 bg-gray-200 dark:bg-gray-700 rounded" />
                        </div>
                      </div>
                      <p className="text-[10px] font-medium mt-2">Row (List)</p>
                    </button>
                  </div>
                </div>

                {/* Card Style — matches surrounding article cards */}
                <div className="border-t pt-4">
                  <label className="text-sm font-medium mb-2 block">Card Style</label>
                  <p className="text-xs text-muted-foreground mb-2">Choose the style that matches the article cards in this section</p>
                  <select
                    value={nativeContent.cardStyle || "news-grid"}
                    onChange={(e) => updateNativeField("cardStyle", e.target.value)}
                    className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                  >
                    <option value="news-grid">News Grid (compact image + title)</option>
                    <option value="sidebar-list">Sidebar List (text only, no image)</option>
                    <option value="sidebar-featured">Sidebar Featured (180px image + title + excerpt)</option>
                    <option value="latest-articles">Latest Articles (image left, text right)</option>
                    <option value="hero-side">Hero Side Card (full-bleed image overlay)</option>
                    <option value="review-list">Review List (80x60 thumb + stars)</option>
                    <option value="carousel">Featured Carousel (80x60 thumb + category + author)</option>
                    <option value="most-viewed">Most Viewed (number + title)</option>
                  </select>
                </div>

                {/* Tracking Pixels (optional) */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Eye className="h-3.5 w-3.5 text-purple-500" />
                    Tracking Pixels
                    <span className="text-xs font-normal text-muted-foreground">(optional)</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Impression Pixel URL</label>
                      <Input
                        value={trackingPixels.impression}
                        onChange={(e) => updateTrackingField("impression", e.target.value)}
                        placeholder="https://tracker.example.com/impression"
                        className="font-mono text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Click Pixel URL</label>
                      <Input
                        value={trackingPixels.click}
                        onChange={(e) => updateTrackingField("click", e.target.value)}
                        placeholder="https://tracker.example.com/click"
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    In addition to built-in analytics, you can fire third-party tracking pixels for impressions and clicks.
                  </p>
                </div>

                {/* Validation indicator */}
                {nativeContent.title && nativeContent.image && nativeContent.clickThroughUrl && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                    <p className="text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-medium">Native ad content is ready</span> — Will appear as an article card in the feed.
                    </p>
                  </div>
                )}
                {(!nativeContent.title || !nativeContent.image) && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <span className="font-medium">Required fields missing:</span>
                      {!nativeContent.title && " Title"}
                      {!nativeContent.image && " Image"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Media Library Modals for native content */}
            <MediaSelectionModal
              isOpen={nativeImageSelectionOpen}
              onClose={() => setNativeImageSelectionOpen(false)}
              onMediaSelect={(media) => {
                const item = Array.isArray(media) ? media[0] : media;
                updateNativeField("image", item.url);
                setNativeImageSelectionOpen(false);
                toast.success("Featured image selected!");
              }}
              filterType="ads"
              multiSelect={false}
              title="Select Featured Image"
              description="Choose an image for the native ad card (16:10 aspect ratio recommended)"
            />
            <MediaSelectionModal
              isOpen={nativeLogoSelectionOpen}
              onClose={() => setNativeLogoSelectionOpen(false)}
              onMediaSelect={(media) => {
                const item = Array.isArray(media) ? media[0] : media;
                updateNativeField("sponsorLogo", item.url);
                setNativeLogoSelectionOpen(false);
                toast.success("Sponsor logo selected!");
              }}
              filterType="ads"
              multiSelect={false}
              title="Select Sponsor Logo"
              description="Choose a logo image for the sponsor (square format recommended)"
            />
          </TabsContent>
        )}

        {/* ─── MEDIA UPLOAD TAB ──────────────────────────────── */}
        <TabsContent value="media" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Media Upload & Selection</CardTitle>
              <CardDescription>
                Upload new media files directly to CDN or select from your existing media library. Uploaded media automatically integrates with selected templates.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Drop zone */}
              <div
                {...getRootProps()}
                className={cn(
                  "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 text-center cursor-pointer transition-colors",
                  isDragActive
                    ? "border-red-500 bg-red-50 dark:bg-red-950/20"
                    : "border-border hover:border-red-400 hover:bg-muted/50",
                  (uploading || lastSetBy === "manual") && "opacity-50 pointer-events-none bg-muted/20"
                )}
              >
                <input {...getInputProps()} />
                {uploading ? (
                  <>
                    <div className="w-full max-w-xs bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-red-500 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-sm font-medium">Uploading media… {progress.toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground">Please wait while your file is being uploaded</p>
                  </>
                ) : (
                  <>
                    <Upload className="h-9 w-9 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Drag & drop image, video, or audio here
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        or click to browse — JPG, PNG, GIF, WebP, MP4, WebM, MP3, WAV up to 500 MB
                      </p>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <ImageIcon className="h-3 w-3" />
                        <span>Images</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Video className="h-3 w-3" />
                        <span>Videos</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Music className="h-3 w-3" />
                        <span>Audio</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Browse Media Library */}
              <div className="text-center">
                {lastSetBy === "manual" ? (
                  <p className="text-[10px] text-amber-600 font-medium">
                    Clear the External Media URL below to enable file uploads
                  </p>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground mb-2">Or select from existing media</p>
                    <Button variant="outline" size="sm" onClick={() => setMediaSelectionOpen(true)}>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Browse Media Library
                    </Button>
                  </>
                )}
              </div>

              {/* External Media URL (Only shows if not uploaded) */}
              {lastSetBy !== "upload" ? (
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-blue-500" />
                      External Media URL
                    </label>
                    {mediaUrl && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-medium">
                        External
                      </span>
                    )}
                  </div>
                  <Input
                    value={mediaUrl}
                    onChange={(e) => {
                      const val = e.target.value;
                      setMediaUrl(val);
                      setLastSetBy(val.trim() !== "" ? "manual" : "none");
                      const newCreativeType = /\.(mp4|webm)$/i.test(val) ? 'video' : /\.(mp3|wav|ogg)$/i.test(val) ? 'audio' : 'image';
                      const update = { ...editingPosition, url: val, mediaUrl: val, creativeType: newCreativeType };
                      
                      if (typeof setEditingPosition === "function") {
                          (setEditingPosition as any)(update);
                      }
                      if (selectedTemplate) applyTemplate(selectedTemplate, val, clickUrl);
                    }}
                    placeholder="https://external-storage.com/image.jpg"
                    className="font-mono text-xs focus-visible:ring-blue-500"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Provide a direct link to an image, video, or audio file hosted externally.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-200">
                    <Database className="h-4 w-4 text-emerald-600" />
                    <span className="font-medium">Direct Upload Content Applied</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-[10px] hover:text-red-600"
                    onClick={() => {
                      setMediaUrl("");
                      setLastSetBy("none");
                      setEditingPosition({ ...editingPosition, url: "", mediaUrl: "" });
                    }}
                  >
                    Switch to Link
                  </Button>
                </div>
              )}

              {/* Live preview */}
              {mediaUrl && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Live Preview</label>
                  <div className="flex justify-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900">
                    {/\.(mp4|webm)$/i.test(mediaUrl) ? (
                      <video src={mediaUrl} controls className="max-h-40 rounded shadow-lg" />
                    ) : /\.(mp3|wav|ogg)$/i.test(mediaUrl) ? (
                      <div className="flex flex-col items-center gap-3">
                        <Music className="h-12 w-12 text-purple-500" />
                        <audio src={mediaUrl} controls className="w-full max-w-sm" />
                      </div>
                    ) : (
                      <img src={mediaUrl} alt="Ad preview" className="max-h-40 object-contain rounded shadow-lg" />
                    )}
                  </div>
                </div>
              )}

              {/* Click-through URL */}
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Click-through URL</label>
                  <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-medium">
                    Optional
                  </span>
                </div>
                <Input
                  value={clickUrl}
                  onChange={(e) => {
                    const val = e.target.value;
                    setClickUrl(val);
                    const update = { ...editingPosition, clickThroughUrl: val };
                    if (typeof setEditingPosition === "function") {
                        (setEditingPosition as any)(update);
                    }
                    if (selectedTemplate) applyTemplate(selectedTemplate, mediaUrl, val);
                  }}
                  placeholder="https://example.com/landing-page"
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Where users go when they click the ad. Leave empty for non-clickable ads.
                </p>
              </div>

              {/* VAST URL in media tab too */}
              {(() => {
                const isVideoCompatible = selectedTemplate === "video" || selectedTemplate === "vast_preroll";
                const isImageTemplate = selectedTemplate === "image";
                const isAudioTemplate = selectedTemplate === "audio";
                const vastDisabled = isImageTemplate || isAudioTemplate;
                return (
                  <div className={`space-y-2 pt-2 border-t ${vastDisabled ? "opacity-50" : ""}`}>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">VAST Tag URL</label>
                      <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full font-medium">
                        Video Ads Only
                      </span>
                    </div>
                    <Input
                      value={vastDisabled ? "" : (editingPosition.vastTagUrl || editingPosition.vastUrl || "")}
                      onChange={(e) => {
                        if (vastDisabled) return;
                        const val = e.target.value;
                        const updatedPosition = {
                          ...editingPosition,
                          vastUrl: val,
                          vastTagUrl: val,
                          // Only set type/templateType for video-compatible templates
                          type: val ? "vast" : editingPosition.type,
                          templateType: val
                            ? (editingPosition.templateType === "direct_video" ? "direct_video" : "vast_preroll")
                            : editingPosition.templateType || "legacy",
                        };
                        setEditingPosition(updatedPosition);
                        // Re-apply template so the VAST URL is injected into the code's {{vastTagUrl}} placeholder
                        if (selectedTemplate) {
                          applyTemplate(selectedTemplate, mediaUrl, clickUrl);
                        }
                      }}
                      disabled={vastDisabled}
                      placeholder={vastDisabled
                        ? "VAST is only available with Video or VAST Pre-roll templates"
                        : "https://pubads.g.doubleclick.net/gampad/ads?..."
                      }
                      className={`font-mono text-xs ${vastDisabled ? "cursor-not-allowed" : ""}`}
                    />
                    {vastDisabled ? (
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                        ⚠️ VAST Tag URL requires a Video Ad or VAST Pre-roll template. Switch your template to enable this field.
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Industry-standard VAST XML URL for professional programmatic video advertising with Google IMA SDK.
                      </p>
                    )}
                  </div>
                );
              })()}

            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── ENABLE TOGGLE ──────────────────────────────────── */}
      <div className="flex items-center gap-3 pt-3 border-t">
        <Switch
          checked={editingPosition.status}
          onCheckedChange={(val) =>
            setEditingPosition({ ...editingPosition, status: val, enabled: val })
          }
        />
        <label className="text-sm text-foreground">
          Enable this ad position (visible on website)
        </label>
      </div>

      {/* ─── FOOTER ─────────────────────────────────────────── */}
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <Button
          onClick={async () => {
            // Validation Logic
            let effectiveTemplate: string | "" = selectedTemplate;
            
            // ── Native Feed validation (different from media-based ads) ──
            if (effectiveTemplate === "native_feed") {
              if (!nativeContent.title.trim()) {
                toast.error("Native ad requires a title");
                return;
              }
              if (!nativeContent.image.trim()) {
                toast.error("Native ad requires a featured image");
                return;
              }
              // Sync native content to editingPosition before save
              setEditingPosition({
                ...editingPosition,
                nativeContent,
                trackingPixels,
                templateType: "native_feed",
                code: editingPosition.code || "",
              });
              onSave();
              return;
            }

            // Only perform auto-detection and validation if NOT custom code
            if (!editingPosition.customCode) {
              if (!effectiveTemplate) {
                // Try to detect from code for custom entries
                const code = (editingPosition.code || "").toLowerCase();
                if (code.includes('video-js') || code.includes('video/mp4')) effectiveTemplate = "video";
                else if (code.includes('<img')) effectiveTemplate = "image";
                else if (code.includes('<audio')) effectiveTemplate = "audio";
                else if (code.includes('vast')) effectiveTemplate = "vast_preroll";
              }

              if (effectiveTemplate) {
                const url = mediaUrl.trim();
                const isVideo = /\.(mp4|webm)$/i.test(url);
                const isAudio = /\.(mp3|wav|ogg)$/i.test(url);
                const isImage = !isVideo && !isAudio && url !== "";

                if (effectiveTemplate === "video" || effectiveTemplate === "vast_preroll") {
                  if (!isVideo) {
                    toast.error("Please give video url or upload video");
                    return;
                  }
                } else if (effectiveTemplate === "image") {
                  if (isVideo || isAudio || url === "") {
                    toast.error("Please give image url or upload image");
                    return;
                  }
                } else if (effectiveTemplate === "audio") {
                  if (!isAudio) {
                    toast.error("Please give audio url or upload audio");
                    return;
                  }
                }
              }
            }
            // Media Dimension Check (Soft Warning)
            const validateAndSave = async () => {
              if (mediaUrl) {
                let maxW = 748;
                let maxH = 110;
                
                try {
                   const res = await fetch('/api/ads/settings');
                   if (res.ok) {
                      const settings = await res.json();
                      const posSizing = settings.adSlotSizing?.[editingPosition.position];
                      if (posSizing?.desktop) {
                          maxW = posSizing.desktop.width;
                          maxH = posSizing.desktop.height;
                      } else {
                          const config = POSITION_SIZE_CONFIG[editingPosition.position as any];
                          if (config) {
                              maxW = config.containerDesktop.width;
                              maxH = config.containerDesktop.height;
                          }
                      }
                   }
                } catch (e) {
                   console.warn("Failed to fetch settings for validation", e);
                   const config = POSITION_SIZE_CONFIG[editingPosition.position as any];
                   if (config) {
                       maxW = config.containerDesktop.width;
                       maxH = config.containerDesktop.height;
                   }
                }
                
                // Load media in background to check dimensions
                const isVid = /\.(mp4|webm|ogg)$/i.test(mediaUrl);
                const dims = await new Promise<{w:number, h:number}>(resolve => {
                  if (isVid) {
                    const v = document.createElement('video');
                    v.src = mediaUrl;
                    v.onloadedmetadata = () => resolve({w: v.videoWidth, h: v.videoHeight});
                    v.onerror = () => resolve({w:0, h:0});
                  } else {
                    const i = new Image();
                    i.src = mediaUrl;
                    i.onload = () => resolve({w: i.width, h: i.height});
                    i.onerror = () => resolve({w:0, h:0});
                  }
                  // Timeout after 2s to not block user
                  setTimeout(() => resolve({w:0, h:0}), 2000);
                });

                if (dims.w > maxW * 2 || dims.h > maxH * 2) {
                  toast.error("MEDIA SIZE VALIDATION FAILED", {
                    description: `Media (${dims.w}x${dims.h}) is significantly larger than container (${maxW}x${maxH}). Please use a smaller file or adjust dimensions before saving.`,
                    duration: 10000,
                    style: { backgroundColor: '#fee2e2', color: '#991b1b', border: '2px solid #ef4444' }
                  });
                  return; // DO NOT SAVE
                }
              }
              onSave();
            };

            await validateAndSave();
          }}
          disabled={isLoading || uploading}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <Save className="mr-2 h-4 w-4" />
          {isLoading ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>

      {/* Media Library Modal */}
      <MediaSelectionModal
        isOpen={mediaSelectionOpen}
        onClose={() => setMediaSelectionOpen(false)}
        onMediaSelect={handleMediaSelect}
        filterType="ads"
        multiSelect={false}
        title="Select Media for Ad"
        description="Choose an image, video, or audio file from your media library"
      />
    </div>
  );
}