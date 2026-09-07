"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X, Search, Save, ArrowRight, ChevronUp, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type ComparisonItem = {
  _id: string;
  title: string;
  slug: string;
  image: string;
  category: string;
  entity_A: { name: string; image: string };
  entity_B: { name: string; image: string };
};

type HomepageSettings = {
  featuredComparisonIds: string[];
  maxCount: number;
};

async function fetchAvailableComparisons(): Promise<{ items: ComparisonItem[] }> {
  const res = await fetch("/api/dashboard/homepage/comparisons", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load comparisons");
  return res.json();
}

async function fetchSettings(): Promise<HomepageSettings> {
  const res = await fetch("/api/dashboard/homepage", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load homepage settings");
  return res.json();
}

async function saveSettings(data: HomepageSettings): Promise<void> {
  const res = await fetch("/api/dashboard/homepage", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to save homepage settings");
}

// ── Sortable Selected Card ────────────────────────────────────────────

function SortableCard({
  item,
  onRemove,
  onMoveUp,
  onMoveDown,
  index,
  total,
}: {
  item: ComparisonItem;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  index: number;
  total: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item._id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
    >
      <button
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onMoveUp}
          disabled={index === 0}
          className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronUp className="h-3 w-3" />
        </button>
        <button
          onClick={onMoveDown}
          disabled={index === total - 1}
          className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>

      <div className="flex items-center gap-2 flex-1 min-w-0">
        {item.entity_A?.image && (
          <img
            src={item.entity_A.image}
            alt={item.entity_A.name}
            className="h-8 w-8 rounded object-cover border shrink-0"
          />
        )}
        <span className="text-xs text-muted-foreground font-bold shrink-0">VS</span>
        {item.entity_B?.image && (
          <img
            src={item.entity_B.image}
            alt={item.entity_B.name}
            className="h-8 w-8 rounded object-cover border shrink-0"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{item.title}</p>
          <p className="text-xs text-muted-foreground truncate">
            {item.entity_A?.name} vs {item.entity_B?.name}
          </p>
        </div>
      </div>

      <Badge variant="outline" className="text-[10px] shrink-0">
        #{index + 1}
      </Badge>

      <button
        onClick={onRemove}
        className="text-muted-foreground hover:text-destructive shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────

export default function HomepageSettingsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [maxCount, setMaxCount] = React.useState(6);
  const [initialized, setInitialized] = React.useState(false);

  const { data: comparisonsData, isLoading: loadingComparisons } = useQuery({
    queryKey: ["homepage-comparisons"],
    queryFn: fetchAvailableComparisons,
  });

  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ["homepage-settings"],
    queryFn: fetchSettings,
  });

  React.useEffect(() => {
    if (settings && !initialized) {
      setSelectedIds(settings.featuredComparisonIds);
      setMaxCount(settings.maxCount);
      setInitialized(true);
    }
  }, [settings, initialized]);

  const saveMutation = useMutation({
    mutationFn: saveSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homepage-settings"] });
      toast.success("Homepage settings saved successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });

  const allComparisons = React.useMemo(() => comparisonsData?.items ?? [], [comparisonsData?.items]);
  const selectedSet = React.useMemo(() => new Set(selectedIds), [selectedIds]);

  const selectedItems = React.useMemo(() => {
    const byId = new Map(allComparisons.map((c) => [c._id, c]));
    return selectedIds.map((id) => byId.get(id)).filter(Boolean) as ComparisonItem[];
  }, [allComparisons, selectedIds]);

  const filteredAvailable = React.useMemo(() => {
    const q = search.toLowerCase();
    return allComparisons.filter((c) => {
      if (selectedSet.has(c._id)) return false;
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        c.entity_A?.name?.toLowerCase().includes(q) ||
        c.entity_B?.name?.toLowerCase().includes(q)
      );
    });
  }, [allComparisons, search, selectedSet]);

  const isAtCapacity = selectedIds.length >= maxCount;

  const handleAdd = (id: string) => {
    if (isAtCapacity) {
      toast.warning(`Maximum of ${maxCount} featured comparisons reached.`);
      return;
    }
    setSelectedIds((prev) => [...prev, id]);
  };

  const handleRemove = (id: string) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setSelectedIds((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const handleMoveDown = (index: number) => {
    setSelectedIds((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setSelectedIds((prev) => {
      const oldIndex = prev.indexOf(active.id as string);
      const newIndex = prev.indexOf(over.id as string);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const handleSave = () => {
    saveMutation.mutate({ featuredComparisonIds: selectedIds, maxCount });
  };

  const isLoading = loadingComparisons || loadingSettings;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Homepage Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage content displayed on the homepage for this locale.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saveMutation.isPending}>
          <Save className="mr-2 h-4 w-4" />
          {saveMutation.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      {/* Max Count Setting */}
      <div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
        <div className="flex-1">
          <Label htmlFor="maxCount" className="text-sm font-medium">
            Max Featured Comparisons
          </Label>
          <p className="text-xs text-muted-foreground mt-1">
            Maximum number of comparison cards shown in the Featured Comparisons section on the homepage.
          </p>
        </div>
        <Input
          id="maxCount"
          type="number"
          min={1}
          max={12}
          value={maxCount}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            if (v >= 1 && v <= 12) setMaxCount(v);
          }}
          className="w-20 text-center"
        />
      </div>

      {/* Two-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Available Comparisons */}
        <div className="rounded-lg border bg-card">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">Available Comparisons</h2>
              <Badge variant="secondary">{filteredAvailable.length}</Badge>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title or entity name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="p-2 max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground text-sm">Loading...</div>
            ) : filteredAvailable.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                {search ? "No comparisons match your search." : "No published comparisons found."}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredAvailable.map((item) => (
                  <button
                    key={item._id}
                    onClick={() => handleAdd(item._id)}
                    disabled={isAtCapacity}
                    className="w-full flex items-center gap-3 p-2.5 rounded-md hover:bg-accent transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed group"
                  >
                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.entity_A?.image && (
                        <img src={item.entity_A.image} alt="" className="h-7 w-7 rounded object-cover border" />
                      )}
                      <span className="text-[10px] text-muted-foreground font-bold">VS</span>
                      {item.entity_B?.image && (
                        <img src={item.entity_B.image} alt="" className="h-7 w-7 rounded object-cover border" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.entity_A?.name} vs {item.entity_B?.name}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Selected Comparisons (Drag to Reorder) */}
        <div className="rounded-lg border bg-card">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Featured on Homepage</h2>
              <Badge variant={isAtCapacity ? "destructive" : "secondary"}>
                {selectedIds.length} / {maxCount}
              </Badge>
            </div>
            {isAtCapacity && (
              <p className="text-xs text-destructive mt-1">
                Maximum capacity reached. Remove an item to add another.
              </p>
            )}
          </div>
          <div className="p-2 max-h-[600px] overflow-y-auto">
            {selectedItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No comparisons selected. Pick from the left panel.
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={selectedIds}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-1">
                    {selectedItems.map((item, index) => (
                      <SortableCard
                        key={item._id}
                        item={item}
                        index={index}
                        total={selectedItems.length}
                        onRemove={() => handleRemove(item._id)}
                        onMoveUp={() => handleMoveUp(index)}
                        onMoveDown={() => handleMoveDown(index)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
