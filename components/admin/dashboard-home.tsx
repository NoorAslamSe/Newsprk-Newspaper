"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type MetricsResponse = {
  overview: {
    totalPosts: number;
    publishedPosts: number;
    draftPosts: number;
    totalCategories: number;
    totalViews: number;
  };
  recentPosts: Array<{
    _id: string;
    title: string;
    slug: string;
    status: string;
    views: number;
    date: string;
  }>;
  popularPosts: Array<{
    _id: string;
    title: string;
    slug: string;
    views: number;
  }>;
  postsByCategory: Array<{
    category: string;
    count: number;
  }>;
};

async function fetchMetrics(): Promise<MetricsResponse> {
  const res = await fetch("/api/dashboard/metrics", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load metrics");
  return res.json();
}

export function DashboardHome() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: fetchMetrics,
  });

  return (
    <div className="grid gap-6 px-4 lg:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Overview</h2>
          <p className="text-sm text-muted-foreground">
            Key metrics and the latest content updates.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild style={{ backgroundColor: "var(--g-color)", color: "#ffffff" }}>
            <Link href="/dashboard/posts/new">Add New post</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/dashboard/categories">Add New category</Link>
          </Button>
          <Button asChild variant="muted">
            <Link href="/dashboard/media">Upload media</Link>
          </Button>
        </div>
      </div>

      {error ? (
        <Card>
          <CardContent className="py-6 text-sm text-destructive">
            Failed to load dashboard metrics.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total posts" value={data?.overview.totalPosts} loading={isLoading} />
        <MetricCard title="Total views" value={data?.overview.totalViews} loading={isLoading} />
        <MetricCard title="Drafts" value={data?.overview.draftPosts} loading={isLoading} />
        <MetricCard title="Published" value={data?.overview.publishedPosts} loading={isLoading} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent posts</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/posts">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.recentPosts ?? []).map((p) => (
                  <TableRow key={p._id}>
                    <TableCell className="max-w-[520px]">
                      <Link className="font-medium hover:underline" href={`/dashboard/posts/${p._id}/edit`}>
                        {p.title}
                      </Link>
                      <div className="text-xs text-muted-foreground">/{p.slug}</div>
                    </TableCell>
                    <TableCell className="capitalize">{p.status}</TableCell>
                    <TableCell className="text-right tabular-nums">{p.views ?? 0}</TableCell>
                  </TableRow>
                ))}
                {!data?.recentPosts?.length ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                      No posts yet.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  title,
  value,
  loading,
}: {
  title: string;
  value: number | undefined;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-2xl font-semibold tabular-nums">{value ?? 0}</div>
        )}
      </CardContent>
    </Card>
  );
}

