/**
 * Example Usage of PreUploadEditor Component
 * 
 * This file demonstrates how to integrate the PreUploadEditor
 * into your upload workflow.
 */

"use client"

import * as React from "react"
import { PreUploadEditor } from "./PreUploadEditor"
import { Button } from "@/components/ui/button"
import { UploadFile } from "@/lib/types/upload"

export function PreUploadEditorExample() {
  const [isEditorOpen, setIsEditorOpen] = React.useState(false)
  const [uploadFile, setUploadFile] = React.useState<UploadFile | null>(null)

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Create an UploadFile object
    const newUploadFile: UploadFile = {
      id: crypto.randomUUID(),
      file,
      provider: "cdn",
      progress: 0,
      status: "pending",
      tags: [],
      alt: "",
      folder: "uploads",
      retryCount: 0,
      maxRetries: 3,
    }

    setUploadFile(newUploadFile)
    setIsEditorOpen(true)
  }

  // Handle save from editor
  const handleSave = (editedFile: UploadFile) => {
    console.log("File edited and ready to upload:", editedFile)
    // Here you would typically:
    // 1. Update your upload queue with the edited file
    // 2. Start the upload process
    // 3. Show upload progress
    
    // Example:
    // uploadStore.updateFile(editedFile.id, editedFile)
    // uploadStore.startUpload()
  }

  // Handle skip editing
  const handleSkip = () => {
    if (uploadFile) {
      console.log("Skipping editing, uploading original file:", uploadFile)
      // Upload the original file without edits
      // uploadStore.startUpload()
    }
  }

  return (
    <div className="space-y-4 p-8">
      <h2 className="text-2xl font-bold">PreUploadEditor Example</h2>
      
      <div className="space-y-2">
        <p className="text-muted-foreground">
          Select an image, video, or ad file to see the editor in action.
        </p>
        
        <input
          type="file"
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-red-50 file:text-red-700
            hover:file:bg-red-100
            dark:file:bg-red-950 dark:file:text-red-300
            dark:hover:file:bg-red-900"
        />
      </div>

      {uploadFile && (
        <PreUploadEditor
          uploadFile={uploadFile}
          open={isEditorOpen}
          onOpenChange={setIsEditorOpen}
          onSave={handleSave}
          onSkip={handleSkip}
        />
      )}

      <div className="mt-8 p-4 border rounded-md bg-blue-50 dark:bg-blue-950/20">
        <h3 className="font-semibold mb-2">How it works:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Select a file using the file input above</li>
          <li>The PreUploadEditor modal will open automatically</li>
          <li>Based on the file type, you'll see:
            <ul className="list-disc list-inside ml-6 mt-1">
              <li><strong>Images:</strong> Crop and resize controls</li>
              <li><strong>Videos:</strong> Trim, playback controls, and thumbnail selection</li>
              <li><strong>Ads:</strong> VAST tag input and ad timing selection</li>
            </ul>
          </li>
          <li>Click "Apply Changes" to save edits or "Skip Editing" to use the original file</li>
          <li>The edited file is returned via the onSave callback</li>
        </ol>
      </div>

      <div className="mt-4 p-4 border rounded-md bg-yellow-50 dark:bg-yellow-950/20">
        <h3 className="font-semibold mb-2">Integration Tips:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Use with your upload store (Zustand) to manage file state</li>
          <li>Show the editor after file selection but before upload</li>
          <li>The editor automatically detects file type and shows the appropriate controls</li>
          <li>Files with "ad", "advertisement", or "vast" in the name are treated as ads</li>
          <li>All buttons meet the 44x44px minimum touch target size for mobile</li>
          <li>The dialog is fully responsive and supports dark mode</li>
        </ul>
      </div>
    </div>
  )
}
