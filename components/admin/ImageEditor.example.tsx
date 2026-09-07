"use client"

import * as React from "react"
import { ImageEditor } from "./ImageEditor"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

/**
 * ImageEditor Example
 * 
 * This example demonstrates how to use the ImageEditor component
 * to crop and resize images before uploading.
 */
export function ImageEditorExample() {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [editedFile, setEditedFile] = React.useState<File | null>(null)
  const [isEditorOpen, setIsEditorOpen] = React.useState(false)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file)
      setIsEditorOpen(true)
    }
  }

  const handleSave = (file: File) => {
    setEditedFile(file)
    setIsEditorOpen(false)
    console.log('Edited file:', file)
    // Here you would typically upload the file
  }

  const handleCancel = () => {
    setIsEditorOpen(false)
  }

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">ImageEditor Example</h1>
      
      <div className="space-y-2">
        <label htmlFor="file-input" className="block text-sm font-medium">
          Select an image to edit:
        </label>
        <input
          id="file-input"
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-red-50 file:text-red-700
            hover:file:bg-red-100"
        />
      </div>

      {editedFile && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Edited Image Preview:</h2>
          <img
            src={URL.createObjectURL(editedFile)}
            alt="Edited preview"
            className="max-w-md border rounded-md"
          />
          <p className="text-sm text-gray-600">
            File size: {(editedFile.size / 1024).toFixed(2)} KB
          </p>
        </div>
      )}

      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Image</DialogTitle>
          </DialogHeader>
          {selectedFile && (
            <ImageEditor
              file={selectedFile}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
