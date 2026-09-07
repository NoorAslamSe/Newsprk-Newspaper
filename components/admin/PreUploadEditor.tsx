"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ImageEditor } from "./ImageEditor"
import { VideoEditor } from "./VideoEditor"
import { AdEditor } from "./AdEditor"
import { UploadFile, AdTiming } from "@/lib/types/upload"

interface PreUploadEditorProps {
  /** The upload file to edit */
  uploadFile: UploadFile
  /** Whether the dialog is open */
  open: boolean
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void
  /** Callback when edits are saved */
  onSave: (editedFile: UploadFile) => void
  /** Callback when editing is skipped */
  onSkip: () => void
}

/**
 * PreUploadEditor Component
 * 
 * Modal dialog for editing media before upload. Conditionally renders
 * the appropriate editor based on file type:
 * - ImageEditor for images (crop, resize)
 * - VideoEditor for videos (trim, controls, thumbnail)
 * - AdEditor for advertisement media (VAST tag, timing)
 * 
 * Features:
 * - Uses shadcn/ui Dialog component
 * - Red theme (#ef4444) for primary actions
 * - Dark mode support
 * - Mobile-friendly with touch-friendly targets (44x44px minimum)
 * - Skip option to upload original file
 * 
 * Requirements: 8.5, 9.5, 10.5, 19.1, 19.2
 * 
 * @example
 * ```tsx
 * <PreUploadEditor
 *   uploadFile={file}
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onSave={(editedFile) => handleSave(editedFile)}
 *   onSkip={() => handleSkip()}
 * />
 * ```
 */
export function PreUploadEditor({
  uploadFile,
  open,
  onOpenChange,
  onSave,
  onSkip,
}: PreUploadEditorProps) {
  const { file } = uploadFile
  const fileType = getFileType(file)

  // Handle save from ImageEditor
  const handleImageSave = (editedFile: File) => {
    const updatedUploadFile: UploadFile = {
      ...uploadFile,
      file: editedFile,
    }
    onSave(updatedUploadFile)
    onOpenChange(false)
  }

  // Handle save from VideoEditor
  const handleVideoSave = (
    editedFile: File,
    edits: {
      trim?: { start: number; end: number }
      videoControls?: { autoplay: boolean; mute: boolean; loop: boolean }
      thumbnailTime?: number
    }
  ) => {
    const updatedUploadFile: UploadFile = {
      ...uploadFile,
      file: editedFile,
      edits: {
        ...uploadFile.edits,
        ...edits,
      },
    }
    onSave(updatedUploadFile)
    onOpenChange(false)
  }

  // Handle save from AdEditor
  const handleAdSave = (file: File, vastTag: string, adTiming: AdTiming) => {
    const updatedUploadFile: UploadFile = {
      ...uploadFile,
      file,
      vastTag,
      adTiming,
    }
    onSave(updatedUploadFile)
    onOpenChange(false)
  }

  // Handle skip button
  const handleSkip = () => {
    onSkip()
    onOpenChange(false)
  }

  // Handle cancel button
  const handleCancel = () => {
    onOpenChange(false)
  }

  // Get editor title based on file type
  const getEditorTitle = (): string => {
    switch (fileType) {
      case "image":
        return "Edit Image"
      case "video":
        return "Configure Video"
      case "ad":
        return "Configure Advertisement"
      default:
        return "Edit File"
    }
  }

  // Get editor description based on file type
  const getEditorDescription = (): string => {
    switch (fileType) {
      case "image":
        return "Crop and resize your image before uploading."
      case "video":
        return "Configure video settings and select a thumbnail frame."
      case "ad":
        return "Add VAST tag and configure ad timing."
      default:
        return "Configure your file before uploading."
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getEditorTitle()}</DialogTitle>
          <DialogDescription>{getEditorDescription()}</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {fileType === "image" && (
            <ImageEditor
              file={file}
              onSave={handleImageSave}
              onCancel={handleCancel}
            />
          )}

          {fileType === "video" && (
            <VideoEditor
              file={file}
              onSave={handleVideoSave}
              onCancel={handleCancel}
            />
          )}

          {fileType === "ad" && (
            <AdEditor
              file={file}
              onSave={handleAdSave}
              onCancel={handleCancel}
            />
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleSkip}
            className="min-h-[44px]"
          >
            Skip Editing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Determine file type from MIME type
 * Checks for ad-specific indicators in filename or tags
 */
function getFileType(file: File): "image" | "video" | "ad" | "file" {
  const mimeType = file.type.toLowerCase()
  const fileName = file.name.toLowerCase()

  // Check if it's an ad based on filename
  const isAd =
    fileName.includes("ad") ||
    fileName.includes("advertisement") ||
    fileName.includes("vast")

  if (isAd) {
    return "ad"
  }

  if (mimeType.startsWith("image/")) {
    return "image"
  }

  if (mimeType.startsWith("video/")) {
    return "video"
  }

  return "file"
}
