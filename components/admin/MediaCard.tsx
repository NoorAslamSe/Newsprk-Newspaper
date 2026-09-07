"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Image as ImageIcon, 
  Video, 
  FileIcon, 
  Play,
  CheckCircle2,
  Calendar,
  HardDrive,
  RectangleHorizontal as Dimensions,
  Clock
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatFileSize, formatDuration, formatCompactMetadata } from "@/lib/utils/metadataFormatter"
import type { MediaItem } from "@/lib/types/media"

interface MediaCardProps {
  /** The media item to display */
  media: MediaItem
  /** Whether the card is selected */
  selected?: boolean
  /** Selection mode for styling */
  selectionMode?: 'single' | 'multiple' | 'none'
  /** Click handler for card selection */
  onClick?: (media: MediaItem) => void
  /** Double click handler for quick actions */
  onDoubleClick?: (media: MediaItem) => void
  /** Keyboard event handler */
  onKeyDown?: (event: React.KeyboardEvent, media: MediaItem) => void
  /** Additional CSS classes */
  className?: string
  /** Whether the card is disabled */
  disabled?: boolean
  /** Whether to show metadata overlay on hover */
  showMetadataOnHover?: boolean
}

/**
 * MediaCard Component
 * 
 * Displays individual media items in a grid layout with:
 * - Thumbnail display for images with proper aspect ratio
 * - Video thumbnails with play icon overlay
 * - File metadata on hover (name, size, type, upload date)
 * - Selection state styling with visual feedback
 * - Keyboard navigation support (Tab, Enter, Space)
 * - Theme-aware styling for light/dark modes
 * - Responsive and touch-friendly design
 * 
 * Requirements: 12.2, 12.3, 12.4, 19.5, 27.4
 * 
 * @example
 * ```tsx
 * <MediaCard 
 *   media={mediaItem}
 *   selected={selectedIds.includes(mediaItem._id)}
 *   onClick={handleSelect}
 *   onDoubleClick={handleInsert}
 *   showMetadataOnHover={true}
 * />
 * ```
 */
export function MediaCard({
  media,
  selected = false,
  selectionMode = 'none',
  onClick,
  onDoubleClick,
  onKeyDown,
  className,
  disabled = false,
  showMetadataOnHover = true,
}: MediaCardProps) {
  const [imageLoaded, setImageLoaded] = React.useState(false)
  const [imageError, setImageError] = React.useState(false)
  const [showMetadata, setShowMetadata] = React.useState(false)
  const cardRef = React.useRef<HTMLDivElement>(null)

  const isImage = media.fileType === 'image'
  const isVideo = media.fileType === 'video'
  const isSelectable = selectionMode !== 'none'
  const isClickable = onClick || onDoubleClick || isSelectable

  // Format upload date
  const uploadDate = React.useMemo(() => {
    try {
      return new Date(media.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return 'Unknown date'
    }
  }, [media.createdAt])

  // Handle click events
  const handleClick = React.useCallback((event: React.MouseEvent) => {
    if (disabled) return
    
    event.preventDefault()
    event.stopPropagation()
    
    if (onClick) {
      onClick(media)
    }
  }, [disabled, onClick, media])

  // Handle double click events
  const handleDoubleClick = React.useCallback((event: React.MouseEvent) => {
    if (disabled) return
    
    event.preventDefault()
    event.stopPropagation()
    
    if (onDoubleClick) {
      onDoubleClick(media)
    }
  }, [disabled, onDoubleClick, media])

  // Handle keyboard events
  const handleKeyDown = React.useCallback((event: React.KeyboardEvent) => {
    if (disabled) return

    // Handle Enter and Space for selection/activation
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      event.stopPropagation()
      
      if (onKeyDown) {
        onKeyDown(event, media)
      } else if (onClick) {
        onClick(media)
      }
    }
    
    // Pass through other keyboard events
    if (onKeyDown && event.key !== 'Enter' && event.key !== ' ') {
      onKeyDown(event, media)
    }
  }, [disabled, onKeyDown, onClick, media])

  // Handle mouse events for metadata overlay
  const handleMouseEnter = React.useCallback(() => {
    if (showMetadataOnHover && !disabled) {
      setShowMetadata(true)
    }
  }, [showMetadataOnHover, disabled])

  const handleMouseLeave = React.useCallback(() => {
    if (showMetadataOnHover) {
      setShowMetadata(false)
    }
  }, [showMetadataOnHover])

  // Render thumbnail based on media type
  const renderThumbnail = () => {
    // Explicit provider check for rendering as requested
    const defaultUrl = media.provider === 'supabase' && media.publicUrl 
      ? media.publicUrl 
      : media.url;
      
    const thumbnailUrl = media.variants?.thumbnail || defaultUrl;
    
    if (isImage) {
      return (
        <div className="relative w-full h-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          {!imageError ? (
            <>
              <img
                src={thumbnailUrl}
                alt={media.alt || media.filename}
                className={cn(
                  "w-full h-full object-cover transition-opacity duration-200",
                  imageLoaded ? "opacity-100" : "opacity-0"
                )}
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  setImageError(true)
                  setImageLoaded(true)
                }}
                loading="lazy"
              />
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>
      )
    }

    if (isVideo) {
      return (
        <div className="relative w-full h-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          {!imageError && thumbnailUrl ? (
            <>
              <img
                src={thumbnailUrl}
                alt={`${media.filename} thumbnail`}
                className={cn(
                  "w-full h-full object-cover transition-opacity duration-200",
                  imageLoaded ? "opacity-100" : "opacity-0"
                )}
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  setImageError(true)
                  setImageLoaded(true)
                }}
                loading="lazy"
              />
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Video className="w-12 h-12 text-purple-400" />
            </div>
          )}
          
          {/* Play icon overlay for videos */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center transition-all duration-200 hover:bg-black/70 hover:scale-110">
              <Play className="w-6 h-6 text-white ml-0.5" fill="currentColor" />
            </div>
          </div>
        </div>
      )
    }

    // Fallback for other file types
    return (
      <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <FileIcon className="w-12 h-12 text-gray-400" />
      </div>
    )
  }

  // Render metadata overlay
  const renderMetadataOverlay = () => {
    if (!showMetadata && !selected) return null
    // Safety guard: metadata may be missing for legacy documents
    const meta = media.metadata ?? {}

    return (
      <div className={cn(
        "absolute inset-0 bg-black/80 backdrop-blur-sm text-white p-3 flex flex-col justify-between transition-all duration-200",
        showMetadata || selected ? "opacity-100" : "opacity-0"
      )}>
        {/* Top section - File info */}
        <div className="space-y-2">
          <div className="space-y-1">
            <h4 className="text-sm font-medium truncate" title={media.filename}>
              {media.filename}
            </h4>
            <p className="text-xs text-gray-300 truncate">
              {formatCompactMetadata(media)}
            </p>
          </div>
          
          {/* Metadata details */}
          <div className="space-y-1 text-xs text-gray-300">
            {/* Dimensions */}
            {meta.width && meta.height && (
              <div className="flex items-center gap-1">
                <Dimensions className="w-3 h-3" />
                <span>{meta.width} × {meta.height}</span>
              </div>
            )}
            
            {/* Duration for videos */}
            {meta.duration && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{formatDuration(meta.duration)}</span>
              </div>
            )}
            
            {/* File size */}
            <div className="flex items-center gap-1">
              <HardDrive className="w-3 h-3" />
              <span>{formatFileSize(media.size)}</span>
            </div>
            
            {/* Upload date */}
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{uploadDate}</span>
            </div>
          </div>
        </div>

        {/* Bottom section - Provider badge */}
        <div className="flex items-center justify-between">
          <Badge 
            variant="secondary" 
            className="text-xs bg-white/20 text-white border-white/30 hover:bg-white/30"
          >
            {media.provider}
          </Badge>
          
          {/* Selection indicator */}
          {selected && (
            <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card
      ref={cardRef}
      className={cn(
        "group relative overflow-hidden transition-all duration-200 cursor-pointer",
        "aspect-square", // Maintain square aspect ratio
        "hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-black/20",
        // Selection states
        selected && [
          "ring-2 ring-red-500 ring-offset-2 ring-offset-background",
          "shadow-lg shadow-red-500/20"
        ],
        // Hover states
        !disabled && isClickable && [
          "hover:scale-[1.02]",
          "hover:ring-1 hover:ring-border"
        ],
        // Focus states for keyboard navigation
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2",
        // Disabled state
        disabled && "opacity-50 cursor-not-allowed",
        // Theme-aware styling
        "border-border bg-card text-card-foreground",
        className
      )}
      tabIndex={isClickable && !disabled ? 0 : -1}
      role={isSelectable ? "checkbox" : "button"}
      aria-checked={isSelectable ? selected : undefined}
      aria-label={`${media.filename} - ${formatCompactMetadata(media)}`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Thumbnail */}
      <div className="relative w-full h-full">
        {renderThumbnail()}
        
        {/* Metadata overlay */}
        {renderMetadataOverlay()}
      </div>
    </Card>
  )
}