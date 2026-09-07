"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAudioStore } from "./useAudioStore";
import { DEPLOYMENT_LOCALE } from "@/lib/i18n";

/**
 * Detects if a voice is likely female based on its name.
 * Female voices naturally speak faster, so we compensate the rate.
 */
export function isFemaleVoice(voice: SpeechSynthesisVoice | null): boolean {
  if (!voice) return false;
  const name = voice.name.toLowerCase();
  // Explicit female markers
  if (name.includes("female")) return true;
  // Google US English (no "Male" suffix) is typically female-sounding
  if (name === "google us english") return true;
  // Common system female voices — English
  if (/zira|hazel|linda|jenny|aria|sara|samantha|victoria|moira|tessa|elena|karen/i.test(voice.name)) return true;
  // Spanish female voices (Windows, macOS, Chrome)
  if (/helena|sabina|monica|laura|penelope|isabel|elvira|microsoft.*espanol.*female|google.*espanol.*female/i.test(voice.name)) return true;
  // Arabic female voices (Windows, Chrome)
  if (/hoda|layla|fatima|microsoft.*arabic.*female|google.*arabic.*female/i.test(voice.name)) return true;
  return false;
}

/**
 * Returns the language prefix for a given locale
 * e.g., "en" -> "en", "es" -> "es", "ar" -> "ar"
 */
function getVoiceLangPrefix(locale: string): string {
  switch (locale) {
    case "es":
      return "es";
    case "ar":
      return "ar";
    default:
      return "en";
  }
}

/**
 * Returns the effective utterance rate, compensating for female voices
 * which naturally speak faster than male voices.
 * 
 * User-selected:  1x   → Male: 1.0,  Female: 0.95
 * User-selected:  1.5x → Male: 1.5,  Female: 1.25
 * User-selected:  2x   → Male: 2.0,  Female: 1.65
 */
function getEffectiveRate(userRate: number, voice: SpeechSynthesisVoice | null): number {
  if (!isFemaleVoice(voice)) return userRate;
  // Female compensation: reduce the multiplier effect
  if (userRate <= 1) return 0.95;
  if (userRate <= 1.5) return 1.25;
  return 1.65; // 2x
}

export function useSpeechEngine() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [rate, setRate] = useState(1);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [hasSupport, setHasSupport] = useState(false);

  // Determine the voice language prefix from deployment locale
  const voiceLangPrefix = getVoiceLangPrefix(DEPLOYMENT_LOCALE);

  // Voices whose lang starts with the deployment locale (e.g. "ar-*", "es-*", "en-*")
  const localeVoices = voices.filter((v) => v.lang.startsWith(voiceLangPrefix));

  // Refs mirror state so playNextChunk callbacks always see the latest values
  // without capturing stale closures from the initial render.
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const chunksRef = useRef<string[]>([]);          // Text split by punctuation for speed-change responsiveness
  const currentChunkIndexRef = useRef<number>(0);  // Tracks which chunk the engine is currently speaking
  const isPlayingRef = useRef<boolean>(false);
  const isPausedRef = useRef<boolean>(false);
  const rateRef = useRef<number>(1);
  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  // Subscribe to voice preference (male/female) from the shared audio store
  const voicePreference = useAudioStore((state) => state.voiceType);
  // Keep a ref so onvoiceschanged callback always reads the LATEST preference
  // (avoids the stale-closure bug where Chrome fires the event after the initial render)
  const voicePreferenceRef = useRef(voicePreference);
  useEffect(() => {
    voicePreferenceRef.current = voicePreference;
  }, [voicePreference]);

  // Keep voice ref in sync
  useEffect(() => {
    selectedVoiceRef.current = selectedVoice;
  }, [selectedVoice]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    setHasSupport(true);

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length === 0) return; // still not ready

      setVoices(availableVoices);

      // Debug: log available voices so we can see what the browser detects
      console.log("[TTS] Available voices:", availableVoices.map(v => `${v.name} (${v.lang}) [localService=${v.localService}]`));
      const localeMatches = availableVoices.filter(v => v.lang.startsWith(voiceLangPrefix));
      console.log(`[TTS] Locale "${voiceLangPrefix}" matches:`, localeMatches.length, localeMatches.map(v => v.name));

      // Only set a default selection if the user hasn't manually picked one yet.
      // Reading from ref to always use the latest preference without re-registering the listener.
      setSelectedVoice((prev) =>
        prev ? prev : findBestVoice(availableVoices, voicePreferenceRef.current) || null
      );
    };

    // ① Try synchronously — Firefox / Safari already have voices available
    loadVoices();

    // ② Use addEventListener so multiple hook instances don't overwrite each other
    //    (onvoiceschanged = fn is a single-slot property — last writer wins)
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

    // ③ Polling fallback: some browsers fire voiceschanged before we attach the listener
    //    (or don't fire it at all). Poll for up to ~1 s to catch those cases.
    let pollCount = 0;
    const pollId = setInterval(() => {
      if (window.speechSynthesis.getVoices().length > 0 || ++pollCount >= 20) {
        clearInterval(pollId);
        loadVoices(); // harmless no-op if already loaded
      }
    }, 50);

    return () => {
      clearInterval(pollId);
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
    };
  }, []); // run once; refs keep voicePreference current inside the closure


  function findBestVoice(availableVoices: SpeechSynthesisVoice[], type: 'male' | 'female'): SpeechSynthesisVoice | null {
    if (availableVoices.length === 0) return null;

    // Filter voices by the current locale's language prefix
    const localeVoices = availableVoices.filter(v => v.lang.startsWith(voiceLangPrefix));

    // If we have locale-specific voices, use them; otherwise fall back to all voices
    const pool = localeVoices.length > 0 ? localeVoices : availableVoices;

    // Female name heuristics — expanded to cover Windows, macOS, Linux, Chrome OS
    const FEMALE_RE = /female|zira|hazel|linda|jenny|aria|sara|samantha|victoria|moira|tessa|elena|karen|helena|sabina|hoda|layla|fatima|google .+ female|microsoft .+ female/i;
    // Male name heuristics
    const MALE_RE = /male|david|daniel|guy|mark|andrew|james|richard|jorge|pablo|diego|google .+ male|microsoft .+ male|naayf|ahmed|omar|ali/i;

    const femalePool = pool.filter(v => FEMALE_RE.test(v.name) || isFemaleVoice(v));
    const malePool = pool.filter(v => MALE_RE.test(v.name) || (!isFemaleVoice(v) && !FEMALE_RE.test(v.name)));

    if (type === 'female') {
      return (
        // 1) Best: locale voice matching female pattern
        (localeVoices.length > 0 ? localeVoices.find(v => FEMALE_RE.test(v.name) || isFemaleVoice(v)) : null) ||
        // 2) Any locale voice that isn't explicitly male
        (localeVoices.length > 0 ? localeVoices.find(v => !/male/i.test(v.name) || isFemaleVoice(v)) : null) ||
        // 3) Any female voice from the full pool
        femalePool[0] ||
        // 4) First locale voice, then first available
        localeVoices[0] ||
        availableVoices[0]
      );
    } else {
      return (
        // 1) Best: locale voice matching male pattern
        (localeVoices.length > 0 ? localeVoices.find(v => MALE_RE.test(v.name) && !/female/i.test(v.name)) : null) ||
        // 2) Any locale voice that isn't explicitly female
        (localeVoices.length > 0 ? localeVoices.find(v => !isFemaleVoice(v) && !/female/i.test(v.name)) : null) ||
        // 3) Any male voice from the full pool
        malePool[0] ||
        // 4) First locale voice, then first available
        localeVoices[0] ||
        availableVoices[0]
      );
    }
  }

  const stop = useCallback(() => {
    if (!hasSupport) return;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    isPlayingRef.current = false;
    isPausedRef.current = false;
    currentChunkIndexRef.current = 0;
    chunksRef.current = [];
  }, [hasSupport]);

  // Speaks one sentence/phrase at a time; auto-advances to the next chunk on completion.
  // This chunk-by-chunk approach lets speed/voice changes take effect within ~1-2 seconds.
  const playNextChunk = useCallback(() => {
    if (currentChunkIndexRef.current >= chunksRef.current.length) {
        // All chunks finished — reset playback state
        setIsPlaying(false);
        setIsPaused(false);
        isPlayingRef.current = false;
        return;
    }

    if (!isPlayingRef.current || isPausedRef.current) return;

    const chunk = chunksRef.current[currentChunkIndexRef.current];
    const utterance = new SpeechSynthesisUtterance(chunk);
    const voice = selectedVoiceRef.current;
    if (voice) utterance.voice = voice;

    utterance.rate = getEffectiveRate(rateRef.current, voice);

    // Adjust pitch per gender: male voices get a slightly deeper tone
    if (voice && !isFemaleVoice(voice)) {
      utterance.pitch = 0.85;
    } else {
      utterance.pitch = 1.0;
    }

    // Advance the index and queue the next chunk when this one ends
    utterance.onend = () => {
        if (!isPlayingRef.current || isPausedRef.current) return;
        currentChunkIndexRef.current += 1;
        // Small delay between chunks prevents browser hanging on non-Latin scripts (Arabic)
        setTimeout(() => playNextChunk(), 50);
    };

    // Ignore "canceled" errors — those are intentional (from stop/pause calls)
    utterance.onerror = (e) => {
        if (e.error !== "canceled") {
            console.error("Speech synthesis error", e);
            setIsPlaying(false);
            isPlayingRef.current = false;
        }
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, []);

  const speak = useCallback((text: string) => {
    if (!hasSupport || !text) return;
    
    stop(); // cancel anything currently happening

    // Sanitize ellipses so they aren't spoken as "dot dot dot"
    const sanitized = text
        .replace(/\.{2,}/g, ".")
        .replace(/…/g, ".")
        .replace(/\s+/g, " ")
        .trim();

    // Split into SMALL chunks (by comma, period, exclamation, question mark)
    // Arabic uses ؟ (question mark) and ، (comma) — include Unicode punctuation
    // so speed changes take effect almost immediately (within ~1-2 seconds)
    const chunks = sanitized
        .match(/[^.!?,؟،!]+[.!?,؟،!]*/gu) || [sanitized]; 
    
    chunksRef.current = chunks
        .map(c => c.trim())
        .filter(c => c.length > 0 && c !== "." && c !== ",");
    currentChunkIndexRef.current = 0;

    setIsPlaying(true);
    setIsPaused(false);
    isPlayingRef.current = true;
    isPausedRef.current = false;
    
    playNextChunk();
    
  }, [hasSupport, playNextChunk, stop]);

  const pause = useCallback(() => {
    if (!hasSupport) return;

    // Native speechSynthesis.pause() hangs permanently for cloud/network voices.
    // Canceling and tracking the chunk index lets us resume from the right position.
    window.speechSynthesis.cancel();

    setIsPaused(true);
    setIsPlaying(false);
    isPausedRef.current = true;
    isPlayingRef.current = false;
  }, [hasSupport]);

  const resume = useCallback(() => {
    if (!hasSupport || chunksRef.current.length === 0) return;
    
    setIsPaused(false);
    setIsPlaying(true);
    isPausedRef.current = false;
    isPlayingRef.current = true;

    // Resumes playing exactly at the chunk that was interrupted
    playNextChunk();
  }, [hasSupport, playNextChunk]);

  const togglePlayPause = useCallback((text?: string) => {
      if (isPlaying) {
          pause();
      } else if (isPaused) {
          resume();
      } else if (text) {
          speak(text);
      }
  }, [isPlaying, isPaused, pause, resume, speak]);

  // Clean up on unmount or route change
  useEffect(() => {
      return () => {
          stop();
      };
  }, [stop]);

  const SPEED_OPTIONS = [1, 1.5, 2] as const;

  const cycleSpeed = useCallback(() => {
    setRate((prev) => {
      const currentIdx = SPEED_OPTIONS.indexOf(prev as 1 | 1.5 | 2);
      const nextIdx = (currentIdx + 1) % SPEED_OPTIONS.length;
      const newRate = SPEED_OPTIONS[nextIdx];
      rateRef.current = newRate;
      return newRate;
    });
  }, []);

  return {
    speak,
    pause,
    resume,
    stop,
    togglePlayPause,
    isPlaying,
    isPaused,
    hasSupport,
    voices,
    localeVoices,
    selectedVoice,
    setSelectedVoice,
    rate,
    cycleSpeed
  };
}
