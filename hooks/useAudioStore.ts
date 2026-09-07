"use client";

import { create } from "zustand";

/**
 * Global Zustand store for the Text-to-Speech (TTS) audio player.
 * Shared between the AudioPlayer UI and the useSpeechEngine hook
 * so both always reflect the same playback state.
 */
interface AudioStore {
  audioContent: string;       // Text content currently queued for speech
  voiceType: 'male' | 'female';
  isPlaying: boolean;
  setAudioContent: (content: string) => void;
  setVoiceType: (type: 'male' | 'female') => void;
  setIsPlaying: (playing: boolean) => void;
  clearAudioContent: () => void; // Stops and resets speech state
}

export const useAudioStore = create<AudioStore>((set) => ({
  audioContent: "",
  voiceType: "female",
  isPlaying: false,
  setAudioContent: (content) => set({ audioContent: content }),
  setVoiceType: (type) => set({ voiceType: type }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  clearAudioContent: () => set({ audioContent: "", isPlaying: false }),
}));
