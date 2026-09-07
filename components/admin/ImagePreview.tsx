"use client"

import * as React from "react"
import { Image as ImageIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImagePreviewProps {
  /** The File object to preview */
  file: File
  /** Optional preview URL if already generated */
  previewUrl?: string
  /** Alt text for the image */
  alt?: string
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
}

/**
 * ImagePreview Component
 * 
 * Generates and displays image thumbnails for preview using the FileReader API.
 * 
 * Features:
 * - Uses FileReader API to read the file and generate a data URL
 * - Sets max dimensions to prevent large images from breaking the layout
 * - Handles loading states while the image is being read
 * - Cleans up object URLs on unmount to prevent memory leaks
 * - Theme-aware styling with fallback icon
 * 
 * Requirements: 17.1
 * 
 * @example
 * ```tsx
 * <ImagePreview 
 *   file={imageFile} 
 *   alt="Product image"
 *   maxWidth={200}
 *   maxHeight={200}
 * />
 * ```
 */
export function ImagePreview({
  file,
  previewUrl: initialPreviewUrl,
  alt,
  maxWidth = 256,
  maxHeight = 256,
  className,
  onPreviewGenerated,
  showLoading = true,
}: ImagePreviewProps) {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(initialPreviewUrl || null)
  const [isLoading, setIsLoading] = React.useState<boolean>(!initialPreviewUrl)
  const [error, setError] = React.useState<boolean>(false)

  React.useEffect(() => {
    // If we already have a preview URL, don't generate a new one
    if (initialPreviewUrl) {
      setPreviewUrl(initialPreviewUrl)
      setIsLoading(false)
      return
    }

    // Validate that the file is an image
    if (!file.type.startsWith('image/')) {
      setError(true)
      setIsLoading(false)
      return
    }

    // Generate preview URL using FileReader API
    setIsLoading(true)
    setError(false)

    const reader = new FileReader()

    reader.onloadstart = () => {
      setIsLoading(true)
    }

    reader.onloadend = () => {
      const result = reader.result as string
      setPreviewUrl(result)
      setIsLoading(false)
      
      // Notify parent component
      if (onPreviewGenerated) {
        onPreviewGenerated(result)
      }
    }

    reader.onerror = () => {
      setError(true)
      setIsLoading(false)
    }

    reader.readAsDataURL(file)

    // Cleanup function to revoke object URLs
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [file, initialPreviewUrl, onPreviewGenerated])

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
        <ImageIcon className="w-8 h-8 text-gray-400" />
      </div>
    )
  }

  // Success state - display image
  return (
    <div
      className={cn(
        "relative rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800",
        className
      )}
      style={containerStyle}
    >
      <img
        src={previewUrl}
        alt={alt || file.name}
        className="w-full h-full object-cover"
        style={{
          maxWidth: `${maxWidth}px`,
          maxHeight: `${maxHeight}px`,
        }}
      />
    </div>
  )
}
