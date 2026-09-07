"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAudioStore } from "@/hooks/useAudioStore";
import { isFemaleVoice } from "@/hooks/useSpeechEngine";
import { Button } from "@/components/ui/button";
import { 
  Play, 
  Pause, 
  Volume2, 
  User, 
  UserCircle 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DEPLOYMENT_LOCALE } from "@/lib/i18n";
import { useTranslations } from "@/hooks/useTranslations";

interface ArticleAudioPlayerProps {
  text: string;
}

export function ArticleAudioPlayer({ text }: ArticleAudioPlayerProps) {
  const tAudio = useTranslations("audio");
  const { voiceType, setVoiceType, isPlaying, setIsPlaying } = useAudioStore();
  const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Load voices with addEventListener (not onvoiceschanged) to avoid single-slot overwrite
  useEffect(() => {
    if (!synth) return;

    const loadVoices = () => {
      const availableVoices = synth.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    synth.addEventListener("voiceschanged", loadVoices);

    // Polling fallback
    let pollCount = 0;
    const pollId = setInterval(() => {
      if (synth.getVoices().length > 0 || ++pollCount >= 20) {
        clearInterval(pollId);
        loadVoices();
      }
    }, 50);

    return () => {
      clearInterval(pollId);
      synth.removeEventListener("voiceschanged", loadVoices);
    };
  }, [synth]);

  const stopAudio = () => {
    if (synth) {
      synth.cancel();
      setIsPlaying(false);
    }
  };

  const playAudio = () => {
    if (!synth || !text) return;

    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Find suitable voice — locale-aware matching
    const langPrefix = DEPLOYMENT_LOCALE;
    const localeVoices = voices.filter(v => v.lang.startsWith(langPrefix));
    const pool = localeVoices.length > 0 ? localeVoices : voices;

    const selectedVoice = pool.find(v => {
      if (voiceType === 'female') return isFemaleVoice(v);
      return !isFemaleVoice(v);
    }) || pool[0] || voices[0];

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    
    utteranceRef.current = utterance;
    synth.speak(utterance);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      playAudio();
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (synth) synth.cancel();
    };
  }, [synth]);

  return (
    <div className="flex flex-col gap-3 p-4 bg-muted/30 rounded-xl border border-border/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
            <Volume2 size={16} />
          </div>
          <span className="text-sm font-semibold tracking-tight">{tAudio("audioReader")}</span>
        </div>
        
        <div className="flex items-center bg-background/50 p-1 rounded-lg border border-border/50">
          <button
            onClick={() => setVoiceType('female')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all",
              voiceType === 'female' 
                ? "bg-red-500 text-white shadow-sm" 
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            <User size={12} />
            {tAudio("female")}
          </button>
          <button
            onClick={() => setVoiceType('male')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all",
              voiceType === 'male' 
                ? "bg-red-500 text-white shadow-sm" 
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            <UserCircle size={12} />
            {tAudio("male")}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button 
          onClick={togglePlay}
          className={cn(
            "w-full h-10 rounded-lg font-bold transition-all active:scale-95",
            isPlaying ? "bg-black text-white hover:bg-black/90" : "bg-red-500 hover:bg-red-600 text-white"
          )}
        >
          {isPlaying ? (
            <>
              <Pause size={18} className="mr-2" />
              {tAudio("stopReading")}
            </>
          ) : (
            <>
              <Play size={18} className="mr-2 fill-current" />
              {tAudio("listenToArticle")}
            </>
          )}
        </Button>
      </div>
      
      <p className="text-[10px] text-muted-foreground text-center">
        {tAudio("generatedUsingSystemVoice")}
      </p>
    </div>
  );
}
