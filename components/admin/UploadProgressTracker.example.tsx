/**
 * UploadProgressTracker Component - Usage Examples
 * 
 * This file demonstrates how to use the UploadProgressTracker component
 * in various scenarios within the Hybrid Media Upload System.
 */

import { UploadProgressTracker } from './UploadProgressTracker'
import { useUploadStore } from '@/lib/stores/uploadStore'

/**
 * Example 1: Basic Usage with Upload Store
 * 
 * The most common usage pattern - connect directly to the upload store
 * to display real-time progress for all files in the queue.
 */
export function BasicUploadProgressExample() {
  const { files, cancelUpload, retryUpload } = useUploadStore()

  return (
    <UploadProgressTracker
      files={files}
      onCancel={cancelUpload}
      onRetry={retryUpload}
    />
  )
}

/**
 * Example 2: Filtered Progress Tracker
 * 
 * Show only files with specific statuses (e.g., only active uploads)
 */
export function ActiveUploadsOnlyExample() {
  const { files, cancelUpload } = useUploadStore()
  
  // Filter to show only uploading files
  const activeFiles = files.filter(f => f.status === 'uploading')

  return (
    <UploadProgressTracker
      files={activeFiles}
      onCancel={cancelUpload}
    />
  )
}

/**
 * Example 3: Read-Only Progress Display
 * 
 * Display progress without cancel/retry actions
 */
export function ReadOnlyProgressExample() {
  const { files } = useUploadStore()

  return (
    <UploadProgressTracker
      files={files}
      // No onCancel or onRetry callbacks = no action buttons
    />
  )
}

/**
 * Example 4: Custom Styling
 * 
 * Apply custom CSS classes for different layouts
 */
export function CustomStyledProgressExample() {
  const { files, cancelUpload, retryUpload } = useUploadStore()

  return (
    <UploadProgressTracker
      files={files}
      onCancel={cancelUpload}
      onRetry={retryUpload}
      className="max-w-2xl mx-auto shadow-lg"
    />
  )
}

/**
 * Example 5: Integration with Upload Dialog
 * 
 * Typical usage within a media upload dialog
 */
export function UploadDialogWithProgressExample() {
  const { files, cancelUpload, retryUpload, clearCompleted } = useUploadStore()
  
  const hasCompletedFiles = files.some(f => 
    f.status === 'success' || f.status === 'error'
  )

  return (
    <div className="space-y-4">
      {/* Upload form/dropzone would go here */}
      
      {/* Progress tracker */}
      {files.length > 0 && (
        <UploadProgressTracker
          files={files}
          onCancel={cancelUpload}
          onRetry={retryUpload}
        />
      )}
      
      {/* Clear completed button */}
      {hasCompletedFiles && (
        <button
          onClick={clearCompleted}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Clear completed uploads
        </button>
      )}
    </div>
  )
}

/**
 * Example 6: Separate Sections for Different Statuses
 * 
 * Display active and completed uploads in separate sections
 */
export function SeparatedStatusProgressExample() {
  const { files, cancelUpload, retryUpload } = useUploadStore()
  
  const activeFiles = files.filter(f => 
    f.status === 'pending' || f.status === 'uploading'
  )
  
  const completedFiles = files.filter(f => 
    f.status === 'success' || f.status === 'error' || f.status === 'cancelled'
  )

  return (
    <div className="space-y-6">
      {/* Active uploads */}
      {activeFiles.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Active Uploads</h3>
          <UploadProgressTracker
            files={activeFiles}
            onCancel={cancelUpload}
          />
        </div>
      )}
      
      {/* Completed uploads */}
      {completedFiles.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Completed</h3>
          <UploadProgressTracker
            files={completedFiles}
            onRetry={retryUpload}
          />
        </div>
      )}
    </div>
  )
}

/**
 * Key Features Demonstrated:
 * 
 * 1. Individual progress bars for each file (Requirement 6.1, 6.2)
 * 2. Status indicators: pending, uploading, success, error, cancelled (Requirement 6.3)
 * 3. Cancel button for uploading files (Requirement 20.1, 20.2)
 * 4. Retry button for failed files with retry count (Requirement 22.1, 22.2, 22.4)
 * 5. Batch upload summary (Requirement 21.5)
 * 6. Screen reader announcements via aria-live (Requirement 27.3)
 * 7. Theme-aware colors (Requirement 19.3)
 * 8. Error message display (Requirement 6.5)
 * 9. Success indicators (Requirement 6.4)
 * 
 * Accessibility Features:
 * - aria-live regions for progress announcements
 * - Descriptive aria-labels on action buttons
 * - Keyboard accessible buttons
 * - Screen reader friendly status updates
 * 
 * Theme Support:
 * - Automatic light/dark mode support
 * - Theme-aware progress bar colors
 * - Theme-aware status indicator colors
 * - Consistent with shadcn/ui design system
 */
