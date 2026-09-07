"use client";

import { useSpeechEngine, isFemaleVoice } from "@/hooks/useSpeechEngine";
import { useAudioStore } from "@/hooks/useAudioStore";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { User, UserCircle, ChevronDown, Check, Globe } from "lucide-react";
import { DEPLOYMENT_LOCALE } from "@/lib/i18n";

import { useTranslations } from "@/hooks/useTranslations";

interface ListenButtonProps {
    className?: string;
    text?: string;
    style?: React.CSSProperties;
}

export function ListenButton({ className, text, style }: ListenButtonProps) {
    const tComparison = useTranslations("comparison");
    const {
        isPlaying,
        isPaused,
        togglePlayPause,
        stop,
        hasSupport,
        rate,
        cycleSpeed,
        voices,
        localeVoices,
        selectedVoice,
        setSelectedVoice,
    } = useSpeechEngine();
    const { audioContent: globalContent } = useAudioStore();

    // Don't render until client side to avoid hydration mismatch
    if (typeof window === "undefined") return null;

    // Hide only if speech synthesis is explicitly unsupported
    if (!hasSupport && typeof window !== "undefined" && !("speechSynthesis" in window)) return null;

    const speedLabel = rate === 1 ? "1x" : rate === 1.5 ? "1.5x" : "2x";
    const textToSpeak = text || globalContent;

    // If no locale-specific voices, show ALL available voices as fallback
    const displayVoices = localeVoices.length > 0 ? localeVoices : voices;
    const femaleVoices = displayVoices.filter(v => isFemaleVoice(v));
    const maleVoices = displayVoices.filter(v => !isFemaleVoice(v));

    // Get language labels
    const getLangLabel = (lang: string) => {
      switch (lang) {
        case 'en': return 'English';
        case 'es': return 'Español';
        case 'ar': return 'العربية';
        default: return lang.toUpperCase();
      }
    };

    // Check if native language voice is missing
    const hasNativeVoice = localeVoices.length > 0;
    const missingVoiceMsg = !hasNativeVoice
      ? tComparison("voicePackageMissing").replace("{lang}", getLangLabel(DEPLOYMENT_LOCALE))
      : null;

    // Clean up a voice's display name (strip lang tag suffix)
    const displayName = (v: SpeechSynthesisVoice) =>
        v.name.replace(/\s*\(.*?\)\s*$/, "").trim() || v.name;

    // Determine icon for selected voice
    const isSelectedFemale = isFemaleVoice(selectedVoice);
    const VoiceIcon = isSelectedFemale ? User : UserCircle;
    const voiceGenderLabel = isSelectedFemale ? tComparison("female") : tComparison("male");

    return (
        <div className={cn("flex items-center gap-1", className)} style={style}>
            {/* ── Play / Pause button ── */}
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => togglePlayPause(textToSpeak)}
                            disabled={!textToSpeak}
                            className={cn(
                                "h-8 w-8 rounded-full transition-colors hover:bg-[var(--flex-gray-15)]",
                                isPlaying ? "text-[currentColor] bg-[var(--g-color)]/10" : "text-[currentColor]"
                            )}
                        >
                            {isPlaying ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <rect x="6" y="4" width="4" height="16" />
                                    <rect x="14" y="4" width="4" height="16" />
                                </svg>
                            ) : isPaused ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <polygon points="5 3 19 12 5 21 5 3" />
                                </svg>
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                                </svg>
                            )}
                            <span className="sr-only">
                                {isPlaying ? tComparison("pauseReadAloud") : tComparison("readAloud")}
                            </span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className={missingVoiceMsg && !isPlaying && !isPaused ? "text-amber-500 max-w-[220px]" : ""}>
                            {isPlaying
                                ? tComparison("pause")
                                : isPaused
                                    ? tComparison("resume")
                                    : missingVoiceMsg
                                        ? missingVoiceMsg
                                        : tComparison("listen")}
                        </p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            {/* ── Voice picker dropdown ── */}
            <DropdownMenu modal={false}>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className={cn(
                                        "flex items-center gap-0.5 h-7 px-2 ml-1 rounded-full",
                                        "bg-[var(--flex-gray-7)] border border-[var(--flex-gray-15)]",
                                        "text-[var(--meta-fcolor)] hover:text-[var(--heading-color)]",
                                        "hover:bg-[var(--flex-gray-15)] transition-all duration-150",
                                        "text-xs font-medium select-none cursor-pointer focus:outline-none"
                                    )}
                                    aria-label={tComparison("voice").replace("{name}", voiceGenderLabel)}
                                >
                                    <VoiceIcon size={12} />
                                    <ChevronDown size={10} className="opacity-60 ml-0.5" />
                                </button>
                            </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{tComparison("voice").replace("{name}", selectedVoice ? displayName(selectedVoice) : voiceGenderLabel)}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

<DropdownMenuContent
                    align="start"
                    className="min-w-[220px] max-h-72 overflow-y-auto"
                >
                    {/* Current locale label */}
                    <DropdownMenuLabel className="flex items-center gap-1.5 text-xs font-semibold uppercase text-[var(--g-color)]">
                        <Globe size={11} />
                        {localeVoices.length > 0
                            ? tComparison("nativeVoices")
                            : tComparison("systemVoices")}
                    </DropdownMenuLabel>

                    {localeVoices.length === 0 && voices.length > 0 && (
                        <div className="px-3 py-1.5 text-[10px] text-[var(--meta-fcolor)] leading-tight">
                            {tComparison("noLangVoices").replace("{lang}", getLangLabel(DEPLOYMENT_LOCALE))}
                        </div>
                    )}
                    
                    {/* Female voices */}
                    {femaleVoices.length > 0 && (
                        <>
                            <DropdownMenuLabel className="flex items-center gap-1.5 text-pink-500 dark:text-pink-400 pl-4">
                                <User size={10} />
                                {tComparison("female")}
                            </DropdownMenuLabel>
                            {femaleVoices.map((v) => (
                                <DropdownMenuItem
                                    key={v.name}
                                    onSelect={() => setSelectedVoice(v)}
                                    className="flex items-center justify-between cursor-pointer pl-6"
                                >
                                    <span className="truncate max-w-[150px] text-xs">{displayName(v)}</span>
                                    {selectedVoice?.name === v.name && (
                                        <Check size={11} className="text-[var(--g-color)] flex-shrink-0" />
                                    )}
                                </DropdownMenuItem>
                            ))}
                        </>
                    )}
                    
                    {femaleVoices.length > 0 && maleVoices.length > 0 && (
                        <DropdownMenuSeparator />
                    )}
                    
                    {/* Male voices */}
                    {maleVoices.length > 0 && (
                        <>
                            <DropdownMenuLabel className="flex items-center gap-1.5 text-blue-500 dark:text-blue-400 pl-4">
                                <UserCircle size={10} />
                                {tComparison("male")}
                            </DropdownMenuLabel>
                            {maleVoices.map((v) => (
                                <DropdownMenuItem
                                    key={v.name}
                                    onSelect={() => setSelectedVoice(v)}
                                    className="flex items-center justify-between cursor-pointer pl-6"
                                >
                                    <span className="truncate max-w-[150px] text-xs">{displayName(v)}</span>
                                    {selectedVoice?.name === v.name && (
                                        <Check size={11} className="text-[var(--g-color)] flex-shrink-0" />
                                    )}
                                </DropdownMenuItem>
                            ))}
                        </>
                    )}

                    {/* No voices at all */}
                    {displayVoices.length === 0 && (
                        <DropdownMenuItem disabled>
                            <span className="text-muted-foreground text-xs">{tComparison("noVoicesAvailable")}</span>
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* ── Speed + Stop controls (only while playing / paused) ── */}
            {(isPlaying || isPaused) && (
                <>
                    {/* Speed pill */}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={cycleSpeed}
                                    className={cn(
                                        "inline-flex items-center justify-center h-7 min-w-[40px] px-1.5 rounded-full",
                                        "text-[11px] font-bold tracking-tight leading-none",
                                        "border border-[var(--flex-gray-15)] bg-[var(--flex-gray-7)]",
                                        "hover:bg-[var(--g-color)] hover:text-white hover:border-[var(--g-color)]",
                                        "transition-all duration-200 select-none cursor-pointer"
                                    )}
                                    aria-label={`Playback speed ${speedLabel}`}
                                >
                                    {speedLabel}
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{tComparison("speed").replace("{label}", speedLabel)}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {/* Stop button */}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={stop}
                                    className="h-8 w-8 rounded-full text-[currentColor] hover:text-red-500 hover:bg-red-500/10"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                        <rect x="6" y="6" width="12" height="12" rx="2" />
                                    </svg>
                                    <span className="sr-only">{tComparison("stop")}</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{tComparison("stopPlaying")}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </>
            )}
        </div>
    );
}
