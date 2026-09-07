"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { MediaSelectionModal } from "@/components/admin/MediaSelectionModal";
import { Image as ImageIcon, X } from "lucide-react";
import { DEPLOYMENT_LOCALE } from "@/lib/i18n";

type Category = { _id: string; name: string; parent?: string | null; color?: string; slug: string };

type PostPayload = {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  categoryLabel: string;
  author: string;
  authorName: string;
  date: string;
  readTime: number;
  featured: boolean;
  tags: string[];
  views: number;
  status: "draft" | "published" | "scheduled";
  locale: string;
  articleMedia?: {
    heroCoverMedia?: { url: string; vastTagUrl: string; poster: string };
    postBodyMedia?: { url: string; vastTagUrl: string; poster: string };
    keyTakeawaysMedia?: { url: string; vastTagUrl: string; poster: string };
    finalThoughtsMedia?: { url: string; vastTagUrl: string; poster: string };
  };
  bodyContent?: string;
  keyTakeawaysContent?: string;
  finalThoughtsContent?: string;
  is_product?: boolean;
  product_name?: string;
};

export function PostEditor({
  mode,
  postId,
  initial,
}: {
  mode: "create" | "edit";
  postId?: string;
  initial?: Partial<PostPayload> & { _id?: string; slug?: string };
}) {
  const qc = useQueryClient();
  const router = useRouter();

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [category, setCategory] = useState<string>(initial?.category ?? "");
  const [categoryLabel, setCategoryLabel] = useState<string>(initial?.categoryLabel ?? "");
  const [author, setAuthor] = useState<string>(initial?.author ?? "admin");
  const [authorName, setAuthorName] = useState<string>(initial?.authorName ?? "Admin");
  const [date, setDate] = useState<string>(initial?.date ?? new Date().toISOString());
  const [readTime, setReadTime] = useState<number>(initial?.readTime ?? 5);
  const [featured, setFeatured] = useState<boolean>(initial?.featured ?? false);
  const [tagsText, setTagsText] = useState((initial?.tags ?? []).join(", "));
  const [views, setViews] = useState<number>(initial?.views ?? 0);
  const [status, setStatus] = useState<PostPayload["status"]>(
    initial?.status === "published" || initial?.status === "scheduled"
      ? initial.status
      : "draft"
  );
  const [is_product, setIsProduct] = useState<boolean>(initial?.is_product ?? false);
  const [product_name, setProductName] = useState<string>(initial?.product_name ?? "");
  const [heroCoverMediaUrl, setHeroCoverMediaUrl] = useState<string>(initial?.articleMedia?.heroCoverMedia?.url ?? "");
  const [heroCoverVastTag, setHeroCoverVastTag] = useState<string>(initial?.articleMedia?.heroCoverMedia?.vastTagUrl ?? "");
  const [heroCoverPoster, setHeroCoverPoster] = useState<string>(initial?.articleMedia?.heroCoverMedia?.poster ?? "");
  const [postBodyMediaUrl, setPostBodyMediaUrl] = useState<string>(initial?.articleMedia?.postBodyMedia?.url ?? "");
  const [postBodyVastTag, setPostBodyVastTag] = useState<string>(initial?.articleMedia?.postBodyMedia?.vastTagUrl ?? "");
  const [postBodyPoster, setPostBodyPoster] = useState<string>(initial?.articleMedia?.postBodyMedia?.poster ?? "");
  const [keyTakeawaysMediaUrl, setKeyTakeawaysMediaUrl] = useState<string>(initial?.articleMedia?.keyTakeawaysMedia?.url ?? "");
  const [keyTakeawaysVastTag, setKeyTakeawaysVastTag] = useState<string>(initial?.articleMedia?.keyTakeawaysMedia?.vastTagUrl ?? "");
  const [keyTakeawaysPoster, setKeyTakeawaysPoster] = useState<string>(initial?.articleMedia?.keyTakeawaysMedia?.poster ?? "");
  const [finalThoughtsMediaUrl, setFinalThoughtsMediaUrl] = useState<string>(initial?.articleMedia?.finalThoughtsMedia?.url ?? "");
  const [finalThoughtsVastTag, setFinalThoughtsVastTag] = useState<string>(initial?.articleMedia?.finalThoughtsMedia?.vastTagUrl ?? "");
  const [finalThoughtsPoster, setFinalThoughtsPoster] = useState<string>(initial?.articleMedia?.finalThoughtsMedia?.poster ?? "");
  
  const [bodyContent, setBodyContent] = useState<string>((initial as any)?.bodyContent ?? "");
  const [keyTakeawaysContent, setKeyTakeawaysContent] = useState<string>((initial as any)?.keyTakeawaysContent ?? "");
  const [finalThoughtsContent, setFinalThoughtsContent] = useState<string>((initial as any)?.finalThoughtsContent ?? "");

  const isVideoUrl = (url?: string) => {
    if (!url) return false;
    const cleanUrl = url.split('?')[0].toLowerCase();
    return cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.mov') || cleanUrl.endsWith('.m4v');
  };

  const [posterModalTarget, setPosterModalTarget] = useState<string | null>(null);


  const tags = useMemo(
    () => tagsText.split(",").map((t) => t.trim()).filter(Boolean),
    [tagsText]
  );

  // Auto-generate slug from title
  useEffect(() => {
    if (mode === "create" && title) {
      const generatedSlug = title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generatedSlug);
    }
  }, [title, mode]);

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/categories", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load categories");
      return (await res.json()) as { items: Category[] };
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: Partial<PostPayload>) => {
      const url = mode === "create" ? "/api/articles" : `/api/articles/${postId}`;
      const method = mode === "create" ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error ?? "Save failed");
      return json as unknown;
    },
    onSuccess: async (data, variables) => {
      await qc.invalidateQueries({ queryKey: ["posts"] });
      await qc.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      
      if (mode === "create") {
        toast.success("Post created successfully!");
        router.push(`/dashboard/posts/${(data as any)._id}/edit`);
      } else {
        const isPublishing = (variables as any).__isPublishing;
        if (isPublishing) {
          toast.success("Post published successfully!");
          setTimeout(() => {
            router.push("/dashboard/posts");
          }, 1000);
        } else {
          toast.success("Post updated successfully!");
        }
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to ${mode === "create" ? "create" : "update"} post: ${error.message}`);
    },
  });

  const onSave = async (nextStatus?: PostPayload["status"]) => {
    // Find selected category details
    const selectedCategory = categoriesData?.items.find(cat => cat.slug === category);
    
    const finalStatus = nextStatus ?? status;
    
    const payload: Partial<PostPayload> & { adOverrides?: any[] } = {
      title,
      slug,
      excerpt,
      category: selectedCategory?.slug || category,
      categoryLabel: selectedCategory?.name || categoryLabel,
      author,
      authorName,
      date: date || new Date().toISOString(),
      readTime,
      featured,
      tags,
      views,
      status: finalStatus,
      is_product,
      product_name,
      locale: DEPLOYMENT_LOCALE,
      articleMedia: {
        heroCoverMedia: { url: heroCoverMediaUrl, vastTagUrl: heroCoverVastTag, poster: heroCoverPoster },
        postBodyMedia: { url: postBodyMediaUrl, vastTagUrl: postBodyVastTag, poster: postBodyPoster },
        keyTakeawaysMedia: { url: keyTakeawaysMediaUrl, vastTagUrl: keyTakeawaysVastTag, poster: keyTakeawaysPoster },
        finalThoughtsMedia: { url: finalThoughtsMediaUrl, vastTagUrl: finalThoughtsVastTag, poster: finalThoughtsPoster }
      },
      bodyContent: bodyContent || undefined,
      keyTakeawaysContent: keyTakeawaysContent || undefined,
      finalThoughtsContent: finalThoughtsContent || undefined,
      adOverrides: (initial as any)?.adOverrides || [], // Preserve overrides for now if not editable in this form
    };
    
    // Store the status for use in onSuccess
    (payload as any).__isPublishing = finalStatus === "published";
    
    return saveMutation.mutateAsync(payload);
  };



  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-[240px]">
          <h2 className="text-lg font-semibold">
            {mode === "create" ? "New post" : "Edit post"}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/posts">Back</Link>
          </Button>
          <Button
            onClick={() => onSave("draft")}
            disabled={saveMutation.isPending}
            variant="outline"
          >
            Save draft
          </Button>
          <Button onClick={() => onSave("published")} disabled={saveMutation.isPending}>
            Publish
          </Button>
        </div>
      </div>

      {saveMutation.error ? (
        <Card>
          <CardContent className="py-4 text-sm text-destructive">
            {(saveMutation.error as Error).message}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Content</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Input id="excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="bodyContent">Body Content</Label>
             <textarea 
                id="bodyContent" 
                value={bodyContent} 
                onChange={(e) => setBodyContent(e.target.value)}
                className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Main body content for the article..."
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="keyTakeawaysContent">Key Takeaways Content</Label>
              <textarea 
                id="keyTakeawaysContent" 
                value={keyTakeawaysContent} 
                onChange={(e) => setKeyTakeawaysContent(e.target.value)}
                className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Key takeaways section content..."
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="finalThoughtsContent">Final Thoughts Content</Label>
              <textarea 
                id="finalThoughtsContent" 
                value={finalThoughtsContent} 
                onChange={(e) => setFinalThoughtsContent(e.target.value)}
                className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Final thoughts section content..."
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={status}
                  onValueChange={(v) => {
                    if (v === "published" || v === "scheduled") setStatus(v);
                    else setStatus("draft");
                  }}
               >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select
                  value={category}
                  onValueChange={(v) => {
                    setCategory(v);
                    const selectedCat = categoriesData?.items.find(cat => cat.slug === v);
                    if (selectedCat) {
                      setCategoryLabel(selectedCat.name);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(categoriesData?.items ?? []).map((c) => (
                      <SelectItem key={c._id} value={c.slug}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input id="tags" value={tagsText} onChange={(e) => setTagsText(e.target.value)} />
                <div className="flex flex-wrap gap-1">
                  {tags.slice(0, 8).map((t) => (
                    <Badge key={t} variant="secondary">
                      {t}
                    </Badge>
                  ))}
                </div>
             </div>



              <div className="grid gap-2">
                <Label htmlFor="readTime">Read Time (minutes)</Label>
                <Input 
                  id="readTime" 
                  type="number" 
                  value={readTime} 
                  onChange={(e) => setReadTime(parseInt(e.target.value) || 5)} 
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="author">Author</Label>
                <Input id="author" value={author} onChange={(e) => setAuthor(e.target.value)} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="authorName">Author Name</Label>
                <Input id="authorName" value={authorName} onChange={(e) => setAuthorName(e.target.value)} />
              </div>

<div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                />
                <Label htmlFor="featured">Featured Article</Label>
              </div>
              <div className="grid grid-cols-2 gap-2 my-4">
                <div>
                  <Label htmlFor="is_product">Is Product Article</Label>
                  <input
                    type="checkbox"
                    id="is_product"
                    checked={is_product}
                    onChange={(e) => setIsProduct(e.target.checked)}
                  />
                </div>
                <div>
                  <Label htmlFor="product_name">Product Name</Label>
                  <Input
                    id="product_name"
                    value={product_name}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="e.g. Adidas Ultraboost"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Article Media Positions (External URLs)</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="heroCoverMediaUrl">Hero Cover Media URL (Image or Video)</Label>
                <Input 
                  id="heroCoverMediaUrl" 
                  value={heroCoverMediaUrl} 
                  onChange={(e) => setHeroCoverMediaUrl(e.target.value)} 
                 placeholder="https://example.com/hero-media.jpg or .mp4"
                />
                <Input 
                  id="heroCoverVastTag" 
                  value={heroCoverVastTag} 
                  onChange={(e) => setHeroCoverVastTag(e.target.value)} 
                  placeholder="(Optional) VAST Tag URL for Pre-Roll / Mid-Roll video ads"
                  className="mt-1"
                />
                {isVideoUrl(heroCoverMediaUrl) && (
                  <div className="grid gap-1 mt-1">
                    <Label className="text-xs text-muted-foreground">Poster Image (for video)</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        value={heroCoverPoster} 
                        onChange={(e) => setHeroCoverPoster(e.target.value)} 
                        placeholder="Poster image URL"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPosterModalTarget("heroCover")}
                      >
                        <ImageIcon className="w-4 h-4" />
                      </Button>
                      {heroCoverPoster && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setHeroCoverPoster("")}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {heroCoverPoster && (
                      <img src={heroCoverPoster} alt="Hero poster preview" className="w-full h-24 object-cover rounded border mt-1" />
                    )}
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="postBodyMediaUrl">Post Body Media URL (Image or Video)</Label>
                <Input 
                  id="postBodyMediaUrl" 
                  value={postBodyMediaUrl} 
                  onChange={(e) => setPostBodyMediaUrl(e.target.value)} 
                  placeholder="https://example.com/body-media.jpg or .mp4"
                />
                <Input 
                  id="postBodyVastTag" 
                  value={postBodyVastTag} 
                  onChange={(e) => setPostBodyVastTag(e.target.value)} 
                  placeholder="(Optional) VAST Tag URL for video ads"
                  className="mt-1"
                />
                {isVideoUrl(postBodyMediaUrl) && (
                  <div className="grid gap-1 mt-1">
                    <Label className="text-xs text-muted-foreground">Poster Image (for video)</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        value={postBodyPoster} 
                        onChange={(e) => setPostBodyPoster(e.target.value)} 
                        placeholder="Poster image URL"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPosterModalTarget("postBody")}
                      >
                        <ImageIcon className="w-4 h-4" />
                      </Button>
                      {postBodyPoster && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setPostBodyPoster("")}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {postBodyPoster && (
                      <img src={postBodyPoster} alt="Post body poster preview" className="w-full h-24 object-cover rounded border mt-1" />
                    )}
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="keyTakeawaysMediaUrl">Key Takeaways Media URL (Image or Video)</Label>
                <Input 
                  id="keyTakeawaysMediaUrl" 
                  value={keyTakeawaysMediaUrl} 
                  onChange={(e) => setKeyTakeawaysMediaUrl(e.target.value)} 
                  placeholder="https://example.com/takeaways-media.jpg or .mp4"
                />
                <Input 
                  id="keyTakeawaysVastTag" 
                  value={keyTakeawaysVastTag} 
                  onChange={(e) => setKeyTakeawaysVastTag(e.target.value)} 
                  placeholder="(Optional) VAST Tag URL for video ads"
                  className="mt-1"
                />
                {isVideoUrl(keyTakeawaysMediaUrl) && (
                  <div className="grid gap-1 mt-1">
                    <Label className="text-xs text-muted-foreground">Poster Image (for video)</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        value={keyTakeawaysPoster} 
                        onChange={(e) => setKeyTakeawaysPoster(e.target.value)} 
                        placeholder="Poster image URL"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPosterModalTarget("keyTakeaways")}
                      >
                        <ImageIcon className="w-4 h-4" />
                      </Button>
                      {keyTakeawaysPoster && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setKeyTakeawaysPoster("")}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {keyTakeawaysPoster && (
                      <img src={keyTakeawaysPoster} alt="Key takeaways poster preview" className="w-full h-24 object-cover rounded border mt-1" />
                    )}
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="finalThoughtsMediaUrl">Final Thoughts Media URL (Image or Video)</Label>
               <Input 
                  id="finalThoughtsMediaUrl" 
                  value={finalThoughtsMediaUrl} 
                  onChange={(e) => setFinalThoughtsMediaUrl(e.target.value)} 
                  placeholder="https://example.com/final-media.jpg or .mp4"
                />
                <Input 
                  id="finalThoughtsVastTag" 
                  value={finalThoughtsVastTag} 
                  onChange={(e) => setFinalThoughtsVastTag(e.target.value)} 
                  placeholder="(Optional) VAST Tag URL for video ads"
                  className="mt-1"
                />
                {isVideoUrl(finalThoughtsMediaUrl) && (
                  <div className="grid gap-1 mt-1">
                    <Label className="text-xs text-muted-foreground">Poster Image (for video)</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        value={finalThoughtsPoster} 
                        onChange={(e) => setFinalThoughtsPoster(e.target.value)} 
                        placeholder="Poster image URL"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPosterModalTarget("finalThoughts")}
                      >
                        <ImageIcon className="w-4 h-4" />
                      </Button>
                      {finalThoughtsPoster && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setFinalThoughtsPoster("")}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {finalThoughtsPoster && (
                      <img src={finalThoughtsPoster} alt="Final thoughts poster preview" className="w-full h-24 object-cover rounded border mt-1" />
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <MediaSelectionModal
        isOpen={posterModalTarget !== null}
        onClose={() => setPosterModalTarget(null)}
        onMediaSelect={(media) => {
          const selectedItem = Array.isArray(media) ? media[0] : media;
          const posterUrl = selectedItem.variants?.thumbnail || selectedItem.url;
          if (posterModalTarget === "heroCover") setHeroCoverPoster(posterUrl);
          else if (posterModalTarget === "postBody") setPostBodyPoster(posterUrl);
          else if (posterModalTarget === "keyTakeaways") setKeyTakeawaysPoster(posterUrl);
          else if (posterModalTarget === "finalThoughts") setFinalThoughtsPoster(posterUrl);
          setPosterModalTarget(null);
        }}
        filterType="image"
        title="Select Poster Image"
        description="Choose an image from your media library to use as video poster"
      />
    </div>
  );
}