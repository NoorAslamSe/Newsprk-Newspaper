'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  Grid3X3, 
  List, 
  Image as ImageIcon, 
  Video, 
  Music, 
  File,
  Eye,
  Download,
  Calendar,
  HardDrive,
  Tag,
  X,
  Upload,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { downloadFile } from '@/lib/utils/download';
import { syncMediaFolderAction } from '@/lib/actions/mediaDiscovery';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { MediaItem } from '@/lib/types/media';
export type { MediaItem };

interface MediaSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMediaSelect: (media: MediaItem | MediaItem[]) => void;
  filterType?: 'image' | 'video' | 'audio' | 'ads' | 'all';
  multiSelect?: boolean;
  title?: string;
  description?: string;
}

export function MediaSelectionModal({
  isOpen,
  onClose,
  onMediaSelect,
  filterType = 'all',
  multiSelect = false,
  title = 'Select Media',
  description = 'Choose media files from your library',
}: MediaSelectionModalProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentFilter, setCurrentFilter] = useState(filterType);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load media from API
  const loadMedia = async (reset = false) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: reset ? '1' : page.toString(),
        limit: '20',
        ...(currentFilter !== 'all' && { type: currentFilter }),
        ...(searchQuery && { q: searchQuery }),
      });

      const response = await fetch(`/api/media?${params}`, {
        cache: 'no-store', // Ensure fresh data
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (reset) {
        setMedia(data.items || []);
        setPage(1);
      } else {
        setMedia(prev => [...prev, ...(data.items || [])]);
      }
      
      // Fix pagination check - use the correct structure
      const hasMoreItems = data.total ? (page * 20) < data.total : false;
      setHasMore(hasMoreItems);
    } catch (error) {
      console.error('Error loading media:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAds = async () => {
    setIsSyncing(true);
    try {
      const result = await syncMediaFolderAction('ads');
      if (result.success) {
        toast.success(result.message);
        loadMedia(true);
      } else {
        toast.error(result.error || "Sync failed");
      }
    } catch (error) {
      toast.error("An error occurred during sync");
    } finally {
      setIsSyncing(false);
    }
  };

  // Load media on mount and when filters change
  useEffect(() => {
    if (isOpen) {
      setSelectedItems([]); // Clear selection when modal opens
      loadMedia(true);
    }
  }, [isOpen, currentFilter, searchQuery]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isOpen) {
        loadMedia(true);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleItemSelect = (item: MediaItem) => {
    if (multiSelect) {
      const newSelection = selectedItems.includes(item._id)
        ? selectedItems.filter(id => id !== item._id)
        : [...selectedItems, item._id];
      setSelectedItems(newSelection);
    } else {
      onMediaSelect(item);
      onClose();
    }
  };

  const handleMultiSelectConfirm = () => {
    const selectedMedia = media.filter(item => selectedItems.includes(item._id));
    onMediaSelect(selectedMedia);
    onClose();
  };

  const getMediaIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
    if (mimeType.startsWith('video/')) return <Video className="w-4 h-4" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-4 h-4" />;
    return <Upload className="w-4 h-4" />; // Ad icon
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const MediaGridItem = ({ item }: { item: MediaItem }) => (
    <div
      className={cn(
        "relative group cursor-pointer border-2 rounded-lg overflow-hidden transition-all hover:shadow-md",
        selectedItems.includes(item._id) ? "border-primary ring-2 ring-primary/20" : "border-border"
      )}
      onClick={() => handleItemSelect(item)}
    >
      {/* Media Preview */}
      <div className="aspect-square bg-gray-100 flex items-center justify-center">
        {item.mimeType.startsWith('image/') ? (
          <img
            src={item.variants.thumbnail || item.url}
            alt={item.alt || item.filename}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400">
            {getMediaIcon(item.mimeType)}
            <span className="text-xs mt-1">{item.metadata.format?.toUpperCase()}</span>
          </div>
        )}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors">
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              setPreviewItem(item);
            }}
          >
            <Eye className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Selection indicator */}
      {multiSelect && (
        <div className="absolute top-2 left-2">
          <Checkbox
            checked={selectedItems.includes(item._id)}
            onChange={() => {}}
            className="bg-white"
          />
        </div>
      )}

      {/* Info */}
      <div className="p-2">
        <div className="text-xs font-medium truncate">{item.filename}</div>
        <div className="text-xs text-muted-foreground">
          {formatFileSize(item.size)}
        </div>
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {item.tags.slice(0, 2).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
                {tag}
              </Badge>
            ))}
            {item.tags.length > 2 && (
              <Badge variant="secondary" className="text-xs px-1 py-0">
                +{item.tags.length - 2}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const MediaListItem = ({ item }: { item: MediaItem }) => (
    <div
      className={cn(
        "flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-all hover:shadow-sm",
        selectedItems.includes(item._id) ? "border-primary bg-primary/5" : "border-border"
      )}
      onClick={() => handleItemSelect(item)}
    >
      {multiSelect && (
        <Checkbox
          checked={selectedItems.includes(item._id)}
          onChange={() => {}}
        />
      )}
      
      <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
        {item.mimeType.startsWith('image/') ? (
          <img
            src={item.variants.thumbnail || item.url}
            alt={item.alt || item.filename}
            className="w-full h-full object-cover rounded"
            loading="lazy"
          />
        ) : (
          getMediaIcon(item.mimeType)
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{item.filename}</div>
        <div className="text-sm text-muted-foreground">
          {formatFileSize(item.size)} • {formatDate(item.createdAt)}
        </div>
        {item.metadata.width && item.metadata.height && (
          <div className="text-xs text-muted-foreground">
            {item.metadata.width} × {item.metadata.height}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        {item.tags.length > 0 && (
          <div className="flex space-x-1">
            {item.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            setPreviewItem(item);
          }}
        >
          <Eye className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="flex-1 flex flex-col space-y-4">
            {/* Controls */}
            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-2 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search media..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Tabs value={currentFilter} onValueChange={(value) => setCurrentFilter(value as any)}>
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="image">Images</TabsTrigger>
                    <TabsTrigger value="video">Videos</TabsTrigger>
                    <TabsTrigger value="audio">Audio</TabsTrigger>
                    <TabsTrigger value="ads" className="bg-red-50 dark:bg-red-950/20 data-[state=active]:bg-red-500 data-[state=active]:text-white">Ads</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Media Grid/List */}
            <ScrollArea className="flex-1">
              {loading && media.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="ml-2">Loading media...</span>
                </div>
              ) : media.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No media files found</p>
                  <p className="text-sm">Try adjusting your search or upload some files</p>
                </div>
              ) : (
                <div className={cn(
                  viewMode === 'grid' 
                    ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4" 
                    : "space-y-2"
                )}>
                  {media.map(item => 
                    viewMode === 'grid' ? (
                      <MediaGridItem key={item._id} item={item} />
                    ) : (
                      <MediaListItem key={item._id} item={item} />
                    )
                  )}
                </div>
              )}

              {/* Load More */}
              {hasMore && media.length > 0 && (
                <div className="text-center py-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPage(prev => prev + 1);
                      loadMedia();
                    }}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load More'
                    )}
                  </Button>
                </div>
              )}
            </ScrollArea>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {selectedItems.length > 0 && multiSelect && (
                  <span>{selectedItems.length} item(s) selected</span>
                )}
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                {multiSelect && selectedItems.length > 0 && (
                  <Button onClick={handleMultiSelectConfirm}>
                    Select {selectedItems.length} item(s)
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      {previewItem && (
        <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{previewItem.filename}</DialogTitle>
              <DialogDescription>Media file details and preview</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Preview */}
              <div className="space-y-4">
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  {previewItem.mimeType.startsWith('image/') ? (
                    <img
                      src={previewItem.url}
                      alt={previewItem.alt || previewItem.filename}
                      className="max-w-full max-h-full object-contain rounded-lg"
                    />
                  ) : previewItem.mimeType.startsWith('video/') ? (
                    <video
                      src={previewItem.url}
                      controls
                      className="max-w-full max-h-full rounded-lg"
                    />
                  ) : previewItem.mimeType.startsWith('audio/') ? (
                    <audio src={previewItem.url} controls className="w-full" />
                  ) : (
                    <div className="text-center">
                      {getMediaIcon(previewItem.mimeType)}
                      <p className="mt-2 text-sm text-muted-foreground">
                        Preview not available
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-muted-foreground">File Size</div>
                    <div>{formatFileSize(previewItem.size)}</div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground">Type</div>
                    <div>{previewItem.mimeType}</div>
                  </div>
                  {previewItem.metadata.width && previewItem.metadata.height && (
                    <>
                      <div>
                        <div className="font-medium text-muted-foreground">Dimensions</div>
                        <div>{previewItem.metadata.width} × {previewItem.metadata.height}</div>
                      </div>
                    </>
                  )}
                  <div>
                    <div className="font-medium text-muted-foreground">Uploaded</div>
                    <div>{formatDate(previewItem.createdAt)}</div>
                  </div>
                </div>

                {previewItem.tags.length > 0 && (
                  <div>
                    <div className="font-medium text-muted-foreground mb-2">Tags</div>
                    <div className="flex flex-wrap gap-1">
                      {previewItem.tags.map(tag => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex space-x-2 pt-4">
                  <Button
                    onClick={() => {
                      onMediaSelect(previewItem);
                      setPreviewItem(null);
                      onClose();
                    }}
                  >
                    Select This File
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => downloadFile(previewItem.url, previewItem.filename)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}