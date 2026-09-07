"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CategoryData = {
  _id: string;
  name: string;
  slug: string;
  parent: string | null;
  color: string;
  footerLabel: string;
  articleCount: number;
};

async function fetchCategory(id: string): Promise<CategoryData> {
  const res = await fetch(`/api/categories/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load category");
  return res.json();
}

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const qc = useQueryClient();

  const [name, setName] = useState("");
  const [color, setColor] = useState("#64748b");
  const [footerLabel, setFooterLabel] = useState("");

  const { data: category, isLoading } = useQuery({
    queryKey: ["category", id],
    queryFn: () => fetchCategory(id),
  });

  useEffect(() => {
    if (category) {
      setName(category.name);
      setColor(category.color);
      setFooterLabel(category.footerLabel);
    }
  }, [category]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color, footerLabel }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json?.error ?? "Update failed");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["category", id] });
      toast.success("Category updated successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update category: ${error.message}`);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        <p className="text-lg font-semibold">Category not found</p>
        <Button variant="link" asChild className="mt-2">
          <Link href="/dashboard/categories">Back to categories</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/categories">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Edit Category</h1>
            <p className="text-sm text-muted-foreground">
              {category.articleCount} {category.articleCount === 1 ? "article" : "articles"} in this category
            </p>
          </div>
        </div>
        <Button
          onClick={() => updateMutation.mutate()}
          disabled={!name.trim() || updateMutation.isPending}
        >
          {updateMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Category Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Technology"
            />
            <p className="text-xs text-muted-foreground">
              Slug: <span className="font-mono">{category.slug}</span>
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="color">Color</Label>
            <div className="flex gap-2">
              <Input
                id="color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-20"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#64748b"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="footerLabel">Footer Badge (optional)</Label>
            <Input
              id="footerLabel"
              value={footerLabel}
              onChange={(e) => setFooterLabel(e.target.value)}
              placeholder="Hot, Trend, New…"
              maxLength={12}
            />
            <p className="text-xs text-muted-foreground">
              Optional badge shown next to this category in the footer, e.g. <strong>Hot</strong>, <strong>Trend</strong>, <strong>New</strong>. Leave blank to show none.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="rounded-lg border p-4"
            style={{ borderLeft: `4px solid ${color}` }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold" style={{ color: "var(--heading-color)" }}>
                  {name || "Category Name"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {category.articleCount} articles
                </p>
              </div>
              {footerLabel && (
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
                  style={{ backgroundColor: color }}
                >
                  {footerLabel}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
