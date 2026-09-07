"use client"

import * as React from "react"
import { Search, X, HardDrive, Image as ImageIcon, Video, RectangleHorizontal as AdIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { formatFileSize } from "@/lib/utils/metadataFormatter"
import type { StorageStats } from "@/lib/types/media"

interface MediaLibraryHeaderProps {
  /** Current search query */
  searchQuery: string
  /** Search query change handler */
  onSearchChange: (query: string) => void
  /** Current active filter */
  activeFilter: 'all' | 'images' | 'videos' | 'ads'
  /** Filter change handler */
  onFilterChange: (filter: 'all' | 'images' | 'videos' | 'ads') => void
  /** Total count of filtered results */
  filteredCount: number
  /** Total count of all media items */
  totalCount: number
  /** Storage usage statistics */
  storageStats?: StorageStats
  /** Whether data is loading */
  loading?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * MediaLibraryHeader Component
 * 
 * Provides the header section for the media library with:
 * - Real-time search input with debouncing
 * - Filter tabs for different media types (All, Images, Videos, Ads)
 * - Display of filtered results count
 * - Storage usage summary with formatted sizes
 * - Responsive layout that stacks on mobile
 * - Theme-aware styling for light/dark modes
 * 
 * Requirements: 13.1, 13.3, 13.5, 30.5, 18.3
 * 
 * @example
 * ```tsx
 * <MediaLibraryHeader
 *   searchQuery={searchQuery}
 *   onSearchChange={setSearchQuery}
 *   activeFilter={activeFilter}
 *   onFilterChange={setActiveFilter}
 *   filteredCount={filteredMedia.length}
 *   totalCount={allMedia.length}
 *   storageStats={storageStats}
 * />
 * ```
 */
export function MediaLibraryHeader({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  filteredCount,
  totalCount,
  storageStats,
  loading = false,
  className,
}: MediaLibraryHeaderProps) {
  const [localSearchQuery, setLocalSearchQuery] = React.useState(searchQuery)
  const timeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined)

  // Sync local search query with prop
  React.useEffect(() => {
    setLocalSearchQuery(searchQuery)
  }, [searchQuery])

  // Debounced search handler (300ms delay)
  const handleSearchChange = React.useCallback((value: string) => {
    setLocalSearchQuery(value)
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      onSearchChange(value)
    }, 300)
  }, [onSearchChange])

  // Clear search handler
  const handleClearSearch = React.useCallback(() => {
    setLocalSearchQuery("")
    onSearchChange("")
  }, [onSearchChange])

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Format storage stats for display
  const formatStorageStats = React.useCallback(() => {
    if (!storageStats) {
      return {
        total: "0 B",
        cloudinary: "0 B",
        cdn: "0 B",
      }
    }

    return {
      total: formatFileSize(storageStats.total.totalSize),
      cdn: formatFileSize(storageStats.cdn.totalSize),
    }
  }, [storageStats])

  const formattedStats = formatStorageStats()

  return (
    <div className={cn(
      "flex flex-col gap-4 p-4 bg-background border-b border-border",
      "sm:gap-6 sm:p-6",
      className
    )}>
      {/* Top row - Search and Storage Stats */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            value={localSearchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search media files..."
            className="pl-9 pr-9"
            aria-label="Search media files"
          />
          {localSearchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSearch}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Storage Usage Summary */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            <span className="font-medium">Storage:</span>
            <span className="text-foreground font-semibold">
              {loading ? "..." : formattedStats.total}
            </span>
          </div>
          
          {/* Provider breakdown */}
          {storageStats && !loading && (
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="text-xs">
                  CDN
                </Badge>
                <span className="text-xs">{formattedStats.cdn}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row - Filter Tabs and Results Count */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Filter Tabs */}
        <Tabs 
          value={activeFilter} 
          onValueChange={(value) => onFilterChange(value as typeof activeFilter)}
          className="w-full sm:w-auto"
        >
          <TabsList variant="line" className="grid w-full grid-cols-4 sm:w-auto sm:flex">
            <TabsTrigger 
              value="all" 
              className="flex items-center gap-2"
              aria-label="Show all media"
            >
              <span className="hidden sm:inline">All</span>
              <span className="sm:hidden">All</span>
            </TabsTrigger>
            <TabsTrigger 
              value="images" 
              className="flex items-center gap-2"
              aria-label="Show images only"
            >
              <ImageIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Images</span>
            </TabsTrigger>
            <TabsTrigger 
              value="videos" 
              className="flex items-center gap-2"
              aria-label="Show videos only"
            >
              <Video className="h-4 w-4" />
              <span className="hidden sm:inline">Videos</span>
            </TabsTrigger>
            <TabsTrigger 
              value="ads" 
              className="flex items-center gap-2"
              aria-label="Show ads only"
            >
              <AdIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Ads</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Results Count */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            {loading ? (
              "Loading..."
            ) : searchQuery || activeFilter !== 'all' ? (
              <>
                <span className="text-foreground font-semibold">{filteredCount}</span>
                {" of "}
                <span className="text-foreground font-semibold">{totalCount}</span>
                {" items"}
              </>
            ) : (
              <>
                <span className="text-foreground font-semibold">{totalCount}</span>
                {" items"}
              </>
            )}
          </span>
          
          {/* Active filter indicator */}
          {(searchQuery || activeFilter !== 'all') && !loading && (
            <div className="flex items-center gap-2">
              {searchQuery && (
                <Badge variant="secondary" className="text-xs">
                  Search: "{searchQuery}"
                </Badge>
              )}
              {activeFilter !== 'all' && (
                <Badge variant="secondary" className="text-xs capitalize">
                  {activeFilter}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Storage Stats (shown below on mobile) */}
      {storageStats && !loading && (
        <div className="flex sm:hidden items-center justify-center gap-4 pt-2 border-t border-border text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-xs">
              CDN
            </Badge>
            <span>{formattedStats.cdn}</span>
          </div>
        </div>
      )}
    </div>
  )
}