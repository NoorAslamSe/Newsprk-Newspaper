"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

type Settings = {
  siteTitle?: string;
  analyticsKey?: string;
  adsEnabled?: boolean;
  defaultSeo?: { metaTitle?: string; metaDescription?: string };
  s3?: { accessKeyId?: string; secretAccessKey?: string; bucket?: string };
  socialLinks?: any[];
};

async function fetchSettings() {
  const res = await fetch("/api/settings", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load settings");
  return (await res.json()) as { item: Settings };
}

export default function SettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });

  const [siteTitle, setSiteTitle] = useState("");
  const [analyticsKey, setAnalyticsKey] = useState("");
  const [adsEnabled, setAdsEnabled] = useState(false);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [socialLinks, setSocialLinks] = useState<any[]>([]);

  // Sync state when data is loaded
  useEffect(() => {
    if (data?.item) {
      setSiteTitle(data.item.siteTitle ?? "");
      setAnalyticsKey(data.item.analyticsKey ?? "");
      setAdsEnabled(Boolean(data.item.adsEnabled));
      setMetaTitle(data.item.defaultSeo?.metaTitle ?? "");
      setMetaDescription(data.item.defaultSeo?.metaDescription ?? "");
      setSocialLinks(data.item.socialLinks || [
        { name: "Facebook", network: "facebook", url: "https://Trendsposts.com", count: "125K" },
        { name: "Twitter", network: "twitter", url: "https://Trendsposts.com", count: "89K" },
        { name: "YouTube", network: "youtube", url: "https://Trendsposts.com", count: "1.2M" },
        { name: "Instagram", network: "instagram", url: "https://Trendsposts.com", count: "550K" },
      ]);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteTitle,
          analyticsKey,
          adsEnabled,
          defaultSeo: { metaTitle, metaDescription },
          socialLinks,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error ?? "Save failed");
      return json as unknown;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Settings saved successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to save settings: ${error.message}`);
    },
  });

  return (
    <div className="grid gap-6 px-4 lg:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Settings</h2>
          <p className="text-sm text-muted-foreground">Site-wide configuration.</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || isLoading}>
          {saveMutation.isPending ? "Saving…" : "Save settings"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">General</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label>Site title</Label>
                <Input value={siteTitle} onChange={(e) => setSiteTitle(e.target.value)} disabled={isLoading} />
              </div>
              <div className="grid gap-2">
                <Label>Analytics key</Label>
                <Input value={analyticsKey} onChange={(e) => setAnalyticsKey(e.target.value)} disabled={isLoading} />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="adsEnabled" checked={adsEnabled} onCheckedChange={(v) => setAdsEnabled(Boolean(v))} />
                <Label htmlFor="adsEnabled" className="text-sm font-normal">Enable ads globally</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Default SEO</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label>Meta title (max 60)</Label>
                <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
                <div className="text-xs text-muted-foreground">{metaTitle.length}/60</div>
              </div>
              <div className="grid gap-2">
                <Label>Meta description (max 160)</Label>
                <Input value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} />
                <div className="text-xs text-muted-foreground">{metaDescription.length}/160</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Social Media Links</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            {socialLinks.map((link: any, index: number) => (
              <div key={link.network} className="grid gap-4 border-b pb-6 last:border-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <Label className="capitalize font-bold text-sm tracking-wide">{link.network}</Label>
                </div>
                <div className="grid gap-4">
                  <div className="grid gap-1.5">
                    <Label className="text-xs text-muted-foreground">Link URL</Label>
                    <Input 
                      value={link.url} 
                      onChange={(e) => {
                        const updated = [...socialLinks];
                        updated[index] = { ...updated[index], url: e.target.value };
                        setSocialLinks(updated);
                      }} 
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs text-muted-foreground">Display Count (e.g. 1.2M)</Label>
                    <Input 
                      value={link.count} 
                      onChange={(e) => {
                        const updated = [...socialLinks];
                        updated[index] = { ...updated[index], count: e.target.value };
                        setSocialLinks(updated);
                      }} 
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2 pb-10">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || isLoading} size="lg">
          {saveMutation.isPending ? "Saving changes…" : "Save All Settings"}
        </Button>
        {saveMutation.error ? (
          <span className="text-sm text-destructive font-medium">{(saveMutation.error as Error).message}</span>
        ) : null}
      </div>
    </div>
  );
}
