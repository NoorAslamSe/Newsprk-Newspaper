"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

interface VideoEditorProps {
  /** The File object to edit */
  file: File
  /** Callback when edits are applied */
  onSave: (editedFile: File, edits: VideoEdits) => void
  /** Callback when editing is cancelled */
  onCancel: () => void
  /** Additional CSS classes */
  className?: string
}

interface VideoEdits {
  trim?: { start: number; end: number }
  videoControls?: { autoplay: boolean; mute: boolean; loop: boolean }
  thumbnailTime?: number
}

/**
 * VideoEditor Component
 * 
 * Provides video configuration and editing functionality before upload.
 * 
 * Features:
 * - Trim controls with start and end time inputs
 * - Playback control toggles (autoplay, mute, loop)
 * - Thumbnail frame selection slider
 * - Video preview with current settings
 * - Client-side processing
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4
 * 
 * @example
 * ```tsx
 * <VideoEditor 
 *   file={videoFile}
 *   onSave={(editedFile, edits) => handleUpload(editedFile, edits)}
 *   onCancel={() => setShowEditor(false)}
 * />
 * ```
 */
export function VideoEditor({
  file,
  onSave,
  onCancel,
  className,
}: VideoEditorProps) {
  const [videoSrc, setVideoSrc] = React.useState<string>("")
  const [duration, setDuration] = React.useState<number>(0)
  const [currentTime, setCurrentTime] = React.useState<number>(0)
  
  // Trim controls
  const [trimStart, setTrimStart] = React.useState<string>("")
  const [trimEnd, setTrimEnd] = React.useState<string>("")
  
  // Playback controls
  const [autoplay, setAutoplay] = React.useState(false)
  const [mute, setMute] = React.useState(false)
  const [loop, setLoop] = React.useState(false)
  
  // Thumbnail selection
  const [thumbnailTime, setThumbnailTime] = React.useState<number>(0)
  
  const [isProcessing, setIsProcessing] = React.useState(false)
  
  const videoRef = React.useRef<HTMLVideoElement>(null)

  // Load video from file
  React.useEffect(() => {
    const url = URL.createObjectURL(file)
    setVideoSrc(url)

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [file])

  // Handle video metadata loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const videoDuration = videoRef.current.duration
      setDuration(videoDuration)
      // Set default thumbnail to middle of video
      setThumbnailTime(videoDuration / 2)
    }
  }

  // Handle time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Parse time string (MM:SS or seconds) to seconds
  const parseTime = (timeStr: string): number => {
    if (!timeStr) return 0
    
    if (timeStr.includes(":")) {
      const [mins, secs] = timeStr.split(":").map(Number)
      return (mins || 0) * 60 + (secs || 0)
    }
    
    return parseFloat(timeStr) || 0
  }

  // Handle thumbnail slider change
  const handleThumbnailSliderChange = (value: number[]) => {
    const time = value[0]
    setThumbnailTime(time)
    if (videoRef.current) {
      videoRef.current.currentTime = time
    }
  }

  // Handle save button click
  const handleSave = async () => {
    setIsProcessing(true)
    try {
      const edits: VideoEdits = {
        videoControls: {
          autoplay,
          mute,
          loop,
        },
        thumbnailTime,
      }

      // Add trim settings if specified
      const startTime = parseTime(trimStart)
      const endTime = parseTime(trimEnd)
      
      if (startTime > 0 || (endTime > 0 && endTime < duration)) {
        edits.trim = {
          start: startTime,
          end: endTime > 0 ? endTime : duration,
        }
      }

      // For now, we pass the original file with edits metadata
      // Actual video trimming would require ffmpeg.wasm or server-side processing
      onSave(file, edits)
    } catch (error) {
      console.error("Error processing video:", error)
      alert("Failed to process video. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Video Preview */}
      <div className="space-y-2">
        <Label>Video Preview</Label>
        <div className="border rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800">
          {videoSrc && (
            <video
              ref={videoRef}
              src={videoSrc}
              className="w-full h-auto"
              style={{ maxHeight: "400px" }}
              controls
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              autoPlay={autoplay}
              muted={mute}
              loop={loop}
            />
          )}
        </div>
        {duration > 0 && (
          <p className="text-sm text-muted-foreground">
            Duration: {formatTime(duration)} | Current: {formatTime(currentTime)}
          </p>
        )}
      </div>

      {/* Trim Controls */}
      <div className="space-y-4 p-4 border rounded-md">
        <h3 className="font-medium">Trim Video</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="trim-start">Start Time (MM:SS or seconds)</Label>
            <Input
              id="trim-start"
              type="text"
              placeholder="00:00"
              value={trimStart}
              onChange={(e) => setTrimStart(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="trim-end">End Time (MM:SS or seconds)</Label>
            <Input
              id="trim-end"
              type="text"
              placeholder={formatTime(duration)}
              value={trimEnd}
              onChange={(e) => setTrimEnd(e.target.value)}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Leave empty to use full video duration
        </p>
      </div>

      {/* Playback Controls */}
      <div className="space-y-4 p-4 border rounded-md">
        <h3 className="font-medium">Playback Controls</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="autoplay" className="cursor-pointer">
              Autoplay
            </Label>
            <Switch
              id="autoplay"
              checked={autoplay}
              onCheckedChange={setAutoplay}
              className="data-[state=checked]:bg-red-600"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="mute" className="cursor-pointer">
              Mute
            </Label>
            <Switch
              id="mute"
              checked={mute}
              onCheckedChange={setMute}
              className="data-[state=checked]:bg-red-600"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="loop" className="cursor-pointer">
              Loop
            </Label>
            <Switch
              id="loop"
              checked={loop}
              onCheckedChange={setLoop}
              className="data-[state=checked]:bg-red-600"
            />
          </div>
        </div>
      </div>

      {/* Thumbnail Frame Selection */}
      <div className="space-y-4 p-4 border rounded-md">
        <h3 className="font-medium">Thumbnail Frame</h3>
        <div className="space-y-2">
          <Label htmlFor="thumbnail-slider">
            Select frame for thumbnail: {formatTime(thumbnailTime)}
          </Label>
          <Slider
            id="thumbnail-slider"
            min={0}
            max={duration}
            step={0.1}
            value={[thumbnailTime]}
            onValueChange={handleThumbnailSliderChange}
            className="w-full"
            disabled={duration === 0}
          />
          <p className="text-xs text-muted-foreground">
            Drag the slider to select a frame for the video thumbnail
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          className="min-h-[44px]"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={isProcessing}
          className="bg-red-600 hover:bg-red-700 text-white min-h-[44px]"
        >
          {isProcessing ? "Processing..." : "Apply Settings"}
        </Button>
      </div>
    </div>
  )
}
