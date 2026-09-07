"use client";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { useRef, useEffect } from "react";

interface Props {
    id: string;
    title?: string;
    src?: string; // Video URL
}

export default function MediaPlayerStub({ id, title = "Watch Video", src }: Props) {
    const { playing, play, pause } = usePlayerStore();
    const isPlaying = playing === id;
    const videoRef = useRef<HTMLVideoElement>(null);

    // Control video playback based on store state
    useEffect(() => {
        if (!videoRef.current || !src) return;
        
        if (isPlaying) {
            videoRef.current.play().catch(() => {});
        } else {
            videoRef.current.pause();
        }
    }, [isPlaying, src]);

    // If no video source provided, show placeholder
    if (!src) {
        return (
            <div
                className="relative flex items-center justify-center w-full aspect-video bg-black rounded-[var(--round-7)] overflow-hidden cursor-pointer group"
                onClick={() => (isPlaying ? pause() : play(id))}
            >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <button
                    className="relative z-10 flex items-center justify-center w-16 h-16 rounded-full bg-white/20 border-2 border-white/60 backdrop-blur-sm transition-all group-hover:scale-110 group-hover:bg-white/30"
                    aria-label={isPlaying ? "Pause" : title}
                >
                    {isPlaying ? (
                        <svg className="w-7 h-7 text-white fill-white" viewBox="0 0 24 24">
                            <rect x="6" y="4" width="4" height="16" />
                            <rect x="14" y="4" width="4" height="16" />
                        </svg>
                    ) : (
                        <svg className="w-7 h-7 text-white fill-white ml-1" viewBox="0 0 24 24">
                            <polygon points="5,3 19,12 5,21" />
                        </svg>
                    )}
                </button>
                {isPlaying && (
                    <div className="absolute bottom-4 left-4 right-4 z-10 text-white text-sm font-medium">
                        ▶ Playing: {title}
                    </div>
                )}
            </div>
        );
    }

    // Actual video player with controls
    return (
        <div className="relative w-full aspect-video bg-black rounded-[var(--round-7)] overflow-hidden group">
            <video
                ref={videoRef}
                src={src}
                className="w-full h-full object-cover"
                controls
                playsInline
                preload="metadata"
                onClick={(e) => e.stopPropagation()}
            >
                Your browser does not support the video tag.
            </video>
            
            {/* Optional: Custom play overlay when paused */}
            {!isPlaying && (
                <div 
                    className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={() => play(id)}
                >
                    <button
                        className="flex items-center justify-center w-16 h-16 rounded-full bg-white/20 border-2 border-white/60 backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/30"
                        aria-label="Play"
                    >
                        <svg className="w-7 h-7 text-white fill-white ml-1" viewBox="0 0 24 24">
                            <polygon points="5,3 19,12 5,21" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
}
