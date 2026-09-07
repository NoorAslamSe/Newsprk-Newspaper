"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { SortableDataTable, type SortableColumn } from "@/components/ui/SortableDataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type PostRow = {
  _id: string;
  title: string;
  slug: string;
  status: "draft" | "published" | "scheduled";
  views: number;
  updatedAt: string;
  author?: string;
  authorName?: string;
};

type PostsResponse = {
  items: PostRow[];
  total: number;
  page: number;
  limit: number;
};

async function fetchPosts(params: {
  page: number;
  limit: number;
  q?: string;
  sort?: string;
  order?: "asc" | "desc";
}): Promise<PostsResponse> {
  const url = new URL("/api/articles", window.location.origin);
  url.searchParams.set("page", params.page.toString());
  url.searchParams.set("limit", params.limit.toString());
  if (params.q) url.searchParams.set("q", params.q);
  if (params.sort) url.searchParams.set("sort", params.sort);
  if (params.order) url.searchParams.set("order", params.order);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load posts");
  const data = await res.json();
  if (data.items.length === 0) {
    toast.info("Nothing found");
  } else {
    toast.success(`${data.items.length} records loaded successfully`);
  }
  return data;
}

async function deletePosts(ids: string[]): Promise<void> {
  const res = await fetch("/api/articles/bulk", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error("Failed to delete posts");
}

async function updatePostStatus(ids: string[], status: string): Promise<void> {
  const res = await fetch("/api/articles/bulk", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids, status }),
  });
  if (!res.ok) throw new Error("Failed to update posts");
}

export default function PostsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // State
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [itemToDelete, setItemToDelete] = React.useState<string | null>(null);

  // Fetch posts
  const { data, isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: () =>
      fetchPosts({
        page: 1,
        limit: 1000, // Load all for client-side sorting/filtering
      }),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deletePosts,
    onSuccess: (_, deletedIds) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      const count = deletedIds.length;
      toast.success(`${count} post${count !== 1 ? 's' : ''} deleted successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete posts: ${error.message}`);
    },
  });

  // Status update mutation
  const statusMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: string }) =>
      updatePostStatus(ids, status),
    onSuccess: (_, { ids, status }) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      const count = ids.length;
      toast.success(`${count} post${count !== 1 ? 's' : ''} ${status === 'published' ? 'published' : 'updated'} successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update posts: ${error.message}`);
    },
  });

  // Sortable columns configuration
  const sortableColumns: SortableColumn<PostRow>[] = [
    { key: 'title', label: 'Title', sortType: 'string' },
    { key: 'status', label: 'Status', sortType: 'string' },
    { key: 'views', label: 'Views', sortType: 'number' },
    { key: 'updatedAt', label: 'Date', sortType: 'date' },
  ];

  const handleBulkDelete = async (selectedRows: PostRow[]) => {
    const ids = selectedRows.map(row => row._id);
    await deleteMutation.mutateAsync(ids);
  };

  const handleBulkStatusUpdate = async (selectedRows: PostRow[], status: string) => {
    const ids = selectedRows.map(row => row._id);
    await statusMutation.mutateAsync({ ids, status });
  };
  // Columns definition
  const columns = React.useMemo<ColumnDef<PostRow>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => {
          const post = row.original;
          return (
            <div className="max-w-[500px]">
              <Link
                href={`/dashboard/posts/${post._id}/edit`}
                className="font-medium hover:underline"
              >
                {post.title}
              </Link>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span>/{post.slug}</span>
                <span>•</span>
                <Link
                  href={`/posts/${post.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  <Eye className="h-3 w-3" />
                  View
                </Link>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          const variants: Record<string, "default" | "secondary" | "outline"> = {
            published: "default",
            draft: "secondary",
            scheduled: "outline",
          };
          return (
            <Badge variant={variants[status] || "secondary"} className="capitalize">
              {status}
            </Badge>
          );
        },
      },
      {
        accessorKey: "authorName",
        header: "Author",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.authorName || row.original.author || "—"}
          </span>
        ),
      },
      {
        accessorKey: "views",
        header: "Views",
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.views ?? 0}</span>
        ),
      },
      {
        accessorKey: "updatedAt",
        header: "Date",
        cell: ({ row }) => {
          const date = new Date(row.original.updatedAt);
          return (
            <span className="text-sm text-muted-foreground">
              {date.toLocaleDateString()}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const post = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/posts/${post._id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/posts/${post.slug}`} target="_blank">
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => {
                    setItemToDelete(post._id);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Posts</h1>
          <p className="text-sm text-muted-foreground">
            Create, edit, schedule, and publish your content.
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/posts/new")}>
          <Plus className="mr-2 h-4 w-4" />
          New Post
        </Button>
      </div>

      {/* Enhanced Data Table */}
      <SortableDataTable
        data={data?.items ?? []}
        columns={columns}
        sortableColumns={sortableColumns}
        loading={isLoading}
        enableRowSelection={true}
        getRowId={(row) => row._id}
        onBulkDelete={handleBulkDelete}
        searchPlaceholder="Search posts by title, excerpt, or content..."
        emptyMessage="No posts found. Create your first post to get started."
        bulkActions={[
          {
            label: "Publish",
            onClick: (selectedRows) => handleBulkStatusUpdate(selectedRows, "published"),
            variant: "default"
          },
          {
            label: "Draft",
            onClick: (selectedRows) => handleBulkStatusUpdate(selectedRows, "draft"),
            variant: "outline"
          }
        ]}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the post.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (itemToDelete) {
                  deleteMutation.mutate([itemToDelete]);
                  setItemToDelete(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
