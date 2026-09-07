"use client"

import * as React from "react"
import { useDropzone } from "react-dropzone"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, FileImage, FileVideo } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUploadStore } from "@/lib/stores/uploadStore"
import { validateFile } from "@/lib/utils/fileValidator"
import { getProviderRecommendation } from "@/lib/utils/fileRouter"
import { toast } from "sonner"
import { FilePreviewItem } from "./FilePreviewItem"
import { uploadToCDNWithCancel } from "@/lib/uploaders/cdnUploader"
import { uploadToSupabaseWithCancel } from "@/lib/uploaders/supabaseUploader"
import { saveMediaMetadataAction } from "@/lib/actions/media"
import type { UploadFile } from "@/lib/types/upload"
import { PreUploadEditor } from "./PreUploadEditor"
import { compressImage } from "@/lib/utils/imageCompression"

interface MediaUploadDialogProps {
  /** Whether the dialog is open */
  open: boolean
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void
  /** Callback when upload completes successfully */
  onUploadComplete?: () => void
  /** Default folder for uploads */
  defaultFolder?: string
}

/**
 * MediaUploadDialog Component
 * 
 * Main upload interface with drag-and-drop functionality using react-dropzone.
 * Supports multiple file selection, visual feedback, and keyboard accessibility.
 * 
 * Features:
 * - Drag-and-drop file upload with react-dropzone
 * - Visual highlight on drag-over
 * - Multiple file selection support
 * - Display accepted file types and size limits
 * - Keyboard accessible (Enter/Space to open file dialog)
 * - Touch-friendly targets on mobile (44x44px minimum)
 * - File validation with user-friendly error messages
 * - Provider recommendation based on file type
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 21.1, 27.1, 18.2
 * 
 * @example
 * ```tsx
 * <MediaUploadDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onUploadComplete={() => refreshMediaLibrary()}
 * />
 * ```
 */
export function MediaUploadDialog({
  open,
  onOpenChange,
  onUploadComplete,
  defaultFolder,
}: MediaUploadDialogProps) {
  const { addFiles, files, removeFile, updateFile, startUpload, isUploading, clearCompleted, cancelUpload, retryUpload } = useUploadStore()
  const [activeUploads, setActiveUploads] = React.useState<Set<string>>(new Set())
  const [uploadHandles, setUploadHandles] = React.useState<Map<string, { abort: () => void }>>(new Map())
  const [editingFileId, setEditingFileId] = React.useState<string | null>(null)

  const handleEditSave = React.useCallback((editedFile: UploadFile) => {
    updateFile(editedFile.id, {
      file: editedFile.file,
      edits: editedFile.edits,
      vastTag: editedFile.vastTag,
      adTiming: editedFile.adTiming
    })
    setEditingFileId(null)
  }, [updateFile])

  /**
   * Handle upload cancellation
   * 
   * Cancels an in-progress upload using AbortController, updates file status
   * to "cancelled" in store, and displays cancellation toast notification.
   * Ensures no database record is created for cancelled uploads.
   * 
   * Requirements: 20.1, 20.2, 20.3, 20.4, 20.5
   */
  const handleCancelUpload = React.useCallback((fileId: string) => {
    // Get the upload handle for this file
    const handle = uploadHandles.get(fileId)
    
    if (handle) {
      // Abort the upload
      handle.abort()
      
      // Remove from upload handles
      setUploadHandles(prev => {
        const newMap = new Map(prev)
        newMap.delete(fileId)
        return newMap
      })
    }

    // Update file status to cancelled in store
    cancelUpload(fileId)
    
    // Remove from active uploads
    setActiveUploads(prev => {
      const newSet = new Set(prev)
      newSet.delete(fileId)
      return newSet
    })

    // Find the file to get its name for the toast
    const file = files.find(f => f.id === fileId)
    if (file) {
      toast.info(`Upload cancelled: ${file.file.name}`, {
        description: `File upload was cancelled by user`
      })
    }
  }, [uploadHandles, cancelUpload, files])

  /**
   * Handle upload retry
   * 
   * Retries a failed upload by resetting the file status to pending,
   * incrementing the retry count, and preserving all file metadata.
   * Enforces maximum retry limit of 3 attempts per file.
   * 
   * Requirements: 22.1, 22.2, 22.3, 22.4, 22.5
   */
  const handleRetryUpload = React.useCallback((fileId: string) => {
    const file = files.find(f => f.id === fileId)
    
    if (!file) {
      toast.error('Retry failed: File not found', {
        description: 'The file you are trying to retry could not be found in the upload queue'
      })
      return
    }

    if (file.retryCount >= file.maxRetries) {
      toast.error(`Retry limit exceeded: ${file.file.name}`, {
        description: `Maximum ${file.maxRetries} retry attempts have been reached`
      })
      return
    }

    // Use the store's retry function which preserves metadata
    retryUpload(fileId)
    
    toast.info(`Retrying upload: ${file.file.name}`, {
      description: `Attempt ${file.retryCount + 2} of ${file.maxRetries + 1}`
    })
  }, [files, retryUpload])

  /**
   * Handle upload orchestration with parallel processing and cancellation support
   * 
   * Implements parallel upload with concurrency limit of 3, routes files to
   * appropriate uploader based on provider, updates progress in Zustand store,
   * and saves metadata after successful upload. Supports upload cancellation
   * using AbortController.
   * 
   * Requirements: 1.2, 2.1, 2.2, 2.3, 21.3, 21.4, 20.1, 20.2, 20.3, 20.4
   */
  const handleUpload = React.useCallback(async () => {
    const pendingFiles = files.filter(f => f.status === 'pending')
    
    if (pendingFiles.length === 0) {
      toast.error('No files to upload', {
        description: 'Please add files to the upload queue before starting upload'
      })
      return
    }

    // Start upload process
    startUpload()
    setActiveUploads(new Set())
    setUploadHandles(new Map())

    try {
      // Process uploads with concurrency limit of 3
      const CONCURRENCY_LIMIT = 3
      const uploadPromises: Promise<void>[] = []
      let activeCount = 0
      let fileIndex = 0

      const processNextFile = async (): Promise<void> => {
        if (fileIndex >= pendingFiles.length) return

        const file = pendingFiles[fileIndex++]
        activeCount++
        setActiveUploads(prev => new Set(prev).add(file.id))

        try {
          // Update file status to uploading
          updateFile(file.id, { status: 'uploading', progress: 0 })

          // Route to appropriate uploader based on provider with cancellation support
          let uploadResult: any
          let uploadHandle: { abort: () => void }
          
          let fileToUpload = file.file;
          
          // Image compression logic for large images
          if (fileToUpload.type.startsWith('image/') && fileToUpload.size > 1024 * 1024) {
            try {
              fileToUpload = await compressImage(fileToUpload, 1, 1920, 0.8);
            } catch (err) {
              console.warn('Image compression failed, using original', err);
            }
          }
          
          // Switch to Supabase by default
          const useSupabase = true; // Use supabase as instructed
          
          let uploadAction = useSupabase ? uploadToSupabaseWithCancel : uploadToCDNWithCancel;
          
          const { promise, abort } = uploadAction(
            fileToUpload,
            {
              folder: file.folder || defaultFolder || 'uploads',
              contentType: file.file.type,
            },
            (progress) => {
              updateFile(file.id, { progress })
            }
          )
          
          uploadHandle = { abort }
          // Store upload handle immediately for cancellation
          setUploadHandles(prev => new Map(prev).set(file.id, uploadHandle))
          
          uploadResult = await promise

          // Update file status to processing metadata
          updateFile(file.id, { 
            status: 'uploading', 
            progress: 95,
          })

          // Save metadata to database (only if upload wasn't cancelled)
          const currentFile = files.find(f => f.id === file.id)
          if (currentFile?.status === 'cancelled') {
            // Upload was cancelled, don't save metadata
            return
          }

          const metadataResult = await saveMediaMetadataAction({
            filename: fileToUpload.name,
            mimeType: fileToUpload.type,
            size: fileToUpload.size,
            url: uploadResult.url,
            provider: file.provider,
            variants: {
              original: uploadResult.url,
              thumbnail: null,
              medium: null,
            },
            metadata: {
              width: (uploadResult as any).width,
              height: (uploadResult as any).height,
              duration: (uploadResult as any).duration,
              format: (uploadResult as any).format,
            },
            alt: file.alt,
            tags: file.tags,
            folder: file.folder || defaultFolder || 'uploads',
            cdnKey: (uploadResult as any).key,
            objectPath: (uploadResult as any).objectPath,
            publicUrl: (uploadResult as any).url,
            bucket: (uploadResult as any).bucket,
          })

          if (!metadataResult.success) {
            throw new Error(metadataResult.error || 'Failed to save metadata')
          }

          // Update file status to success
          updateFile(file.id, { 
            status: 'success', 
            progress: 100,
            result: {
              id: uploadResult.id,
              url: uploadResult.url,
              key: (uploadResult as any).key,
            },
          })

          // Enhanced success toast with detailed information
          const fileSize = (file.file.size / (1024 * 1024)).toFixed(1)
          
          toast.success(`Upload complete: ${file.file.name}`, {
            description: `${fileSize}MB uploaded to CDN successfully`
          })

        } catch (error) {
          // Check if this was a cancellation
          if (error instanceof Error && error.message.includes('cancelled')) {
            // Don't show error toast for cancellations, the cancel handler already showed a toast
            return
          }

          // Enhanced error toast with specific failure reason
          const errorMessage = error instanceof Error ? error.message : 'Upload failed'
          
          updateFile(file.id, { 
            status: 'error', 
            progress: 0,
            error: errorMessage,
          })

          toast.error(`Upload failed: ${file.file.name}`, {
            description: `CDN upload error: ${errorMessage}`
          })
        } finally {
          activeCount--
          setActiveUploads(prev => {
            const newSet = new Set(prev)
            newSet.delete(file.id)
            return newSet
          })

          // Remove upload handle
          setUploadHandles(prev => {
            const newMap = new Map(prev)
            newMap.delete(file.id)
            return newMap
          })

          // Process next file if available
          if (fileIndex < pendingFiles.length) {
            uploadPromises.push(processNextFile())
          }
        }
      }

      // Start initial batch of uploads (up to concurrency limit)
      for (let i = 0; i < Math.min(CONCURRENCY_LIMIT, pendingFiles.length); i++) {
        uploadPromises.push(processNextFile())
      }

      // Wait for all uploads to complete
      await Promise.all(uploadPromises)

      // Enhanced batch upload summary toast
      const totalFiles = pendingFiles.length
      const successCount = files.filter(f => f.status === 'success').length
      const errorCount = files.filter(f => f.status === 'error').length
      const cancelledCount = files.filter(f => f.status === 'cancelled').length

      if (successCount > 0 && errorCount === 0 && cancelledCount === 0) {
        // All files uploaded successfully
        toast.success(`Batch upload complete`, {
          description: `All ${successCount} file${successCount > 1 ? 's' : ''} uploaded successfully`
        })
      } else if (successCount > 0) {
        // Mixed results
        const failedCount = errorCount + cancelledCount
        toast.success(`Batch upload complete`, {
          description: `${successCount} of ${totalFiles} files uploaded successfully${failedCount > 0 ? `, ${failedCount} failed` : ''}`
        })
      }

      if (errorCount > 0) {
        toast.error(`Upload errors occurred`, {
          description: `${errorCount} file${errorCount > 1 ? 's' : ''} failed to upload. Check individual file status for details.`
        })
      }

      // Call completion callback
      if (onUploadComplete && successCount > 0) {
        onUploadComplete()
      }

    } catch (error) {
      console.error('Upload orchestration error:', error)
      toast.error('Upload process failed', {
        description: 'An unexpected error occurred during the upload process. Please try again.'
      })
    } finally {
      // Reset upload state
      setActiveUploads(new Set())
      setUploadHandles(new Map())
    }
  }, [files, startUpload, updateFile, defaultFolder, onUploadComplete, uploadHandles, cancelUpload])

  // Check if upload button should be disabled
  const canUpload = files.some(f => f.status === 'pending') && !isUploading

  // Handle file drop/selection
  const onDrop = React.useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      // Handle rejected files with enhanced warning toasts
      if (rejectedFiles.length > 0) {
        rejectedFiles.forEach((rejection) => {
          const { file, errors } = rejection
          const errorMessages = errors.map((e: any) => e.message).join(", ")
          toast.warning(`Invalid file: ${file.name}`, {
            description: errorMessages
          })
        })
      }

      // Validate and add accepted files
      if (acceptedFiles.length > 0) {
        const validFiles: File[] = []
        const invalidFiles: { file: File; error: string }[] = []

        acceptedFiles.forEach((file) => {
          // Validate file with recommended provider
          const validation = validateFile(file, 'cdn')
          
          if (validation.valid) {
            validFiles.push(file)
          } else {
            invalidFiles.push({ file, error: validation.error || "Unknown error" })
          }
        })

        // Show enhanced warning toasts for invalid files
        invalidFiles.forEach(({ file, error }) => {
          toast.warning(`File validation failed: ${file.name}`, {
            description: error
          })
        })

        // Add valid files to upload queue with enhanced success toast
        if (validFiles.length > 0) {
          addFiles(validFiles)
          const totalSize = validFiles.reduce((sum, file) => sum + file.size, 0)
          const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(1)
          
          toast.success(
            `Files added to queue`,
            {
              description: `${validFiles.length} file${validFiles.length > 1 ? "s" : ""} (${totalSizeMB}MB) ready for upload`
            }
          )
        }
      }
    },
    [addFiles]
  )

  // Configure react-dropzone
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/gif": [".gif"],
      "image/webp": [".webp"],
      "video/mp4": [".mp4"],
      "video/webm": [".webm"],
    },
    multiple: true,
    maxSize: 524288000, // 500MB max
  })

  // Get dropzone border color based on state
  const getBorderColor = () => {
    if (isDragReject) return "border-destructive"
    if (isDragAccept) return "border-red-500"
    if (isDragActive) return "border-red-400"
    return "border-border"
  }

  // Get dropzone background color based on state
  const getBackgroundColor = () => {
    if (isDragReject) return "bg-destructive/10"
    if (isDragAccept) return "bg-red-50 dark:bg-red-950/20"
    if (isDragActive) return "bg-red-50/50 dark:bg-red-950/10"
    return "bg-background"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Media</DialogTitle>
          <DialogDescription>
            Drag and drop files here, or click to select files from your device.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={cn(
              "relative flex flex-col items-center justify-center",
              "min-h-[280px] rounded-lg border-2 border-dashed",
              "cursor-pointer transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
              "hover:border-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/10",
              getBorderColor(),
              getBackgroundColor()
            )}
            role="button"
            tabIndex={0}
            aria-label="Upload files. Press Enter or Space to open file dialog"
          >
            <input {...getInputProps()} aria-label="File upload input" />

            <div className="flex flex-col items-center justify-center space-y-4 p-8 text-center">
              {/* Icon */}
              <div
                className={cn(
                  "rounded-full p-4 transition-colors",
                  isDragActive
                    ? "bg-red-100 dark:bg-red-900/30"
                    : "bg-muted"
                )}
              >
                <Upload
                  className={cn(
                    "h-10 w-10 transition-colors",
                    isDragActive
                      ? "text-red-500"
                      : "text-muted-foreground"
                  )}
                  aria-hidden="true"
                />
              </div>

              {/* Text */}
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  {isDragActive
                    ? isDragReject
                      ? "Some files are not supported"
                      : "Drop files here"
                    : "Drag & drop files here"}
                </p>
                <p className="text-sm text-muted-foreground">
                  or click to browse from your device
                </p>
              </div>

              {/* Accepted file types */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileImage className="h-4 w-4" aria-hidden="true" />
                  <span>Images: JPEG, PNG, GIF, WebP</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileVideo className="h-4 w-4" aria-hidden="true" />
                  <span>Videos: MP4, WebM</span>
                </div>
              </div>

              {/* Size limits */}
              <div className="pt-2 text-xs text-muted-foreground">
                <p>Maximum file size: 500MB</p>
              </div>
            </div>

            {/* Drag overlay */}
            {isDragActive && (
              <div
                className={cn(
                  "absolute inset-0 rounded-lg",
                  "flex items-center justify-center",
                  "bg-background/80 backdrop-blur-sm",
                  isDragReject && "bg-destructive/10"
                )}
              >
                <div className="text-center">
                  <Upload
                    className={cn(
                      "mx-auto h-16 w-16 mb-4",
                      isDragReject ? "text-destructive" : "text-red-500"
                    )}
                    aria-hidden="true"
                  />
                  <p className="text-xl font-semibold">
                    {isDragReject ? "Invalid files" : "Drop to upload"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Help text */}
          <div className="rounded-lg bg-muted p-4 text-sm">
            <p className="font-medium mb-2">Tips:</p>
            <ul className="space-y-1 text-muted-foreground list-disc list-inside">
              <li>You can select multiple files at once</li>
              <li>All uploads are securely directed to the CDN</li>
              <li>Use keyboard (Enter/Space) to open file dialog</li>
            </ul>
          </div>

          {/* File Preview List */}
          {files.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Files in Queue ({files.length})</h3>
                <div className="flex items-center gap-2">
                  {files.some(f => f.status === 'pending') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        files.filter(f => f.status === 'pending').forEach(f => removeFile(f.id))
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground"
                      disabled={isUploading}
                    >
                      Clear Pending
                    </Button>
                  )}
                  {files.some(f => f.status === 'success' || f.status === 'error') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearCompleted}
                      className="text-xs text-muted-foreground hover:text-foreground"
                      disabled={isUploading}
                    >
                      Clear Completed
                    </Button>
                  )}
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {files.map((file) => (
                  <FilePreviewItem
                    key={file.id}
                    file={file}
                    onRemove={removeFile}
                    onCancel={handleCancelUpload}
                    onRetry={handleRetryUpload}
                    onEdit={setEditingFileId}
                    disabled={isUploading || activeUploads.has(file.id)}
                  />
                ))}
              </div>
              
              {/* Upload Button */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  {files.filter(f => f.status === 'pending').length} pending, {' '}
                  {files.filter(f => f.status === 'success').length} completed, {' '}
                  {files.filter(f => f.status === 'error').length} failed
                </div>
                <Button
                  onClick={handleUpload}
                  disabled={!canUpload}
                  className="min-w-[120px]"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Files
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>

      {editingFileId && (
        <PreUploadEditor
          uploadFile={files.find(f => f.id === editingFileId)!}
          open={!!editingFileId}
          onOpenChange={(open) => !open && setEditingFileId(null)}
          onSave={handleEditSave}
          onSkip={() => setEditingFileId(null)}
        />
      )}
    </Dialog>
  )
}
