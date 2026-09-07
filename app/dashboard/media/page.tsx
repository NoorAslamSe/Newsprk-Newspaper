"use client";

import * as React from "react";
import { MediaLibraryGrid } from "@/components/admin/MediaLibraryGrid";
import { MediaUploadDialog } from "@/components/admin/MediaUploadDialog";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

export default function MediaPage() {
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const handleUploadComplete = () => {
    // This forces MediaLibraryGrid to remount and refetch API data
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-6 pt-6 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
          <p className="text-muted-foreground mt-1">
            Manage your images, videos, and ad creatives.
          </p>
        </div>
        <Button onClick={() => setIsUploadOpen(true)} className="w-full sm:w-auto mt-4 sm:mt-0 bg-red-600 hover:bg-red-700">
          <Upload className="mr-2 h-4 w-4" />
          Upload New File
        </Button>
      </div>

      <div className="flex-1 overflow-hidden px-6 pb-6">
        <MediaLibraryGrid 
          key={refreshKey}
          selectionMode="multiple" 
        />
      </div>

      <MediaUploadDialog 
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  );
}
