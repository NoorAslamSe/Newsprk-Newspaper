"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { AdTiming } from "@/lib/types/upload"

interface AdEditorProps {
  /** The File object to edit */
  file: File
  /** Callback when edits are applied */
  onSave: (file: File, vastTag: string, adTiming: AdTiming) => void
  /** Callback when editing is cancelled */
  onCancel: () => void
  /** Additional CSS classes */
  className?: string
}

/**
 * AdEditor Component
 * 
 * Provides advertisement-specific configuration before upload.
 * 
 * Features:
 * - VAST tag input field with validation
 * - Ad timing selection (pre-roll, mid-roll, post-roll)
 * - Basic XML structure validation for VAST tags
 * - Video preview for ad media
 * 
 * Requirements: 10.1, 10.2, 10.3
 * 
 * @example
 * ```tsx
 * <AdEditor 
 *   file={adFile}
 *   onSave={(file, vastTag, adTiming) => handleUpload(file, vastTag, adTiming)}
 *   onCancel={() => setShowEditor(false)}
 * />
 * ```
 */
export function AdEditor({
  file,
  onSave,
  onCancel,
  className,
}: AdEditorProps) {
  const [vastTag, setVastTag] = React.useState<string>("")
  const [adTiming, setAdTiming] = React.useState<AdTiming>("pre-roll")
  const [validationError, setValidationError] = React.useState<string>("")
  const [previewUrl, setPreviewUrl] = React.useState<string>("")
  const [isProcessing, setIsProcessing] = React.useState(false)

  // Load preview from file
  React.useEffect(() => {
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [file])

  /**
   * Validate VAST tag format
   * Checks for basic XML structure and VAST root element
   */
  const validateVastTag = (tag: string): boolean => {
    if (!tag.trim()) {
      setValidationError("VAST tag cannot be empty")
      return false
    }

    // Check for basic XML structure
    const xmlPattern = /<\?xml[^>]*\?>/i
    const vastPattern = /<VAST[^>]*>/i
    
    if (!xmlPattern.test(tag) && !vastPattern.test(tag)) {
      setValidationError("VAST tag must be valid XML with a VAST root element")
      return false
    }

    // Check for closing VAST tag
    if (vastPattern.test(tag) && !/<\/VAST>/i.test(tag)) {
      setValidationError("VAST tag must have a closing </VAST> tag")
      return false
    }

    // Check for reasonable length (VAST tags shouldn't be too short)
    if (tag.length < 50) {
      setValidationError("VAST tag appears to be incomplete")
      return false
    }

    setValidationError("")
    return true
  }

  // Handle VAST tag input change
  const handleVastTagChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setVastTag(value)
    
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError("")
    }
  }

  // Handle save button click
  const handleSave = () => {
    setIsProcessing(true)
    
    try {
      // Validate VAST tag before saving
      if (!validateVastTag(vastTag)) {
        setIsProcessing(false)
        return
      }

      // Call onSave with file and ad configuration
      onSave(file, vastTag, adTiming)
    } catch (error) {
      console.error("Error saving ad configuration:", error)
      setValidationError("Failed to save ad configuration. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  // Determine if file is video for preview
  const isVideo = file.type.startsWith("video/")

  return (
    <div className={cn("space-y-6", className)}>
      {/* File Preview */}
      <div className="space-y-2">
        <Label>Ad Media Preview</Label>
        <div className="border rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800">
          {isVideo ? (
            <video
              src={previewUrl}
              className="w-full h-auto"
              style={{ maxHeight: "300px" }}
              controls
            />
          ) : (
            <img
              src={previewUrl}
              alt="Ad preview"
              className="w-full h-auto"
              style={{ maxHeight: "300px", objectFit: "contain" }}
            />
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          File: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
        </p>
      </div>

      {/* VAST Tag Input */}
      <div className="space-y-2">
        <Label htmlFor="vast-tag">
          VAST Tag <span className="text-red-600">*</span>
        </Label>
        <textarea
          id="vast-tag"
          className={cn(
            "flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            validationError && "border-red-600 focus-visible:ring-red-600"
          )}
          placeholder='<?xml version="1.0" encoding="UTF-8"?><VAST version="4.0">...</VAST>'
          value={vastTag}
          onChange={handleVastTagChange}
          rows={6}
        />
        {validationError && (
          <p className="text-sm text-red-600" role="alert">
            {validationError}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Enter the complete VAST XML tag for this advertisement
        </p>
      </div>

      {/* Ad Timing Selection */}
      <div className="space-y-2">
        <Label htmlFor="ad-timing">
          Ad Timing <span className="text-red-600">*</span>
        </Label>
        <Select value={adTiming} onValueChange={(value) => setAdTiming(value as AdTiming)}>
          <SelectTrigger id="ad-timing" className="min-h-[44px]">
            <SelectValue placeholder="Select ad timing" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pre-roll">Pre-roll (Before content)</SelectItem>
            <SelectItem value="mid-roll">Mid-roll (During content)</SelectItem>
            <SelectItem value="post-roll">Post-roll (After content)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Choose when this ad should be displayed
        </p>
      </div>

      {/* Information Box */}
      <div className="p-4 border rounded-md bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
        <h4 className="font-medium text-sm mb-2 text-blue-900 dark:text-blue-100">
          About VAST Tags
        </h4>
        <p className="text-xs text-blue-800 dark:text-blue-200">
          VAST (Video Ad Serving Template) is an XML-based standard for serving video ads. 
          The VAST tag contains information about the ad creative, tracking URLs, and playback instructions.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          className="min-h-[44px]"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={isProcessing || !vastTag.trim()}
          className="bg-red-600 hover:bg-red-700 text-white min-h-[44px]"
        >
          {isProcessing ? "Saving..." : "Save Ad Configuration"}
        </Button>
      </div>
    </div>
  )
}
