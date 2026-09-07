# MediaLibraryHeader Component

The `MediaLibraryHeader` component provides the header section for the media library with search functionality, filter tabs, results count display, and storage usage summary.

## Features

- **Real-time search** with debounced input (300ms delay)
- **Filter tabs** for different media types (All, Images, Videos, Ads)
- **Results count display** showing filtered vs total items
- **Storage usage summary** with provider breakdown
- **Responsive layout** that adapts to mobile screens
- **Theme-aware styling** for light/dark modes
- **Loading states** with appropriate indicators
- **Accessibility support** with proper ARIA labels

## Requirements Fulfilled

- **13.1**: Search input field with real-time filtering
- **13.3**: Filter tabs: "All", "Images", "Videos", "Ads"
- **13.5**: Display filtered results count
- **30.5**: Storage usage summary display
- **18.3**: Responsive layout for mobile

## Props

```typescript
interface MediaLibraryHeaderProps {
  /** Current search query */
  searchQuery: string
  /** Search query change handler */
  onSearchChange: (query: string) => void
  /** Current active filter */
  activeFilter: 'all' | 'images' | 'videos' | 'ads'
  /** Filter change handler */
  onFilterChange: (filter: 'all' | 'images' | 'videos' | 'ads') => void
  /** Total count of filtered results */
  filteredCount: number
  /** Total count of all media items */
  totalCount: number
  /** Storage usage statistics */
  storageStats?: StorageStats
  /** Whether data is loading */
  loading?: boolean
  /** Additional CSS classes */
  className?: string
}
```

## Usage

### Basic Usage

```tsx
import { MediaLibraryHeader } from "@/components/admin/MediaLibraryHeader"

function MediaLibrary() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState<'all' | 'images' | 'videos' | 'ads'>('all')
  
  return (
    <MediaLibraryHeader
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      activeFilter={activeFilter}
      onFilterChange={setActiveFilter}
      filteredCount={filteredMedia.length}
      totalCount={allMedia.length}
    />
  )
}
```

### With Storage Stats

```tsx
import { MediaLibraryHeader } from "@/components/admin/MediaLibraryHeader"
import type { StorageStats } from "@/lib/types/media"

function MediaLibrary() {
  const [storageStats, setStorageStats] = useState<StorageStats>()
  
  // Fetch storage stats
  useEffect(() => {
    fetchStorageStats().then(setStorageStats)
  }, [])
  
  return (
    <MediaLibraryHeader
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      activeFilter={activeFilter}
      onFilterChange={setActiveFilter}
      filteredCount={filteredMedia.length}
      totalCount={allMedia.length}
      storageStats={storageStats}
      loading={loading}
    />
  )
}
```

### With State Management

```tsx
import { MediaLibraryHeader } from "@/components/admin/MediaLibraryHeader"
import { useMediaLibrary } from "@/hooks/useMediaLibrary"

function MediaLibrary() {
  const {
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    filteredMedia,
    allMedia,
    storageStats,
    loading
  } = useMediaLibrary()
  
  return (
    <MediaLibraryHeader
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      activeFilter={activeFilter}
      onFilterChange={setActiveFilter}
      filteredCount={filteredMedia.length}
      totalCount={allMedia.length}
      storageStats={storageStats}
      loading={loading}
    />
  )
}
```

## Responsive Behavior

### Desktop (≥640px)
- Search input and storage stats on same row
- Filter tabs and results count on same row
- Provider breakdown shown inline
- Full text labels on filter tabs

### Mobile (<640px)
- Search input and storage stats stacked vertically
- Filter tabs and results count stacked vertically
- Provider breakdown shown below in separate section
- Icon-only labels on filter tabs (with full labels on hover)

## Accessibility

- **Keyboard navigation**: All interactive elements are keyboard accessible
- **Screen readers**: Proper ARIA labels and live regions for dynamic content
- **Focus management**: Clear focus indicators and logical tab order
- **Color contrast**: Meets WCAG AA standards in both light and dark modes

## Styling

The component uses:
- **shadcn/ui components**: Input, Button, Tabs, Badge
- **Tailwind CSS**: For responsive design and theme support
- **CSS custom properties**: For brand color integration (`var(--g-color)`)
- **Theme variables**: Automatic light/dark mode support

## Performance

- **Debounced search**: 300ms delay to prevent excessive API calls
- **Memoized calculations**: Storage stats formatting is memoized
- **Cleanup**: Proper timeout cleanup on unmount
- **Optimized re-renders**: Callbacks are memoized to prevent unnecessary renders

## Integration Points

### Required Dependencies
- `@/components/ui/input`
- `@/components/ui/button`
- `@/components/ui/tabs`
- `@/components/ui/badge`
- `@/lib/utils/metadataFormatter`
- `@/lib/types/media`
- `lucide-react`

### State Management
The component is designed to work with any state management solution:
- React useState (basic)
- Zustand stores
- Redux/RTK
- SWR/React Query
- Custom hooks

### API Integration
Expected to integrate with:
- Media search API endpoints
- Storage analytics API
- Real-time updates via WebSocket or polling

## Testing

The component includes comprehensive test coverage:
- Unit tests for all interactive behaviors
- Integration tests with mock data
- Accessibility tests with screen readers
- Responsive design tests across breakpoints
- Performance tests for debouncing and memoization

## Examples

See `MediaLibraryHeader.example.tsx` for a complete working example with mock data and state management.