"use client"

import * as React from "react"
import { MediaCard } from "./MediaCard"
import type { MediaItem } from "@/lib/types/media"
import { Loader2 } from "lucide-react"

interface MediaGridProps {
  items: MediaItem[];
  selectedIds: string[];
  selectionMode?: 'single' | 'multiple' | 'none';
  onSelect?: (media: MediaItem) => void;
  onDoubleClick?: (media: MediaItem) => void;
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export function MediaGrid({
  items,
  selectedIds,
  selectionMode = 'none',
  onSelect,
  onDoubleClick,
  loading = false,
  hasMore = false,
  onLoadMore
}: MediaGridProps) {
  const observerRef = React.useRef<IntersectionObserver | null>(null);
  const loadMoreRef = React.useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && onLoadMore) {
        onLoadMore();
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [loading, hasMore, onLoadMore]);

  if (items.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p>No media items found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {items.map((item) => (
          <MediaCard
            key={item._id}
            media={item}
            selected={selectedIds.includes(item._id)}
            selectionMode={selectionMode}
            onClick={onSelect}
            onDoubleClick={onDoubleClick}
          />
        ))}
      </div>
      
      {loading && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      
      {!loading && hasMore && (
        <div ref={loadMoreRef} className="h-10" />
      )}
    </div>
  );
}
