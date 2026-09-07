"use client"

import * as React from "react"
import ReactCrop, { Crop, PixelCrop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface ImageEditorProps {
  /** The File object to edit */
  file: File
  /** Callback when edits are applied */
  onSave: (editedFile: File) => void
  /** Callback when editing is cancelled */
  onCancel: () => void
  /** Additional CSS classes */
  className?: string
}

type AspectRatio = "1:1" | "4:3" | "16:9" | "custom"

/**
 * ImageEditor Component
 * 
 * Provides image cropping and resizing functionality before upload.
 * 
 * Features:
 * - Uses react-image-crop for interactive cropping
 * - Supports preset aspect ratios (1:1, 4:3, 16:9) and custom
 * - Allows manual width and height input for resizing
 * - Processes images client-side using Canvas API
 * - Generates new File object with edits applied
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4
 * 
 * @example
 * ```tsx
 * <ImageEditor 
 *   file={imageFile}
 *   onSave={(editedFile) => handleUpload(editedFile)}
 *   onCancel={() => setShowEditor(false)}
 * />
 * ```
 */
export function ImageEditor({
  file,
  onSave,
  onCancel,
  className,
}: ImageEditorProps) {
  const [imageSrc, setImageSrc] = React.useState<string>("")
  const [crop, setCrop] = React.useState<Crop>()
  const [completedCrop, setCompletedCrop] = React.useState<PixelCrop>()
  const [aspectRatio, setAspectRatio] = React.useState<AspectRatio>("custom")
  const [resizeWidth, setResizeWidth] = React.useState<string>("")
  const [resizeHeight, setResizeHeight] = React.useState<string>("")
  const [isProcessing, setIsProcessing] = React.useState(false)
  
  const imgRef = React.useRef<HTMLImageElement>(null)

  // Load image from file
  React.useEffect(() => {
    const reader = new FileReader()
    reader.onloadend = () => {
      setImageSrc(reader.result as string)
    }
    reader.readAsDataURL(file)

    return () => {
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc)
      }
    }
  }, [file])

  // Update crop aspect ratio when selection changes
  const handleAspectRatioChange = (value: AspectRatio) => {
    setAspectRatio(value)
    
    // Reset crop when changing aspect ratio
    if (value !== "custom") {
      setCrop(undefined)
    }
  }

  // Get numeric aspect ratio for react-image-crop
  const getAspectRatioValue = (): number | undefined => {
    switch (aspectRatio) {
      case "1:1":
        return 1
      case "4:3":
        return 4 / 3
      case "16:9":
        return 16 / 9
      case "custom":
        return undefined
    }
  }

  // Process image with crop and resize using Canvas API
  const processImage = async (): Promise<File> => {
    if (!imgRef.current) {
      throw new Error("Image not loaded")
    }

    const image = imgRef.current
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      throw new Error("Could not get canvas context")
    }

    // Determine source dimensions (crop or full image)
    let sourceX = 0
    let sourceY = 0
    let sourceWidth = image.naturalWidth
    let sourceHeight = image.naturalHeight

    if (completedCrop) {
      const scaleX = image.naturalWidth / image.width
      const scaleY = image.naturalHeight / image.height

      sourceX = completedCrop.x * scaleX
      sourceY = completedCrop.y * scaleY
      sourceWidth = completedCrop.width * scaleX
      sourceHeight = completedCrop.height * scaleY
    }

    // Determine target dimensions (resize or source dimensions)
    let targetWidth = sourceWidth
    let targetHeight = sourceHeight

    const resizeW = parseInt(resizeWidth)
    const resizeH = parseInt(resizeHeight)

    if (resizeW > 0 && resizeH > 0) {
      targetWidth = resizeW
      targetHeight = resizeH
    } else if (resizeW > 0) {
      // Only width specified, maintain aspect ratio
      targetWidth = resizeW
      targetHeight = (sourceHeight / sourceWidth) * resizeW
    } else if (resizeH > 0) {
      // Only height specified, maintain aspect ratio
      targetHeight = resizeH
      targetWidth = (sourceWidth / sourceHeight) * resizeH
    }

    // Set canvas dimensions
    canvas.width = targetWidth
    canvas.height = targetHeight

    // Draw the image with crop and resize
    ctx.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      targetWidth,
      targetHeight
    )

    // Convert canvas to Blob
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to create blob from canvas"))
            return
          }

          // Create new File object with edited image
          const editedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          })

          resolve(editedFile)
        },
        file.type,
        0.95 // Quality for JPEG
      )
    })
  }

  // Handle save button click
  const handleSave = async () => {
    setIsProcessing(true)
    try {
      const editedFile = await processImage()
      onSave(editedFile)
    } catch (error) {
      console.error("Error processing image:", error)
      alert("Failed to process image. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Aspect Ratio Selection */}
      <div className="space-y-2">
        <Label htmlFor="aspect-ratio">Aspect Ratio</Label>
        <Select value={aspectRatio} onValueChange={handleAspectRatioChange}>
          <SelectTrigger id="aspect-ratio">
            <SelectValue placeholder="Select aspect ratio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1:1">1:1 (Square)</SelectItem>
            <SelectItem value="4:3">4:3 (Standard)</SelectItem>
            <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Image Crop Area */}
      <div className="border rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800">
        {imageSrc && (
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={getAspectRatioValue()}
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop preview"
              className="max-w-full h-auto"
              style={{ maxHeight: "400px" }}
            />
          </ReactCrop>
        )}
      </div>

      {/* Resize Inputs */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="resize-width">Width (px)</Label>
          <Input
            id="resize-width"
            type="number"
            min="1"
            placeholder="Auto"
            value={resizeWidth}
            onChange={(e) => setResizeWidth(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="resize-height">Height (px)</Label>
          <Input
            id="resize-height"
            type="number"
            min="1"
            placeholder="Auto"
            value={resizeHeight}
            onChange={(e) => setResizeHeight(e.target.value)}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={isProcessing}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          {isProcessing ? "Processing..." : "Apply Changes"}
        </Button>
      </div>
    </div>
  )
}
