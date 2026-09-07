"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Category = {
  _id: string;
  name: string;
  slug: string;
  parent: string | null;
  color?: string;
  /** Optional badge label shown in footer, e.g. "Hot", "Trend" */
  footerLabel?: string;
};

type CategoriesResponse = {
  items: Category[];
};

async function fetchCategories(): Promise<CategoriesResponse> {
  const res = await fetch("/api/dashboard/categories", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load categories");
  const data = await res.json();
  if (data.items.length === 0) {
    toast.info("Nothing found");
  } else {
    toast.success(`${data.items.length} records loaded successfully`);
  }
  return data;
}

async function deleteCategories(ids: string[]): Promise<void> {
  const res = await fetch("/api/categories/bulk", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error("Failed to delete categories");
}

export default function CategoriesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [itemToDelete, setItemToDelete] = React.useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);

  // Form state
  const [name, setName] = React.useState("");
  const [parent, setParent] = React.useState<string>("");
  const [color, setColor] = React.useState("#64748b");
  const [footerLabel, setFooterLabel] = React.useState("");

  const resetForm = () => {
    setName("");
    setParent("");
    setColor("#64748b");
    setFooterLabel("");
  };

  const { data, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategories,
    onSuccess: (_, deletedIds) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      const count = deletedIds.length;
      toast.success(`${count} categor${count !== 1 ? "ies" : "y"} deleted successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete categories: ${error.message}`);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      parent: string | null;
      color?: string;
      footerLabel?: string;
    }) => {
      const res = await fetch("/api/dashboard/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json?.error ?? "Create failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category created successfully!");
      setCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(`Failed to create category: ${error.message}`);
    },
  });

  const sortableColumns: SortableColumn<Category>[] = [
    { key: "name", label: "Name", sortType: "string" },
    { key: "slug", label: "Slug", sortType: "string" },
  ];

  const handleBulkDelete = async (selectedRows: Category[]) => {
    const ids = selectedRows.map((row) => row._id);
    await deleteMutation.mutateAsync(ids);
  };

  const items = React.useMemo(() => data?.items ?? [], [data?.items]);
  const byId = React.useMemo(
    () => new Map(items.map((c) => [c._id, c])),
    [items]
  );

  const depthOf = React.useCallback(
    (id: string) => {
      let depth = 0;
      let cur = byId.get(id)?.parent ?? null;
      while (cur) {
        depth += 1;
        cur = byId.get(cur)?.parent ?? null;
        if (depth > 20) break;
      }
      return depth;
    },
    [byId]
  );

  const sorted = React.useMemo(
    () => [...items].sort((a, b) => a.name.localeCompare(b.name)),
    [items]
  );

  const columns = React.useMemo<ColumnDef<Category>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => {
          const category = row.original;
          const depth = depthOf(category._id);
          return (
            <div style={{ paddingLeft: depth * 20 }} className="flex items-center gap-2 font-medium">
              {category.name}
              {category.footerLabel && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: category.color || "#64748b", color: "#fff" }}
                >
                  {category.footerLabel}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "slug",
        header: "Slug",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.slug}</span>
        ),
      },
      {
        accessorKey: "color",
        header: "Color",
        cell: ({ row }) => {
          const color = row.original.color ?? "#64748b";
          return (
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded border" style={{ backgroundColor: color }} />
              <Badge variant="outline">{color}</Badge>
            </div>
          );
        },
      },
      {
        accessorKey: "parent",
        header: "Parent",
        cell: ({ row }) => {
          const parentId = row.original.parent;
          if (!parentId) return <span className="text-muted-foreground">—</span>;
          const parentCat = byId.get(parentId);
          return parentCat ? (
            <span className="text-sm">{parentCat.name}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const category = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    router.push(`/dashboard/categories/${category._id}`);
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => {
                    setItemToDelete(category._id);
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
    [byId, depthOf]
  );

  // Shared footer label help text
  const footerLabelHelp = (
    <p className="text-xs text-muted-foreground">
      Optional badge shown next to this category in the footer, e.g. <strong>Hot</strong>, <strong>Trend</strong>, <strong>New</strong>. Leave blank to show none.
    </p>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground">
            Organize content with optional hierarchy.
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Category
        </Button>
      </div>

      <SortableDataTable
        data={sorted}
        columns={columns}
        sortableColumns={sortableColumns}
        loading={isLoading}
        enableRowSelection={true}
        getRowId={(row) => row._id}
        onBulkDelete={handleBulkDelete}
        searchPlaceholder="Search categories by name or slug..."
        emptyMessage="No categories found. Create your first category to get started."
      />

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-foreground">Create Category</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Add a new category to organize your content.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-foreground">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Technology"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="parent" className="text-foreground">Parent (optional)</Label>
              <Select value={parent} onValueChange={setParent}>
                <SelectTrigger id="parent">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {sorted.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="color" className="text-foreground">Color</Label>
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
              <Label htmlFor="footerLabel" className="text-foreground">Footer Badge (optional)</Label>
              <Input
                id="footerLabel"
                value={footerLabel}
                onChange={(e) => setFooterLabel(e.target.value)}
                placeholder="Hot, Trend, New…"
                maxLength={12}
              />
              {footerLabelHelp}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                createMutation.mutate({
                  name,
                  parent: parent === "none" || !parent ? null : parent,
                  color,
                  footerLabel,
                })
              }
              disabled={!name.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the category.
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
