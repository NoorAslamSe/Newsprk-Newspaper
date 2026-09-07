"use client"

import * as React from "react"
import { Video as VideoIcon, Loader2, Play } from "lucide-react"
import { cn } from "@/lib/utils"

interface VideoPreviewProps {
  /** The File object to preview */
  file: File
  /** Optional preview URL if already generated */
  previewUrl?: string
  /** Maximum width for the preview (default: 256px) */
  maxWidth?: number
  /** Maximum height for the preview (default: 256px) */
  maxHeight?: number
  /** Additional CSS classes */
  className?: string
  /** Callback when preview URL is generated */
  onPreviewGenerated?: (url: string) => void
  /** Whether to show loading state */
  showLoading?: boolean
  /** Whether to show play icon overlay */
  showPlayIcon?: boolean
}

/**
 * VideoPreview Component
 * 
 * Generates and displays video previews with playback controls using HTML5 video element.
 * 
 * Features:
 * - Uses URL.createObjectURL to generate preview URL from File
 * - Displays HTML5 video player with controls
 * - Shows play icon overlay when not playing
 * - Handles loading states while the video is being loaded
 * - Cleans up object URLs on unmount to prevent memory leaks
 * - Theme-aware styling with fallback icon
 * 
 * Requirements: 17.2
 * 
 * @example
 * ```tsx
 * <VideoPreview 
 *   file={videoFile} 
 *   maxWidth={400}
 *   maxHeight={300}
 *   showPlayIcon={true}
 * />
 * ```
 */
export function VideoPreview({
  file,
  previewUrl: initialPreviewUrl,
  maxWidth = 256,
  maxHeight = 256,
  className,
  onPreviewGenerated,
  showLoading = true,
  showPlayIcon = true,
}: VideoPreviewProps) {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(initialPreviewUrl || null)
  const [isLoading, setIsLoading] = React.useState<boolean>(!initialPreviewUrl)
  const [error, setError] = React.useState<boolean>(false)
  const [isPlaying, setIsPlaying] = React.useState<boolean>(false)
  const videoRef = React.useRef<HTMLVideoElement>(null)

  React.useEffect(() => {
    // If we already have a preview URL, don't generate a new one
    if (initialPreviewUrl) {
      setPreviewUrl(initialPreviewUrl)
      setIsLoading(false)
      return
    }

    // Validate that the file is a video
    if (!file.type.startsWith('video/')) {
      setError(true)
      setIsLoading(false)
      return
    }

    // Generate preview URL using createObjectURL
    setIsLoading(true)
    setError(false)

    try {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setIsLoading(false)
      
      // Notify parent component
      if (onPreviewGenerated) {
        onPreviewGenerated(url)
      }
    } catch (err) {
      setError(true)
      setIsLoading(false)
    }

    // Cleanup function to revoke object URLs
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [file, initialPreviewUrl, onPreviewGenerated])

  // Handle play/pause events
  const handlePlay = () => {
    setIsPlaying(true)
  }

  const handlePause = () => {
    setIsPlaying(false)
  }

  const handleEnded = () => {
    setIsPlaying(false)
  }

  const containerStyle = {
    maxWidth: `${maxWidth}px`,
    maxHeight: `${maxHeight}px`,
  }

  // Loading state
  if (isLoading && showLoading) {
    return (
      <div
        className={cn(
          "relative rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center",
          className
        )}
        style={containerStyle}
      >
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    )
  }

  // Error state or no preview available
  if (error || !previewUrl) {
    return (
      <div
        className={cn(
          "relative rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center",
          className
        )}
        style={containerStyle}
      >
        <VideoIcon className="w-8 h-8 text-gray-400" />
      </div>
    )
  }

  // Success state - display video player
  return (
    <div
      className={cn(
        "relative rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800",
        className
      )}
      style={containerStyle}
    >
      <video
        ref={videoRef}
        src={previewUrl}
        controls
        className="w-full h-full object-cover"
        style={{
          maxWidth: `${maxWidth}px`,
          maxHeight: `${maxHeight}px`,
        }}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
      >
        Your browser does not support the video tag.
      </video>
      
      {/* Play icon overlay when not playing */}
      {showPlayIcon && !isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/50 rounded-full p-4">
            <Play className="w-8 h-8 text-white fill-white" />
          </div>
        </div>
      )}
    </div>
  )
}
