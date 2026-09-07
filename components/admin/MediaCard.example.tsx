"use client"

import * as React from "react"
import { MediaCard } from "./MediaCard"
import type { MediaItem } from "@/lib/types/media"

// Example media items for demonstration
const exampleMediaItems: MediaItem[] = [
  {
    _id: "1",
    filename: "hero-image.jpg",
    mimeType: "image/jpeg",
    size: 2048576, // 2MB
    url: "https://example.com/hero-image.jpg",
    provider: "cdn",
    variants: {
      original: "https://example.com/hero-image.jpg",
      thumbnail: "https://example.com/hero-image-thumb.jpg",
      medium: "https://example.com/hero-image-medium.jpg",
    },
    alt: "Hero image for homepage",
    metadata: {
      width: 1920,
      height: 1080,
      format: "jpeg",
    },
    tags: ["hero", "homepage"],
    folder: "Trendsposts/images",
    cloudinaryPublicId: "hero-image",
    usage: [],
    uploadedBy: {
      _id: "user1",
      name: "John Doe",
      email: "john@example.com",
    },
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
    fileType: "image",
  },
  {
    _id: "2",
    filename: "product-demo.mp4",
    mimeType: "video/mp4",
    size: 15728640, // 15MB
    url: "https://example.com/product-demo.mp4",
    provider: "cdn",
    variants: {
      original: "https://example.com/product-demo.mp4",
      thumbnail: "https://example.com/product-demo-thumb.jpg",
      medium: null,
    },
    alt: "",
    metadata: {
      width: 1280,
      height: 720,
      duration: 120, // 2 minutes
      format: "mp4",
    },
    tags: ["product", "demo"],
    folder: "/uploads/videos",
    cdnKey: "uploads/videos/product-demo.mp4",
    cdnBucket: "media-bucket",
    usage: [],
    uploadedBy: {
      _id: "user2",
      name: "Jane Smith",
      email: "jane@example.com",
    },
    createdAt: "2024-01-14T15:45:00Z",
    updatedAt: "2024-01-14T15:45:00Z",
    fileType: "video",
  },
  {
    _id: "3",
    filename: "banner-ad.png",
    mimeType: "image/png",
    size: 512000, // 500KB
    url: "https://example.com/banner-ad.png",
    provider: "cdn",
    variants: {
      original: "https://example.com/banner-ad.png",
      thumbnail: "https://example.com/banner-ad-thumb.png",
      medium: "https://example.com/banner-ad-medium.png",
    },
    alt: "Banner advertisement",
    metadata: {
      width: 728,
      height: 90,
      format: "png",
      hasAlpha: true,
    },
    tags: ["ad", "banner"],
    folder: "Trendsposts/ads",
    cloudinaryPublicId: "banner-ad",
    vastTag: "<VAST>...</VAST>",
    adTiming: "pre-roll",
    usage: [
      {
        type: "ad",
        referenceId: "ad1",
        usedAt: new Date("2024-01-16T09:00:00Z"),
      },
    ],
    uploadedBy: {
      _id: "user1",
      name: "John Doe",
      email: "john@example.com",
    },
    createdAt: "2024-01-13T12:20:00Z",
    updatedAt: "2024-01-16T09:00:00Z",
    fileType: "image",
  },
]

/**
 * MediaCard Example Component
 * 
 * Demonstrates different usage patterns of the MediaCard component:
 * - Basic display
 * - Selection modes (single, multiple)
 * - Event handlers
 * - Different media types (image, video, ad)
 */
export function MediaCardExample() {
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])
  const [selectionMode, setSelectionMode] = React.useState<'none' | 'single' | 'multiple'>('multiple')

  const handleSelect = React.useCallback((media: MediaItem) => {
    if (selectionMode === 'none') return

    setSelectedIds(prev => {
      if (selectionMode === 'single') {
        return prev.includes(media._id) ? [] : [media._id]
      }
      
      // Multiple selection
      if (prev.includes(media._id)) {
        return prev.filter(id => id !== media._id)
      } else {
        return [...prev, media._id]
      }
    })
  }, [selectionMode])

  const handleDoubleClick = React.useCallback((media: MediaItem) => {
    console.log('Double clicked media:', media.filename)
    // In a real app, this might open a preview or insert the media
  }, [])

  const handleKeyDown = React.useCallback((event: React.KeyboardEvent, media: MediaItem) => {
    console.log('Key pressed:', event.key, 'on media:', media.filename)
    
    // Example: Handle Delete key
    if (event.key === 'Delete') {
      console.log('Delete requested for:', media.filename)
    }
  }, [])

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">MediaCard Examples</h2>
        
        {/* Selection Mode Controls */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Selection Mode:</span>
          <div className="flex gap-2">
            {(['none', 'single', 'multiple'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => {
                  setSelectionMode(mode)
                  setSelectedIds([])
                }}
                className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                  selectionMode === mode
                    ? 'bg-red-500 text-white border-red-500'
                    : 'bg-background text-foreground border-border hover:bg-muted'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Items Display */}
        {selectedIds.length > 0 && (
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm">
              Selected: {selectedIds.length} item{selectedIds.length !== 1 ? 's' : ''}
            </p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setSelectedIds([])}
                className="px-2 py-1 text-xs bg-background border border-border rounded hover:bg-muted"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {exampleMediaItems.map(media => (
          <MediaCard
            key={media._id}
            media={media}
            selected={selectedIds.includes(media._id)}
            selectionMode={selectionMode}
            onClick={handleSelect}
            onDoubleClick={handleDoubleClick}
            onKeyDown={handleKeyDown}
            showMetadataOnHover={true}
          />
        ))}
      </div>

      {/* Usage Instructions */}
      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Usage Instructions:</h3>
        <ul className="text-sm space-y-1 text-muted-foreground">
          <li>• <strong>Click</strong> to select/deselect items (when selection mode is enabled)</li>
          <li>• <strong>Double-click</strong> to trigger the double-click action (logged to console)</li>
          <li>• <strong>Hover</strong> to see metadata overlay with file details</li>
          <li>• <strong>Tab</strong> to navigate between cards with keyboard</li>
          <li>• <strong>Enter/Space</strong> to select focused card</li>
          <li>• <strong>Delete</strong> key on focused card (logged to console)</li>
        </ul>
      </div>
    </div>
  )
}

export default MediaCardExample