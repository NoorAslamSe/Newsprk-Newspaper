'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Download, 
  ExternalLink, 
  Copy, 
  Edit, 
  Trash2,
  Image as ImageIcon, 
  Video, 
  Music, 
  File,
  Calendar,
  HardDrive,
  User,
  Tag,
  Folder,
  Eye,
  Info
} from 'lucide-react';
import { MediaItem } from '@/lib/types/media';
import { cn } from '@/lib/utils';

interface MediaPreviewProps {
  media: MediaItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (media: MediaItem) => void;
  onDelete?: (media: MediaItem) => void;
  showActions?: boolean;
}

export function MediaPreview({
  media,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  showActions = true,
}: MediaPreviewProps) {
  const [activeTab, setActiveTab] = useState('preview');

  if (!media) return null;

  const getMediaIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-5 h-5" />;
    if (mimeType.startsWith('video/')) return <Video className="w-5 h-5" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You might want to show a toast notification here
  };

  const MediaPreviewContent = () => {
    // Explicit provider check for rendering as requested
    const renderUrl = media.provider === 'supabase' && media.publicUrl 
      ? media.publicUrl 
      : media.url;

    if (media.mimeType.startsWith('image/')) {
      return (
        <div className="flex items-center justify-center bg-gray-50 rounded-lg p-4">
          <img
            src={renderUrl}
            alt={media.alt || media.filename}
            className="max-w-full max-h-96 object-contain rounded"
          />
        </div>
      );
    }

    if (media.mimeType.startsWith('video/')) {
      return (
        <div className="bg-gray-50 rounded-lg p-4">
          <video
            src={renderUrl}
            controls
            className="w-full max-h-96 rounded"
            poster={media.variants.thumbnail || undefined}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    if (media.mimeType.startsWith('audio/')) {
      return (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <Music className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <audio src={renderUrl} controls className="w-full max-w-md mx-auto">
            Your browser does not support the audio tag.
          </audio>
        </div>
      );
    }

    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        {getMediaIcon(media.mimeType)}
        <p className="mt-4 text-sm text-gray-600">
          Preview not available for this file type
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {media.mimeType}
        </p>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            {getMediaIcon(media.mimeType)}
            <DialogTitle className="truncate">{media.filename}</DialogTitle>
          </div>
          <DialogDescription>
            Media file details and preview
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preview">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="details">
              <Info className="w-4 h-4 mr-2" />
              Details
            </TabsTrigger>
            <TabsTrigger value="usage">
              <ExternalLink className="w-4 h-4 mr-2" />
              Usage
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="flex-1">
            <MediaPreviewContent />
          </TabsContent>

          <TabsContent value="details" className="flex-1">
            <ScrollArea className="h-full">
              <div className="space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">File Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium text-gray-500">Filename</div>
                        <div className="text-sm">{media.filename}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500">File Size</div>
                        <div className="text-sm">{formatFileSize(media.size)}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500">MIME Type</div>
                        <div className="text-sm">{media.mimeType}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500">Format</div>
                        <div className="text-sm">{media.metadata.format || 'Unknown'}</div>
                      </div>
                    </div>

                    {(media.metadata.width || media.metadata.height) && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium text-gray-500">Dimensions</div>
                          <div className="text-sm">
                            {media.metadata.width} × {media.metadata.height} pixels
                          </div>
                        </div>
                        {media.metadata.duration && (
                          <div>
                            <div className="text-sm font-medium text-gray-500">Duration</div>
                            <div className="text-sm">
                              {Math.round(media.metadata.duration)} seconds
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium text-gray-500">Uploaded</div>
                        <div className="text-sm">{formatDate(media.createdAt)}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500">Uploaded By</div>
                        <div className="text-sm">{media.uploadedBy?.name || 'Unknown'}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* URLs */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">URLs</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-1">Original URL</div>
                      <div className="flex items-center space-x-2">
                        <code className="flex-1 text-xs bg-gray-100 p-2 rounded truncate">
                          {media.url}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(media.url)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {media.variants.thumbnail && (
                      <div>
                        <div className="text-sm font-medium text-gray-500 mb-1">Thumbnail URL</div>
                        <div className="flex items-center space-x-2">
                          <code className="flex-1 text-xs bg-gray-100 p-2 rounded truncate">
                            {media.variants.thumbnail}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(media.variants.thumbnail!)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {media.variants.medium && (
                      <div>
                        <div className="text-sm font-medium text-gray-500 mb-1">Medium URL</div>
                        <div className="flex items-center space-x-2">
                          <code className="flex-1 text-xs bg-gray-100 p-2 rounded truncate">
                            {media.variants.medium}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(media.variants.medium!)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Metadata */}
                {(media.alt || media.tags.length > 0 || media.folder) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Metadata</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {media.alt && (
                        <div>
                          <div className="text-sm font-medium text-gray-500">Alt Text</div>
                          <div className="text-sm">{media.alt}</div>
                        </div>
                      )}

                      {media.folder && (
                        <div>
                          <div className="text-sm font-medium text-gray-500">Folder</div>
                          <div className="text-sm flex items-center">
                            <Folder className="w-4 h-4 mr-1" />
                            {media.folder}
                          </div>
                        </div>
                      )}

                      {media.tags.length > 0 && (
                        <div>
                          <div className="text-sm font-medium text-gray-500 mb-2">Tags</div>
                          <div className="flex flex-wrap gap-1">
                            {media.tags.map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                <Tag className="w-3 h-3 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {media.cloudinaryPublicId && (
                        <div>
                          <div className="text-sm font-medium text-gray-500">Cloudinary ID</div>
                          <div className="text-sm font-mono">{media.cloudinaryPublicId}</div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="usage" className="flex-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Usage Information</CardTitle>
                <CardDescription>
                  Where this media file is currently being used
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* This would be populated with actual usage data */}
                <div className="text-center py-8 text-gray-500">
                  <ExternalLink className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Usage tracking not yet implemented</p>
                  <p className="text-sm">This feature will show where this media is used across your site</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex space-x-2">
              <Button variant="outline" asChild>
                <a href={media.provider === 'supabase' && media.publicUrl ? media.publicUrl : media.url} download={media.filename}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href={media.provider === 'supabase' && media.publicUrl ? media.publicUrl : media.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open
                </a>
              </Button>
            </div>
            <div className="flex space-x-2">
              {onEdit && (
                <Button variant="outline" onClick={() => onEdit(media)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button variant="destructive" onClick={() => onDelete(media)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}