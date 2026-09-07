"use client"

import * as React from "react"
import { MediaLibraryHeader } from "./MediaLibraryHeader"
import type { StorageStats } from "@/lib/types/media"

/**
 * Example usage of MediaLibraryHeader component
 * 
 * This example demonstrates how to integrate the MediaLibraryHeader
 * with state management and shows all the key features:
 * - Real-time search with debouncing
 * - Filter tabs for different media types
 * - Results count display
 * - Storage usage summary
 * - Responsive layout
 */
export default function MediaLibraryHeaderExample() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [activeFilter, setActiveFilter] = React.useState<'all' | 'images' | 'videos' | 'ads'>('all')
  const [loading, setLoading] = React.useState(false)

  // Mock data for demonstration
  const mockStorageStats: StorageStats = {
    cdn: {
      count: 23,
      totalSize: 2147483648, // ~2 GB
    },
    total: {
      count: 68,
      totalSize: 2273312768, // ~2.12 GB
    },
  }

  // Mock filtered counts based on filter
  const getFilteredCount = () => {
    const baseCounts = {
      all: 68,
      images: 45,
      videos: 20,
      ads: 3,
    }

    // Simulate search filtering
    if (searchQuery) {
      return Math.floor(baseCounts[activeFilter] * 0.6) // Simulate 60% match rate
    }

    return baseCounts[activeFilter]
  }

  // Simulate loading state
  const handleFilterChange = (filter: typeof activeFilter) => {
    setLoading(true)
    setActiveFilter(filter)
    
    // Simulate API call delay
    setTimeout(() => {
      setLoading(false)
    }, 500)
  }

  const handleSearchChange = (query: string) => {
    setLoading(true)
    setSearchQuery(query)
    
    // Simulate search API call delay
    setTimeout(() => {
      setLoading(false)
    }, 300)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Media Library</h1>
            <p className="text-muted-foreground">
              Manage your uploaded media files
            </p>
          </div>

          {/* MediaLibraryHeader Component */}
          <div className="border border-border rounded-lg overflow-hidden">
            <MediaLibraryHeader
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              activeFilter={activeFilter}
              onFilterChange={handleFilterChange}
              filteredCount={getFilteredCount()}
              totalCount={68}
              storageStats={mockStorageStats}
              loading={loading}
            />
            
            {/* Mock content area */}
            <div className="p-6 bg-muted/30">
              <div className="text-center text-muted-foreground">
                <p>Media grid would appear here...</p>
                <p className="text-sm mt-2">
                  Current filter: <strong>{activeFilter}</strong>
                  {searchQuery && (
                    <>
                      {" • "}Search: <strong>"{searchQuery}"</strong>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Usage Instructions */}
          <div className="space-y-4 text-sm">
            <h2 className="text-lg font-semibold">Features Demonstrated:</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>• <strong>Real-time search:</strong> Type in the search box to filter media files</li>
              <li>• <strong>Filter tabs:</strong> Click on All, Images, Videos, or Ads to filter by type</li>
              <li>• <strong>Results count:</strong> Shows filtered vs total count</li>
              <li>• <strong>Storage usage:</strong> Displays total storage and breakdown by provider</li>
              <li>• <strong>Responsive design:</strong> Layout adapts to mobile screens</li>
              <li>• <strong>Loading states:</strong> Shows loading indicators during data fetching</li>
              <li>• <strong>Active filters:</strong> Displays badges for active search and filters</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}