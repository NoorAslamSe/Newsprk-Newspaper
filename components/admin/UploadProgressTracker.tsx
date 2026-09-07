"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  X, 
  RotateCcw,
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Clock,
  Upload
} from "lucide-react"
import { cn } from "@/lib/utils"
import { FilePreviewItem } from "@/components/admin/FilePreviewItem"
import type { UploadFile, UploadStatus } from "@/lib/types/upload"

interface UploadProgressTrackerProps {
  files: UploadFile[]
  onCancel?: (fileId: string) => void
  onRetry?: (fileId: string) => void
  className?: string
}

/**
 * UploadProgressTracker Component
 * 
 * Displays the upload queue with progress tracking for each file.
 * 
 * Features:
 * - Individual progress bars for each file in upload queue
 * - Status indicators (pending, uploading, success, error, cancelled)
 * - Cancel button for uploading files
 * - Retry button for failed files (max 3 retries)
 * - Batch upload summary
 * - aria-live regions for screen reader announcements
 * - Theme-aware colors for progress bars
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 20.1, 20.2, 22.1, 22.2, 22.4, 27.3, 19.3
 * 
 * @param files - Array of files in the upload queue
 * @param onCancel - Callback when cancel button is clicked
 * @param onRetry - Callback when retry button is clicked
 * @param className - Additional CSS classes
 */
export function UploadProgressTracker({
  files,
  onCancel,
  onRetry,
  className,
}: UploadProgressTrackerProps) {
  // Calculate batch summary statistics
  const summary = React.useMemo(() => {
    const total = files.length
    const pending = files.filter(f => f.status === 'pending').length
    const uploading = files.filter(f => f.status === 'uploading').length
    const success = files.filter(f => f.status === 'success').length
    const error = files.filter(f => f.status === 'error').length
    const cancelled = files.filter(f => f.status === 'cancelled').length
    
    return { total, pending, uploading, success, error, cancelled }
  }, [files])

  // Generate screen reader announcement
  const announcement = React.useMemo(() => {
    if (summary.uploading > 0) {
      return `Uploading ${summary.uploading} of ${summary.total} files`
    }
    if (summary.success === summary.total && summary.total > 0) {
      return `All ${summary.total} files uploaded successfully`
    }
    if (summary.error > 0) {
      return `${summary.error} file${summary.error > 1 ? 's' : ''} failed to upload`
    }
    return ''
  }, [summary])

  const getSummaryText = () => {
    if (summary.total === 0) {
      return "No files in queue"
    }
    
    const completed = summary.success + summary.error + summary.cancelled
    
    if (summary.uploading > 0) {
      return `Uploading ${summary.uploading} of ${summary.total} files (${summary.success} completed)`
    }
    
    if (completed === summary.total) {
      if (summary.error > 0) {
        return `${summary.success} of ${summary.total} files uploaded successfully`
      }
      return `All ${summary.total} files uploaded successfully`
    }
    
    return `${summary.pending} file${summary.pending !== 1 ? 's' : ''} ready to upload`
  }

  const getSummaryColor = () => {
    if (summary.error > 0 && summary.uploading === 0) {
      return "text-red-600 dark:text-red-400"
    }
    if (summary.success === summary.total && summary.total > 0) {
      return "text-green-600 dark:text-green-400"
    }
    if (summary.uploading > 0) {
      return "text-blue-600 dark:text-blue-400"
    }
    return "text-muted-foreground"
  }

  const handleCancel = (fileId: string) => {
    if (onCancel) {
      onCancel(fileId)
    }
  }

  const handleRetry = (fileId: string) => {
    if (onRetry) {
      onRetry(fileId)
    }
  }

  const canRetry = (file: UploadFile) => {
    return file.status === 'error' && file.retryCount < file.maxRetries
  }

  const canCancel = (file: UploadFile) => {
    return file.status === 'uploading'
  }

  if (files.length === 0) {
    return null
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Progress
          </CardTitle>
          
          {/* Batch Summary */}
          <div className={cn("text-sm font-medium", getSummaryColor())}>
            {getSummaryText()}
          </div>
        </div>

        {/* Progress Summary Bar */}
        {summary.total > 0 && (
          <div className="mt-3 space-y-2">
            <Progress 
              value={(summary.success / summary.total) * 100} 
              className="h-2"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                {summary.success > 0 && (
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="w-3 h-3" />
                    {summary.success} success
                  </span>
                )}
                {summary.error > 0 && (
                  <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                    <AlertCircle className="w-3 h-3" />
                    {summary.error} failed
                  </span>
                )}
                {summary.uploading > 0 && (
                  <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {summary.uploading} uploading
                  </span>
                )}
                {summary.pending > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {summary.pending} pending
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Screen reader announcements */}
        <div 
          role="status" 
          aria-live="polite" 
          aria-atomic="true"
          className="sr-only"
        >
          {announcement}
        </div>

        {/* Individual file progress items */}
        {files.map((file) => (
          <div key={file.id} className="relative">
            <FilePreviewItem
              file={file}
              className="pr-24"
            />
            
            {/* Action buttons overlay */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {/* Cancel button for uploading files */}
              {canCancel(file) && onCancel && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCancel(file.id)}
                  className="h-8 px-3 hover:bg-red-100 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400"
                  title="Cancel upload"
                  aria-label={`Cancel upload of ${file.file.name}`}
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              )}

              {/* Retry button for failed files */}
              {canRetry(file) && onRetry && (
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className="text-xs text-muted-foreground"
                  >
                    {file.retryCount}/{file.maxRetries} retries
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRetry(file.id)}
                    className="h-8 px-3 hover:bg-blue-100 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400"
                    title="Retry upload"
                    aria-label={`Retry upload of ${file.file.name}`}
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Retry
                  </Button>
                </div>
              )}

              {/* Max retries exceeded indicator */}
              {file.status === 'error' && file.retryCount >= file.maxRetries && (
                <Badge 
                  variant="outline" 
                  className="text-xs text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
                >
                  Max retries exceeded
                </Badge>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
