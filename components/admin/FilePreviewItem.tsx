"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  X, 
  FileIcon, 
  Image as ImageIcon, 
  Video, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Clock,
  RotateCcw
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatFileSize } from "@/lib/utils/metadataFormatter"
import { ImagePreview } from "@/components/admin/ImagePreview"
import type { UploadFile, UploadStatus } from "@/lib/types/upload"

interface FilePreviewItemProps {
  file: UploadFile
  onRemove?: (fileId: string) => void
  onCancel?: (fileId: string) => void
  onRetry?: (fileId: string) => void
  onEdit?: (fileId: string) => void
  className?: string
  disabled?: boolean
}

/**
 * FilePreviewItem Component
 * 
 * Displays individual files in the upload queue with:
 * - File metadata (name, size, type)
 * - Preview based on file type (image, video, or icon)
 * - Progress bar when uploading
 * - Status indicators (pending, uploading, success, error)
 * - Remove button for pending files
 * - Theme-aware styling
 * 
 * Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 19.1, 19.2
 */
export function FilePreviewItem({
  file,
  onRemove,
  onCancel,
  onRetry,
  onEdit,
  className,
  disabled = false,
}: FilePreviewItemProps) {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(file.preview || null)

  const getFileTypeIcon = () => {
    const mimeType = file?.file?.type || ''

    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="w-8 h-8 text-blue-500" />
    }
    
    if (mimeType.startsWith('video/')) {
      return <Video className="w-8 h-8 text-purple-500" />
    }
    
    return <FileIcon className="w-8 h-8 text-gray-500" />
  }

  const getStatusConfig = (status: UploadStatus) => {
    switch (status) {
      case 'pending':
        return {
          icon: <Clock className="w-4 h-4" />,
          label: 'Pending',
          color: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-100 dark:bg-gray-800',
          borderColor: 'border-gray-200 dark:border-gray-700',
        }
      case 'uploading':
        return {
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
          label: 'Uploading',
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-50 dark:bg-blue-950/30',
          borderColor: 'border-blue-200 dark:border-blue-800',
        }
      case 'success':
        return {
          icon: <CheckCircle2 className="w-4 h-4" />,
          label: 'Success',
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-950/30',
          borderColor: 'border-green-200 dark:border-green-800',
        }
      case 'error':
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          label: 'Error',
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-950/30',
          borderColor: 'border-red-200 dark:border-red-800',
        }
      case 'cancelled':
        return {
          icon: <X className="w-4 h-4" />,
          label: 'Cancelled',
          color: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-100 dark:bg-gray-800',
          borderColor: 'border-gray-200 dark:border-gray-700',
        }
      default:
        return {
          icon: <Clock className="w-4 h-4" />,
          label: 'Unknown',
          color: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-100 dark:bg-gray-800',
          borderColor: 'border-gray-200 dark:border-gray-700',
        }
    }
  }

  const statusConfig = getStatusConfig(file.status)
  const canRemove = file.status === 'pending' && onRemove && !disabled
  const canEdit = file.status === 'pending' && onEdit && !disabled
  const canCancel = file.status === 'uploading' && onCancel && !disabled
  const canRetry = file.status === 'error' && onRetry && !disabled && file.retryCount < file.maxRetries
  const isPermanentFailure = file.status === 'error' && file.retryCount >= file.maxRetries
  const showProgress = file.status === 'uploading'

  const renderPreview = () => {
    const mimeType = file?.file?.type || ''

    // Image preview - using ImagePreview component
    if (mimeType.startsWith('image/')) {
      return (
        <ImagePreview
          file={file.file}
          previewUrl={previewUrl || undefined}
          alt={file?.file?.name || 'File'}
          maxWidth={64}
          maxHeight={64}
          className="w-16 h-16 flex-shrink-0"
          onPreviewGenerated={(url) => setPreviewUrl(url)}
          showLoading={true}
        />
      )
    }

    // Video preview
    if (mimeType.startsWith('video/')) {
      return (
        <div className="relative w-16 h-16 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
          {previewUrl ? (
            <video
              src={previewUrl}
              className="w-full h-full object-cover"
              muted
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Video className="w-8 h-8 text-purple-400" />
            </div>
          )}
          {/* Play icon overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center">
              <div className="w-0 h-0 border-l-[6px] border-l-gray-800 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-0.5" />
            </div>
          </div>
        </div>
      )
    }

    // File icon for other types
    return (
      <div className="w-16 h-16 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
        {getFileTypeIcon()}
      </div>
    )
  }

  return (
    <Card
      className={cn(
        "p-3 transition-all duration-200 border-2",
        statusConfig.borderColor,
        statusConfig.bgColor,
        className
      )}
    >
      <div className="flex items-start gap-3">
        {/* Preview */}
        {renderPreview()}

        {/* File Info */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header: Name and Status */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium truncate" title={file.file.name}>
                {file?.file?.name || 'Unknown File'}
              </h4>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(file?.file?.size || 0)}
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  {file.file.type?.split('/')[1]?.toUpperCase() || 'Unknown'}
                </span>
              </div>
            </div>

            {/* Status Badge */}
            <Badge
              variant="outline"
              className={cn(
                "text-xs font-normal flex items-center gap-1 flex-shrink-0",
                statusConfig.color
              )}
            >
              {statusConfig.icon}
              {statusConfig.label}
            </Badge>
          </div>

          {/* Progress Bar */}
          {showProgress && (
            <div className="space-y-1">
              <Progress 
                value={file.progress} 
                className="h-2"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{file.progress}%</span>
                <span>Uploading to {file.provider}</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {file.status === 'error' && file.error && (
            <div className="text-xs text-red-600 dark:text-red-400 flex items-start gap-1">
              <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <span>{file.error}</span>
                {isPermanentFailure && (
                  <div className="mt-1 text-xs text-red-500 dark:text-red-400 font-medium">
                    Maximum retries exceeded ({file.retryCount}/{file.maxRetries})
                  </div>
                )}
                {canRetry && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    Retry {file.retryCount + 1}/{file.maxRetries}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Success Message */}
          {file.status === 'success' && file.result && (
            <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Uploaded successfully</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Retry Button (for failed files with retries remaining) */}
          {canRetry && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRetry!(file.id)}
              disabled={disabled}
              className="h-8 w-8 p-0 hover:bg-orange-100 dark:hover:bg-orange-950/30 hover:text-orange-600 dark:hover:text-orange-400 disabled:opacity-50 disabled:cursor-not-allowed"
              title={`Retry upload (${file.retryCount + 1}/${file.maxRetries})`}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}

          {/* Edit Button (for pending files) */}
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit!(file.id)}
              disabled={disabled}
              className="h-8 w-8 text-xs px-2 hover:bg-blue-100 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Edit file parameters"
            >
              Edit
            </Button>
          )}

          {/* Cancel Button (for uploading files) */}
          {canCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCancel!(file.id)}
              disabled={disabled}
              className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Cancel upload"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
          
          {/* Remove Button (for pending files) */}
          {canRemove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove!(file.id)}
              disabled={disabled}
              className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
