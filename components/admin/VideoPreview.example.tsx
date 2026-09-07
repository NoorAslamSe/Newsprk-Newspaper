/**
 * VideoPreview Component Usage Examples
 * 
 * This file demonstrates various ways to use the VideoPreview component
 * in different contexts within the Hybrid Media Upload System.
 */

import { VideoPreview } from './VideoPreview'

// Example 1: Basic usage in FilePreviewItem (64x64 thumbnail)
export function FilePreviewExample({ file }: { file: File }) {
  return (
    <VideoPreview
      file={file}
      maxWidth={64}
      maxHeight={64}
      className="w-16 h-16 flex-shrink-0"
      showPlayIcon={true}
    />
  )
}

// Example 2: Larger preview in PreUploadEditor (400x300)
export function PreUploadEditorExample({ file }: { file: File }) {
  return (
    <VideoPreview
      file={file}
      maxWidth={400}
      maxHeight={300}
      className="w-full max-w-md"
      showPlayIcon={true}
    />
  )
}

// Example 3: With callback to track when preview is generated
export function WithCallbackExample({ file }: { file: File }) {
  const handlePreviewGenerated = (url: string) => {
    console.log('Video preview generated:', url)
    // You can store this URL in state or send it to a parent component
  }

  return (
    <VideoPreview
      file={file}
      maxWidth={300}
      maxHeight={200}
      onPreviewGenerated={handlePreviewGenerated}
      showPlayIcon={true}
    />
  )
}

// Example 4: Using existing preview URL (no createObjectURL needed)
export function WithExistingUrlExample({ 
  file, 
  existingUrl 
}: { 
  file: File
  existingUrl: string 
}) {
  return (
    <VideoPreview
      file={file}
      previewUrl={existingUrl}
      maxWidth={250}
      maxHeight={150}
      showPlayIcon={true}
    />
  )
}

// Example 5: Without loading state (instant display)
export function NoLoadingStateExample({ file }: { file: File }) {
  return (
    <VideoPreview
      file={file}
      maxWidth={200}
      maxHeight={150}
      showLoading={false}
      showPlayIcon={true}
    />
  )
}

// Example 6: Full-width responsive preview
export function ResponsiveExample({ file }: { file: File }) {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <VideoPreview
        file={file}
        maxWidth={1200}
        maxHeight={675}
        className="w-full rounded-lg shadow-lg"
        showPlayIcon={true}
      />
    </div>
  )
}

// Example 7: Grid of video thumbnails
export function ThumbnailGridExample({ files }: { files: File[] }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {files.map((file, index) => (
        <VideoPreview
          key={index}
          file={file}
          maxWidth={200}
          maxHeight={150}
          className="w-full aspect-video"
          showPlayIcon={true}
        />
      ))}
    </div>
  )
}

// Example 8: With custom styling for different states
export function CustomStyledExample({ file }: { file: File }) {
  return (
    <VideoPreview
      file={file}
      maxWidth={300}
      maxHeight={200}
      className="border-2 border-purple-500 rounded-xl shadow-md hover:shadow-xl transition-shadow"
      showPlayIcon={true}
    />
  )
}

// Example 9: Without play icon overlay (clean video player)
export function NoPlayIconExample({ file }: { file: File }) {
  return (
    <VideoPreview
      file={file}
      maxWidth={400}
      maxHeight={300}
      showPlayIcon={false}
    />
  )
}

// Example 10: Compact preview for upload queue
export function UploadQueueExample({ file }: { file: File }) {
  return (
    <VideoPreview
      file={file}
      maxWidth={80}
      maxHeight={60}
      className="w-20 h-15 rounded"
      showPlayIcon={true}
    />
  )
}
