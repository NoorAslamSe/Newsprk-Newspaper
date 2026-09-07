"use client"

import * as React from "react"
import { MediaLibraryHeader } from "./MediaLibraryHeader"
import { MediaGrid } from "./MediaGrid"
import { MediaActionMenu } from "./MediaActionMenu"
import type { MediaItem, StorageStats } from "@/lib/types/media"
import { getMediaAction, getStorageStatsAction, deleteMediaAction, bulkDeleteMediaAction } from "@/lib/actions/media"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { X, Trash2, Loader2, Download } from "lucide-react"
import { downloadMultipleFiles } from "@/lib/utils/download"

interface MediaLibraryGridProps {
  onInsert?: (media: MediaItem) => void;
  selectionMode?: 'single' | 'multiple' | 'none';
  filterType?: 'all' | 'images' | 'videos' | 'ads';
}

export function MediaLibraryGrid({
  onInsert,
  selectionMode = 'none',
  filterType: initialFilterType = 'all',
}: MediaLibraryGridProps) {
  const [items, setItems] = React.useState<MediaItem[]>([])
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [activeFilter, setActiveFilter] = React.useState<'all' | 'images' | 'videos' | 'ads'>(initialFilterType)
  
  const [loading, setLoading] = React.useState(true)
  const [page, setPage] = React.useState(1)
  const [hasMore, setHasMore] = React.useState(false)
  
  const [filteredCount, setFilteredCount] = React.useState(0)
  const [totalCount, setTotalCount] = React.useState(0)
  const [storageStats, setStorageStats] = React.useState<StorageStats | undefined>(undefined)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false)

  const fetchMedia = React.useCallback(async (pageNum: number, search: string, type: string, append = false) => {
    setLoading(true)
    try {
      const res = await getMediaAction({
        page: pageNum,
        limit: 30,
        search,
        type: type as any,
      })
      if (res.success) {
        setItems(prev => append ? [...prev, ...res.data.items] : res.data.items)
        setFilteredCount(res.data.filteredCount)
        setTotalCount(res.data.total)
        setHasMore(res.data.filteredCount > pageNum * 30)

        if (!append) {
          if (res.data.items.length === 0) {
             toast.info("Nothing found");
          } else {
             toast.success(`${res.data.items.length} records loaded successfully`);
          }
        }
      }
    } catch (error) {
      toast.error("An error occurred while fetching media")
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchStats = React.useCallback(async () => {
    try {
      const res = await getStorageStatsAction()
      if (res.success) {
        setStorageStats(res.data)
      }
    } catch (error) {
      console.error("Failed to fetch stats", error)
    }
  }, [])

  React.useEffect(() => {
    fetchStats()
  }, [fetchStats])

  React.useEffect(() => {
    setPage(1)
    fetchMedia(1, searchQuery, activeFilter, false)
  }, [searchQuery, activeFilter, fetchMedia])

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchMedia(nextPage, searchQuery, activeFilter, true)
    }
  }

  const handleSelect = (media: MediaItem) => {
    if (selectionMode === 'none') return;
    
    if (selectionMode === 'single') {
      setSelectedIds([media._id])
      return;
    }
    
    // Multiple selection
    setSelectedIds(prev => 
      prev.includes(media._id) 
        ? prev.filter(id => id !== media._id)
        : [...prev, media._id]
    )
  }

  const handleDoubleClick = (media: MediaItem) => {
    if (onInsert) {
      onInsert(media)
    }
  }

  const handleDelete = async (mediaId: string) => {
    // MediaActionMenu internal handles calling onDelete and showing its own success message.
    // We just need to update the list here.
    const res = await deleteMediaAction(mediaId);
    if (res.success) {
      setItems(prev => prev.filter(m => m._id !== mediaId));
      setSelectedIds(prev => prev.filter(id => id !== mediaId));
      setFilteredCount(prev => prev - 1);
      setTotalCount(prev => prev - 1);
    } else {
      throw new Error(res.error);
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} items? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await bulkDeleteMediaAction(selectedIds);
      if (res.success) {
        toast.success(res.message);
        setItems(prev => prev.filter(item => !selectedIds.includes(item._id)));
        setFilteredCount(prev => prev - selectedIds.length);
        setTotalCount(prev => prev - selectedIds.length);
        setSelectedIds([]);
        fetchStats(); // Refresh storage stats
      } else {
        toast.error(res.message || "Failed to delete items");
        // If some failed, we might want to refresh the whole list
        fetchMedia(1, searchQuery, activeFilter, false);
      }
    } catch (error) {
      toast.error("An error occurred during bulk deletion");
    } finally {
      setIsDeleting(false);
    }
  }
  
  const handleBulkDownload = async () => {
    if (selectedIds.length === 0) return;
    
    const filesToDownload = items
      .filter(item => selectedIds.includes(item._id))
      .map(item => ({ url: item.url, filename: item.filename }));
      
    toast.promise(downloadMultipleFiles(filesToDownload), {
      loading: 'Preparing downloads...',
      success: 'Downloads started!',
      error: 'Some downloads failed'
    });
  }

  const selectedMedia = selectedIds.length === 1 
    ? items.find(i => i._id === selectedIds[0]) || null 
    : null;

  return (
    <div className="flex flex-col h-full bg-background relative rounded-md border border-border overflow-hidden">
      <MediaLibraryHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        filteredCount={filteredCount}
        totalCount={totalCount}
        storageStats={storageStats}
        loading={loading && page === 1}
      />
      
      {/* Action Bar when items are selected */}
      {selectedIds.length > 0 && (
        <div className="bg-muted p-2 flex items-center justify-between border-b border-border">
          <span className="text-sm font-medium px-2">
            {selectedIds.length} item{selectedIds.length !== 1 && 's'} selected
          </span>
          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleBulkDownload}
                  disabled={isDeleting}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download {selectedIds.length} {selectedIds.length === 1 ? 'Item' : 'Items'}
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleBulkDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Delete {selectedIds.length} {selectedIds.length === 1 ? 'Item' : 'Items'}
                </Button>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])} disabled={isDeleting}>
              <X className="h-4 w-4 mr-2" />
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <MediaGrid
          items={items}
          selectedIds={selectedIds}
          selectionMode={selectionMode}
          onSelect={handleSelect}
          onDoubleClick={handleDoubleClick}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
        />
      </div>
    </div>
  )
}
