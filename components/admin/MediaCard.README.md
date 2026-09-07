# MediaCard Component

A responsive, accessible media card component for displaying media items in a grid layout. Part of the Hybrid Media Upload System.

## Features

- **Thumbnail Display**: Shows image thumbnails with proper aspect ratio and loading states
- **Video Support**: Displays video thumbnails with play icon overlay
- **Metadata Overlay**: Shows file details on hover (name, size, dimensions, upload date)
- **Selection States**: Visual feedback for selected items with customizable selection modes
- **Keyboard Navigation**: Full keyboard accessibility with Tab, Enter, Space, and custom key handlers
- **Theme Aware**: Supports both light and dark modes with consistent styling
- **Touch Friendly**: Responsive design with appropriate touch targets for mobile devices
- **Loading States**: Smooth loading animations and error fallbacks

## Requirements Fulfilled

- **12.2**: Display thumbnail for images ✅
- **12.3**: Display video thumbnail with play icon overlay ✅
- **12.4**: Show file metadata on hover (name, size, type, upload date) ✅
- **19.5**: Use theme-aware hover and selection states ✅
- **27.4**: Make keyboard navigable (Tab, Enter) ✅

## Usage

### Basic Usage

```tsx
import { MediaCard } from "@/components/admin/MediaCard"

<MediaCard 
  media={mediaItem}
  onClick={handleSelect}
  showMetadataOnHover={true}
/>
```

### With Selection

```tsx
<MediaCard 
  media={mediaItem}
  selected={selectedIds.includes(mediaItem._id)}
  selectionMode="multiple"
  onClick={handleSelect}
  onDoubleClick={handleInsert}
/>
```

### With Keyboard Navigation

```tsx
<MediaCard 
  media={mediaItem}
  onKeyDown={(event, media) => {
    if (event.key === 'Delete') {
      handleDelete(media)
    }
  }}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `media` | `MediaItem` | - | **Required.** The media item to display |
| `selected` | `boolean` | `false` | Whether the card is selected |
| `selectionMode` | `'single' \| 'multiple' \| 'none'` | `'none'` | Selection mode for styling |
| `onClick` | `(media: MediaItem) => void` | - | Click handler for card selection |
| `onDoubleClick` | `(media: MediaItem) => void` | - | Double click handler for quick actions |
| `onKeyDown` | `(event: KeyboardEvent, media: MediaItem) => void` | - | Keyboard event handler |
| `className` | `string` | - | Additional CSS classes |
| `disabled` | `boolean` | `false` | Whether the card is disabled |
| `showMetadataOnHover` | `boolean` | `true` | Whether to show metadata overlay on hover |

## MediaItem Interface

The component expects a `MediaItem` object with the following structure:

```typescript
interface MediaItem {
  _id: string
  filename: string
  mimeType: string
  size: number
  url: string
  provider: 'cloudinary' | 'cdn'
  variants: {
    original: string
    thumbnail: string | null
    medium: string | null
  }
  alt: string
  metadata: {
    width?: number
    height?: number
    duration?: number
    format?: string
  }
  tags: string[]
  folder: string
  uploadedBy: {
    _id: string
    name?: string
    email?: string
  } | null
  createdAt: string
  updatedAt: string
  fileType: 'image' | 'video' | 'audio' | 'file'
}
```

## Styling

The component uses Tailwind CSS classes and shadcn/ui components for consistent styling:

- **Card**: Uses `Card` component from shadcn/ui
- **Aspect Ratio**: Maintains square aspect ratio (`aspect-square`)
- **Selection**: Red ring (`ring-red-500`) for selected state
- **Hover**: Scale and shadow effects on hover
- **Focus**: Visible focus ring for keyboard navigation
- **Theme**: Automatic light/dark mode support

## Accessibility

- **ARIA Labels**: Descriptive labels for screen readers
- **Keyboard Navigation**: Full keyboard support
- **Focus Management**: Visible focus indicators
- **Role Attributes**: Proper roles for selection modes
- **Alt Text**: Image alt text support

## Examples

See `MediaCard.example.tsx` for comprehensive usage examples including:

- Different selection modes
- Event handling
- Keyboard navigation
- Grid layouts
- Multiple media types

## Dependencies

- React 18+
- shadcn/ui components (`Card`, `Badge`, `Button`)
- Lucide React icons
- Tailwind CSS
- Media types from `@/lib/types/media`
- Utility functions from `@/lib/utils/metadataFormatter`

## Browser Support

- Modern browsers with CSS Grid support
- Mobile browsers with touch events
- Screen readers and assistive technologies