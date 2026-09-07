"use client";
import { usePlayerStore } from "@/hooks/usePlayerStore";

interface Props {
    id: string;
    title?: string;
    duration?: string;
}

export default function AudioPlayerStub({
    id,
    title = "Listen Now",
    duration = "4:30",
}: Props) {
    const { playing, play, pause } = usePlayerStore();
    const isPlaying = playing === id;

    return (
        <div className="flex items-center gap-4 p-4 rounded-[var(--round-7)] bg-[var(--flex-gray-7)] border border-[var(--flex-gray-15)]">
            <button
                onClick={() => (isPlaying ? pause() : play(id))}
                className="flex items-center justify-center w-11 h-11 rounded-full shrink-0 transition-all hover:scale-105"
                style={{ backgroundColor: "var(--audio-color, #ffa052)" }}
                aria-label={isPlaying ? "Pause audio" : "Play audio"}
            >
                {isPlaying ? (
                    <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                        <rect x="6" y="4" width="4" height="16" />
                        <rect x="14" y="4" width="4" height="16" />
                    </svg>
                ) : (
                    <svg className="w-5 h-5 fill-white ml-0.5" viewBox="0 0 24 24">
                        <polygon points="5,3 19,12 5,21" />
                    </svg>
                )}
            </button>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                    {title}
                </p>
                <div className="mt-1.5 h-1 w-full rounded-full bg-[var(--flex-gray-15)] overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                            width: isPlaying ? "35%" : "0%",
                            backgroundColor: "var(--audio-color, #ffa052)",
                        }}
                    />
                </div>
            </div>
            <span className="text-xs text-[var(--meta-fcolor)] shrink-0">{duration}</span>
        </div>
    );
}
