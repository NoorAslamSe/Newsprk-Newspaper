"use client"

import * as React from "react"
import { MediaLibraryHeader } from "./MediaLibraryHeader"
import { getStorageStatsAction, getMediaAction } from "@/lib/actions/media"
import type { StorageStats } from "@/lib/types/media"

/**
 * Integration example showing how to use MediaLibraryHeader with server actions
 * 
 * This example demonstrates:
 * - Fetching storage statistics from the server
 * - Fetching and filtering media items
 * - Real-time search and filtering
 * - Loading states and error handling
 * - State management patterns
 */
export default function MediaLibraryHeaderIntegration() {
  // State management
  const [searchQuery, setSearchQuery] = React.useState("")
  const [activeFilter, setActiveFilter] = React.useState<'all' | 'images' | 'videos' | 'ads'>('all')
  const [storageStats, setStorageStats] = React.useState<StorageStats>()
  const [mediaItems, setMediaItems] = React.useState<any[]>([])
  const [totalCount, setTotalCount] = React.useState(0)
  const [filteredCount, setFilteredCount] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string>()

  // Fetch storage statistics
  const fetchStorageStats = React.useCallback(async () => {
    try {
      const result = await getStorageStatsAction()
      if (result.success) {
        setStorageStats(result.data)
      } else {
        console.error('Failed to fetch storage stats:', result.error)
      }
    } catch (error) {
      console.error('Error fetching storage stats:', error)
    }
  }, [])

  // Fetch media items with current filters
  const fetchMedia = React.useCallback(async () => {
    setLoading(true)
    setError(undefined)
    
    try {
      const result = await getMediaAction({
        search: searchQuery,
        type: activeFilter,
        page: 1,
        limit: 50
      })
      
      if (result.success) {
        setMediaItems(result.data.items)
        setTotalCount(result.data.total)
        setFilteredCount(result.data.filteredCount)
      } else {
        setError(result.error)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch media')
    } finally {
      setLoading(false)
    }
  }, [searchQuery, activeFilter])

  // Initial data fetch
  React.useEffect(() => {
    fetchStorageStats()
    fetchMedia()
  }, [fetchStorageStats, fetchMedia])

  // Handle search changes
  const handleSearchChange = React.useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  // Handle filter changes
  const handleFilterChange = React.useCallback((filter: typeof activeFilter) => {
    setActiveFilter(filter)
  }, [])

  // Refresh data
  const handleRefresh = React.useCallback(() => {
    fetchStorageStats()
    fetchMedia()
  }, [fetchStorageStats, fetchMedia])

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Media Library</h1>
              <p className="text-muted-foreground">
                Manage your uploaded media files
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-destructive text-sm">
                Error: {error}
              </p>
            </div>
          )}

          {/* MediaLibraryHeader Component */}
          <div className="border border-border rounded-lg overflow-hidden">
            <MediaLibraryHeader
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              activeFilter={activeFilter}
              onFilterChange={handleFilterChange}
              filteredCount={filteredCount}
              totalCount={totalCount}
              storageStats={storageStats}
              loading={loading}
            />
            
            {/* Media Grid Placeholder */}
            <div className="p-6 bg-muted/30 min-h-[400px]">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading media...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <p className="text-destructive mb-2">Failed to load media</p>
                    <button
                      onClick={handleRefresh}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              ) : mediaItems.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <p className="text-muted-foreground mb-2">
                      {searchQuery || activeFilter !== 'all' 
                        ? 'No media found matching your filters'
                        : 'No media files uploaded yet'
                      }
                    </p>
                    {(searchQuery || activeFilter !== 'all') && (
                      <button
                        onClick={() => {
                          setSearchQuery('')
                          setActiveFilter('all')
                        }}
                        className="text-primary hover:underline"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {mediaItems.map((item) => (
                    <div
                      key={item._id}
                      className="aspect-square bg-background border border-border rounded-lg p-2 hover:shadow-md transition-shadow"
                    >
                      <div className="w-full h-full bg-muted rounded flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-2xl mb-2">
                            {item.fileType === 'image' ? '🖼️' : 
                             item.fileType === 'video' ? '🎥' : '📄'}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {item.filename}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Debug Information */}
          <div className="space-y-4 text-sm">
            <h2 className="text-lg font-semibold">Integration Details:</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-medium">Current State:</h3>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Search Query: "{searchQuery || 'none'}"</li>
                  <li>• Active Filter: {activeFilter}</li>
                  <li>• Loading: {loading ? 'Yes' : 'No'}</li>
                  <li>• Error: {error || 'None'}</li>
                  <li>• Media Items: {mediaItems.length}</li>
                  <li>• Filtered Count: {filteredCount}</li>
                  <li>• Total Count: {totalCount}</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Storage Stats:</h3>
                {storageStats ? (
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Total: {storageStats.total.count} files, {(storageStats.total.totalSize / 1024 / 1024).toFixed(2)} MB</li>
                    <li>• CDN: {storageStats.cdn.count} files, {(storageStats.cdn.totalSize / 1024 / 1024).toFixed(2)} MB</li>
                  </ul>
                ) : (
                  <p className="text-muted-foreground">Loading...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}