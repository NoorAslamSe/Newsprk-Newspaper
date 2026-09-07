"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MoreVertical, Copy, Trash, PlusCircle, ExternalLink } from "lucide-react"
import type { MediaItem } from "@/lib/types/media"
import { toast } from "sonner"

interface MediaActionMenuProps {
  media: MediaItem | null
  onInsert?: (media: MediaItem) => void
  onDelete?: (mediaId: string) => Promise<void>
  disabled?: boolean
}

export function MediaActionMenu({
  media,
  onInsert,
  onDelete,
  disabled = false,
}: MediaActionMenuProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  if (!media) return null

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(media.url)
      toast.success("URL copied to clipboard")
    } catch (error) {
      toast.error("Failed to copy URL")
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    setIsDeleting(true)
    try {
      await onDelete(media._id)
      setIsDeleteDialogOpen(false)
      toast.success("Media deleted successfully")
    } catch (error) {
      toast.error("Failed to delete media")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={disabled} className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {onInsert && (
            <DropdownMenuItem onClick={() => onInsert(media)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              <span>Insert</span>
            </DropdownMenuItem>
          )}

          <DropdownMenuItem onClick={handleCopyUrl}>
            <Copy className="mr-2 h-4 w-4" />
            <span>Copy URL</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild>
            <a href={media.url} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
              <ExternalLink className="mr-2 h-4 w-4" />
              <span>Open in new tab</span>
            </a>
          </DropdownMenuItem>

          {onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600 focus:text-red-600"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected media item
              from the system and from the remote storage provider.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
