# MediaUploadDialog Component

A modern, accessible drag-and-drop media upload dialog component built with react-dropzone and shadcn/ui.

## Features

- ✅ **Drag-and-Drop Upload**: Intuitive file upload with visual feedback
- ✅ **Multiple File Selection**: Upload multiple files at once
- ✅ **File Validation**: Client-side validation with user-friendly error messages
- ✅ **Provider Recommendation**: Automatic provider selection based on file type
- ✅ **Keyboard Accessible**: Full keyboard navigation support (Enter/Space)
- ✅ **Touch-Friendly**: Minimum 44x44px touch targets for mobile
- ✅ **Dark Mode Support**: Seamless theme integration
- ✅ **Responsive Design**: Works on all screen sizes
- ✅ **Visual Feedback**: Clear drag-over states and file type indicators

## Requirements Implemented

- **5.1**: Uses react-dropzone library for drag-and-drop functionality
- **5.2**: Displays visual highlight on drag-over
- **5.3**: Supports multiple file selection
- **5.4**: Displays accepted file types
- **5.5**: Shows size limits in the UI
- **21.1**: Supports batch file selection
- **27.1**: Keyboard accessible with Enter/Space
- **18.2**: Touch-friendly targets on mobile (44x44px minimum)

## Installation

The component requires the following dependencies:

```bash
npm install react-dropzone
```

## Usage

### Basic Usage

```tsx
import { MediaUploadDialog } from "@/components/admin/MediaUploadDialog"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function MyComponent() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        Upload Media
      </Button>

      <MediaUploadDialog
        open={open}
        onOpenChange={setOpen}
        onUploadComplete={() => {
          console.log("Upload completed!")
          setOpen(false)
        }}
      />
    </>
  )
}
```

### With Default Provider

```tsx
<MediaUploadDialog
  open={open}
  onOpenChange={setOpen}
  defaultProvider="cdn"
  onUploadComplete={handleUploadComplete}
/>
```

### Integration with Media Library

```tsx
export function MediaLibrary() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleUploadComplete = () => {
    // Trigger media library refresh
    setRefreshKey((prev) => prev + 1)
    setUploadDialogOpen(false)
  }

  return (
    <div>
      <Button onClick={() => setUploadDialogOpen(true)}>
        Upload New File
      </Button>

      <MediaLibraryGrid key={refreshKey} />

      <MediaUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  )
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | - | Whether the dialog is open (required) |
| `onOpenChange` | `(open: boolean) => void` | - | Callback when dialog state changes (required) |
| `onUploadComplete` | `() => void` | - | Callback when upload completes successfully |
| `defaultProvider` | `"cloudinary" \| "cdn"` | `"cloudinary"` | Default upload provider |
| `defaultFolder` | `string` | - | Default folder for uploads |

## Accepted File Types

### Images
- JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`)
- GIF (`.gif`)
- WebP (`.webp`)

### Videos
- MP4 (`.mp4`)
- WebM (`.webm`)

## File Size Limits

- **Cloudinary**: 25MB maximum
- **CDN (S3/R2)**: 500MB maximum

Files are automatically validated against these limits based on the selected provider.

## Provider Recommendation

The component automatically recommends the best provider based on file characteristics:

- **Images** → Cloudinary (default)
- **Videos** → CDN (default)
- **Files > 10MB** → CDN (regardless of type)

Users can manually override the recommendation if needed.

## Accessibility

The component is fully accessible and follows WCAG 2.1 guidelines:

- **Keyboard Navigation**: Use Tab to focus, Enter/Space to open file dialog
- **ARIA Labels**: All interactive elements have proper ARIA labels
- **Screen Reader Support**: Announces drag-over states and file selection
- **Focus Management**: Proper focus indicators and keyboard traps

### Keyboard Shortcuts

- `Tab`: Navigate to dropzone
- `Enter` or `Space`: Open file selection dialog
- `Escape`: Close dialog

## Visual States

The dropzone provides clear visual feedback:

1. **Default State**: Gray border with upload icon
2. **Hover State**: Red border with lighter background
3. **Drag Active**: Red border with highlighted background
4. **Drag Accept**: Green-tinted background (valid files)
5. **Drag Reject**: Red-tinted background (invalid files)

## Mobile Support

The component is optimized for mobile devices:

- **Touch-Friendly**: All interactive elements meet 44x44px minimum
- **Responsive Layout**: Adapts to small screens
- **Touch Gestures**: Supports drag-and-drop on touch devices
- **Mobile-First**: Designed with mobile users in mind

## Dark Mode

The component automatically adapts to the current theme:

- Uses shadcn/ui theme variables
- Proper contrast in both light and dark modes
- Smooth theme transitions

## Integration with Upload Store

The component integrates with the Zustand upload store:

```tsx
import { useUploadStore } from "@/lib/stores/uploadStore"

// The component automatically:
// - Adds files to the upload queue
// - Sets the selected provider
// - Validates files before adding
// - Shows toast notifications
```

## File Validation

Files are validated on selection:

1. **MIME Type Check**: Only allowed file types are accepted
2. **Size Check**: Files must be within provider limits
3. **Provider Check**: Validates against selected provider constraints

Invalid files trigger error toast notifications with descriptive messages.

## Toast Notifications

The component uses sonner for notifications:

- **Success**: "X files added to upload queue"
- **Error**: "filename: error message"
- **Warning**: Displayed for invalid file types or sizes

## Testing

The component includes comprehensive unit tests:

```bash
npm test -- MediaUploadDialog.test.tsx
```

Test coverage includes:
- Rendering in different states
- Accessibility features
- Keyboard navigation
- Touch-friendly targets
- Provider selection
- Visual feedback
- Multiple file support
- Dialog behavior

## Examples

See `MediaUploadDialog.example.tsx` for complete usage examples:

- Basic usage
- With default provider
- With callbacks
- Integration with media library

## Related Components

- `PreUploadEditor`: Edit files before upload
- `UploadProgressTracker`: Track upload progress
- `MediaLibraryGrid`: Browse uploaded media
- `ProviderSelector`: Select upload provider

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- Lazy loads file previews
- Validates files client-side
- Minimal re-renders with React.useCallback
- Efficient drag-and-drop handling

## Troubleshooting

### Files not being added to queue

Check that:
1. Files are within size limits
2. File types are supported
3. Upload store is properly initialized

### Drag-and-drop not working

Ensure:
1. Browser supports drag-and-drop API
2. No conflicting event handlers
3. Proper z-index for dropzone

### Toast notifications not showing

Verify:
1. Toaster component is mounted in layout
2. sonner is properly installed
3. No CSS conflicts with toast positioning

## License

Part of the Trendsposts Hybrid Media Upload System.
