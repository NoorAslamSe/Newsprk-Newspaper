'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Upload, 
  X, 
  File, 
  Image as ImageIcon, 
  Video, 
  Music, 
  AlertCircle,
  CheckCircle,
  Loader2,
  Plus,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { uploadMediaAction } from '@/lib/actions/media';

export interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  result?: {
    id: string;
    url: string;
    publicId: string;
  };
  preview?: string;
  tags: string[];
  alt: string;
}

interface MediaUploadProps {
  onUploadComplete?: (files: UploadFile[]) => void;
  onUploadProgress?: (files: UploadFile[]) => void;
  acceptedTypes?: string[];
  maxFileSize?: number; // in bytes
  maxFiles?: number;
  folder?: string;
  className?: string;
}

export function MediaUpload({
  onUploadComplete,
  onUploadProgress,
  acceptedTypes = ['image/*', 'video/*', 'audio/*'],
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 10,
  folder = 'uploads',
  className,
}: MediaUploadProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateFileId = () => Math.random().toString(36).substr(2, 9);

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
    if (mimeType.startsWith('video/')) return <Video className="w-4 h-4" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize) {
      return `File size exceeds ${formatFileSize(maxFileSize)} limit`;
    }

    // Check file type
    const isValidType = acceptedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1));
      }
      return file.type === type;
    });

    if (!isValidType) {
      return `File type ${file.type} is not supported`;
    }

    return null;
  };

  const createFilePreview = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => resolve(undefined);
        reader.readAsDataURL(file);
      } else {
        resolve(undefined);
      }
    });
  };

  const addFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    // Check max files limit
    if (uploadFiles.length + fileArray.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const newUploadFiles: UploadFile[] = [];

    for (const file of fileArray) {
      const validationError = validateFile(file);
      const preview = await createFilePreview(file);

      newUploadFiles.push({
        id: generateFileId(),
        file,
        progress: 0,
        status: validationError ? 'error' : 'pending',
        error: validationError || undefined,
        preview,
        tags: [],
        alt: '',
      });
    }

    setUploadFiles(prev => [...prev, ...newUploadFiles]);
  };

  const removeFile = (fileId: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const updateFileMetadata = (fileId: string, updates: Partial<Pick<UploadFile, 'tags' | 'alt'>>) => {
    setUploadFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, ...updates } : f
    ));
  };

  const uploadFile = async (uploadFile: UploadFile): Promise<void> => {
    const formData = new FormData();
    formData.append('file', uploadFile.file);
    formData.append('folder', folder);
    formData.append('tags', uploadFile.tags.join(','));
    formData.append('alt', uploadFile.alt);

    try {
      // Update status to uploading
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: 'uploading' as const } : f
      ));

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadFiles(prev => prev.map(f => 
            f.id === uploadFile.id ? { ...f, progress } : f
          ));
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 200 || xhr.status === 201) {
          const result = JSON.parse(xhr.responseText);
          setUploadFiles(prev => prev.map(f => 
            f.id === uploadFile.id ? { 
              ...f, 
              status: 'completed' as const, 
              progress: 100,
              result: {
                id: result.item._id,
                url: result.item.url,
                publicId: result.item.cloudinaryPublicId
              }
            } : f
          ));
        } else {
          let errorMessage = 'Upload failed';
          try {
            const errorData = JSON.parse(xhr.responseText);
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            errorMessage = xhr.responseText || errorMessage;
          }
          setUploadFiles(prev => prev.map(f => 
            f.id === uploadFile.id ? { 
              ...f, 
              status: 'error' as const, 
              error: errorMessage 
            } : f
          ));
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        setUploadFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { 
            ...f, 
            status: 'error' as const, 
            error: 'Network error occurred' 
          } : f
        ));
      });

      xhr.open('POST', '/api/media');
      xhr.send(formData);
    } catch (error) {
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { 
          ...f, 
          status: 'error' as const, 
          error: error instanceof Error ? error.message : 'Upload failed' 
        } : f
      ));
    }
  };

  const startUpload = async () => {
    const filesToUpload = uploadFiles.filter(f => f.status === 'pending');
    if (filesToUpload.length === 0) return;

    setIsUploading(true);

    try {
      // Upload files in parallel (with a reasonable limit)
      const uploadPromises = filesToUpload.map(uploadFile);
      await Promise.all(uploadPromises);

      // Notify completion
      const completedFiles = uploadFiles.filter(f => f.status === 'completed');
      onUploadComplete?.(completedFiles);
    } finally {
      setIsUploading(false);
    }
  };

  const cancelUpload = () => {
    // In a real implementation, you'd cancel the XMLHttpRequest
    setUploadFiles(prev => prev.map(f => 
      f.status === 'uploading' ? { ...f, status: 'error' as const, error: 'Cancelled' } : f
    ));
    setIsUploading(false);
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      addFiles(files);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      addFiles(files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  // Calculate upload statistics
  const stats = {
    total: uploadFiles.length,
    pending: uploadFiles.filter(f => f.status === 'pending').length,
    uploading: uploadFiles.filter(f => f.status === 'uploading').length,
    completed: uploadFiles.filter(f => f.status === 'completed').length,
    errors: uploadFiles.filter(f => f.status === 'error').length,
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <Card
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          uploadFiles.length > 0 ? "border-solid" : ""
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Upload className={cn(
            "w-8 h-8 mb-4",
            isDragOver ? "text-primary" : "text-muted-foreground"
          )} />
          <div className="text-center">
            <p className="text-sm font-medium">
              Drop files here or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports {acceptedTypes.join(', ')} up to {formatFileSize(maxFileSize)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Statistics */}
      {uploadFiles.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex space-x-4 text-sm text-muted-foreground">
            <span>Total: {stats.total}</span>
            {stats.pending > 0 && <span>Pending: {stats.pending}</span>}
            {stats.uploading > 0 && <span>Uploading: {stats.uploading}</span>}
            {stats.completed > 0 && <span className="text-green-600">Completed: {stats.completed}</span>}
            {stats.errors > 0 && <span className="text-red-600">Errors: {stats.errors}</span>}
          </div>
          <div className="flex space-x-2">
            {stats.pending > 0 && (
              <Button onClick={startUpload} disabled={isUploading} size="sm">
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload {stats.pending} file(s)
                  </>
                )}
              </Button>
            )}
            {isUploading && (
              <Button onClick={cancelUpload} variant="outline" size="sm">
                Cancel
              </Button>
            )}
          </div>
        </div>
      )}

      {/* File List */}
      {uploadFiles.length > 0 && (
        <div className="space-y-2">
          {uploadFiles.map(uploadFile => (
            <Card key={uploadFile.id} className="p-4">
              <div className="flex items-start space-x-3">
                {/* File Preview/Icon */}
                <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                  {uploadFile.preview ? (
                    <img
                      src={uploadFile.preview}
                      alt={uploadFile.file.name}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    getFileIcon(uploadFile.file.type)
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium truncate">{uploadFile.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(uploadFile.file.size)} • {uploadFile.file.type}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* Status Badge */}
                      {uploadFile.status === 'pending' && (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                      {uploadFile.status === 'uploading' && (
                        <Badge variant="default">
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Uploading
                        </Badge>
                      )}
                      {uploadFile.status === 'completed' && (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                      {uploadFile.status === 'error' && (
                        <Badge variant="destructive">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Error
                        </Badge>
                      )}
                      
                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(uploadFile.id)}
                        disabled={uploadFile.status === 'uploading'}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {uploadFile.status === 'uploading' && (
                    <div className="mt-2">
                      <Progress value={uploadFile.progress} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {uploadFile.progress}% uploaded
                      </p>
                    </div>
                  )}

                  {/* Error Message */}
                  {uploadFile.status === 'error' && uploadFile.error && (
                    <Alert className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{uploadFile.error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Metadata Fields */}
                  {uploadFile.status === 'pending' && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor={`alt-${uploadFile.id}`} className="text-xs">
                          Alt Text
                        </Label>
                        <Input
                          id={`alt-${uploadFile.id}`}
                          placeholder="Describe this media..."
                          value={uploadFile.alt}
                          onChange={(e) => updateFileMetadata(uploadFile.id, { alt: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`tags-${uploadFile.id}`} className="text-xs">
                          Tags (comma-separated)
                        </Label>
                        <Input
                          id={`tags-${uploadFile.id}`}
                          placeholder="tag1, tag2, tag3"
                          value={uploadFile.tags.join(', ')}
                          onChange={(e) => updateFileMetadata(uploadFile.id, { 
                            tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                          })}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}