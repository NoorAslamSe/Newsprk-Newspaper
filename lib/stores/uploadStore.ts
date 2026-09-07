/**
 * Upload Store - Zustand State Management for Hybrid Media Upload System
 * 
 * Manages the upload queue, provider selection, and upload status with localStorage persistence.
 * Supports batch uploads, retry logic, and upload cancellation.
 * 
 * Requirements: 21.1, 21.2, 20.1, 20.2, 22.1, 22.2
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UploadFile, UploadProvider } from '@/lib/types/upload';

/**
 * UploadStore interface defining state and actions
 */
export interface UploadStore {
  // State
  files: UploadFile[];
  provider: UploadProvider;
  isUploading: boolean;
  
  // Actions
  addFiles: (files: File[]) => void;
  removeFile: (fileId: string) => void;
  updateFile: (fileId: string, updates: Partial<UploadFile>) => void;
  setProvider: (provider: UploadProvider) => void;
  startUpload: () => void;
  cancelUpload: (fileId: string) => void;
  retryUpload: (fileId: string) => void;
  clearCompleted: () => void;
  clearAll: () => void;
}

/**
 * Generate unique ID for upload files
 */
function generateFileId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create preview URL for file
 */
function createPreviewUrl(file: File): string | undefined {
  if (file.type.startsWith('image/')) {
    // Check if URL.createObjectURL is available (not available in some test environments)
    if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      return URL.createObjectURL(file);
    }
  }
  return undefined;
}

/**
 * Determine folder based on file type
 */
function determineFolder(file: File): string {
  if (file.type.startsWith('image/')) {
    return 'images';
  }
  if (file.type.startsWith('video/')) {
    return 'videos';
  }
  return 'uploads';
}

/**
 * Upload Store with Zustand and localStorage persistence
 */
export const useUploadStore = create<UploadStore>()(
  persist(
    (set, get) => ({
      // Initial state
      files: [],
      provider: 'cdn',
      isUploading: false,

      // Add files to upload queue
      addFiles: (newFiles: File[]) => {
        const uploadFiles: UploadFile[] = newFiles.map((file) => ({
          id: generateFileId(),
          file,
          provider: get().provider,
          progress: 0,
          status: 'pending',
          preview: createPreviewUrl(file),
          tags: [],
          alt: '',
          folder: determineFolder(file),
          retryCount: 0,
          maxRetries: 3,
        }));

        set((state) => ({
          files: [...state.files, ...uploadFiles],
        }));
      },

      // Remove file from queue
      removeFile: (fileId: string) => {
        set((state) => {
          const file = state.files.find((f) => f.id === fileId);
          
          // Clean up preview URL if it exists
          if (file?.preview && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
            URL.revokeObjectURL(file.preview);
          }

          return {
            files: state.files.filter((f) => f.id !== fileId),
          };
        });
      },

      // Update file properties
      updateFile: (fileId: string, updates: Partial<UploadFile>) => {
        set((state) => ({
          files: state.files.map((file) =>
            file.id === fileId ? { ...file, ...updates } : file
          ),
        }));
      },

      // Set upload provider
      setProvider: (provider: UploadProvider) => {
        set((state) => ({
          provider,
          // Update provider for all pending files
          files: state.files.map((file) =>
            file.status === 'pending' ? { ...file, provider } : file
          ),
        }));
      },

      // Start upload process
      startUpload: () => {
        set({ isUploading: true });
      },

      // Cancel upload
      cancelUpload: (fileId: string) => {
        get().updateFile(fileId, {
          status: 'cancelled',
          progress: 0,
        });
        
        // Check if all uploads are complete/cancelled
        const { files } = get();
        const hasActiveUploads = files.some(
          (f) => f.status === 'uploading' || f.status === 'pending'
        );
        
        if (!hasActiveUploads) {
          set({ isUploading: false });
        }
      },

      // Retry failed upload
      retryUpload: (fileId: string) => {
        set((state) => {
          const file = state.files.find((f) => f.id === fileId);
          
          if (!file || file.retryCount >= file.maxRetries) {
            return state;
          }

          return {
            files: state.files.map((f) =>
              f.id === fileId
                ? {
                    ...f,
                    status: 'pending' as const,
                    progress: 0,
                    error: undefined,
                    retryCount: f.retryCount + 1,
                  }
                : f
            ),
          };
        });
      },

      // Clear completed uploads
      clearCompleted: () => {
        set((state) => {
          // Clean up preview URLs for completed files
          if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
            state.files
              .filter((f) => f.status === 'success' || f.status === 'error')
              .forEach((file) => {
                if (file.preview) {
                  URL.revokeObjectURL(file.preview);
                }
              });
          }

          return {
            files: state.files.filter(
              (f) => f.status !== 'success' && f.status !== 'error'
            ),
          };
        });
      },

      // Clear all files from queue
      clearAll: () => {
        set((state) => {
          // Clean up all preview URLs
          if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
            state.files.forEach((file) => {
              if (file.preview) {
                URL.revokeObjectURL(file.preview);
              }
            });
          }

          return {
            files: [],
            isUploading: false,
          };
        });
      },
    }),
    {
      name: 'upload-store',
      version: 1, // Bumped to 1 to flush outdated/invalid File blobs
      // Persist configuration
      partialize: (state) => ({
        // Only persist pending and completed files, not in-progress uploads
        files: state.files.filter(
          (f) => f.status === 'pending' || f.status === 'success' || f.status === 'error'
        ),
        provider: state.provider,
        // Don't persist isUploading state
      }),
    }
  )
);
