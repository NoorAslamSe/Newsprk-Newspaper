/**
 * ImagePreview Component Usage Examples
 * 
 * This file demonstrates various ways to use the ImagePreview component
 * in different contexts within the Hybrid Media Upload System.
 */

import { ImagePreview } from './ImagePreview'

// Example 1: Basic usage in FilePreviewItem (64x64 thumbnail)
export function FilePreviewExample({ file }: { file: File }) {
  return (
    <ImagePreview
      file={file}
      alt={file.name}
      maxWidth={64}
      maxHeight={64}
      className="w-16 h-16 flex-shrink-0"
    />
  )
}

// Example 2: Larger preview in PreUploadEditor (300x300)
export function PreUploadEditorExample({ file }: { file: File }) {
  return (
    <ImagePreview
      file={file}
      alt="Preview for editing"
      maxWidth={300}
      maxHeight={300}
      className="w-full max-w-sm"
    />
  )
}

// Example 3: With callback to track when preview is generated
export function WithCallbackExample({ file }: { file: File }) {
  const handlePreviewGenerated = (url: string) => {
    console.log('Preview generated:', url)
    // You can store this URL in state or send it to a parent component
  }

  return (
    <ImagePreview
      file={file}
      alt={file.name}
      maxWidth={200}
      maxHeight={200}
      onPreviewGenerated={handlePreviewGenerated}
    />
  )
}

// Example 4: Using existing preview URL (no FileReader needed)
export function WithExistingUrlExample({ 
  file, 
  existingUrl 
}: { 
  file: File
  existingUrl: string 
}) {
  return (
    <ImagePreview
      file={file}
      previewUrl={existingUrl}
      alt={file.name}
      maxWidth={150}
      maxHeight={150}
    />
  )
}

// Example 5: Without loading state (instant display)
export function NoLoadingStateExample({ file }: { file: File }) {
  return (
    <ImagePreview
      file={file}
      alt={file.name}
      maxWidth={100}
      maxHeight={100}
      showLoading={false}
    />
  )
}

// Example 6: Full-width responsive preview
export function ResponsiveExample({ file }: { file: File }) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <ImagePreview
        file={file}
        alt={file.name}
        maxWidth={800}
        maxHeight={600}
        className="w-full rounded-lg shadow-lg"
      />
    </div>
  )
}

// Example 7: Grid of thumbnails
export function ThumbnailGridExample({ files }: { files: File[] }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {files.map((file, index) => (
        <ImagePreview
          key={index}
          file={file}
          alt={`Image ${index + 1}`}
          maxWidth={150}
          maxHeight={150}
          className="w-full aspect-square"
        />
      ))}
    </div>
  )
}

// Example 8: With custom styling for different states
export function CustomStyledExample({ file }: { file: File }) {
  return (
    <ImagePreview
      file={file}
      alt={file.name}
      maxWidth={200}
      maxHeight={200}
      className="border-2 border-blue-500 rounded-xl shadow-md hover:shadow-xl transition-shadow"
    />
  )
}
