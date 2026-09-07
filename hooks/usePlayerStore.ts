"use client";
import { create } from "zustand";

/**
 * Tracks which video player is currently active by its id.
 * Ensures only one video plays at a time across the page —
 * any new play() call implicitly pauses the previous one.
 */
interface PlayerStore {
    playing: string | null; // id of the currently active player, or null
    play: (id: string) => void;
    pause: () => void;
}

export const usePlayerStore = create<PlayerStore>((set) => ({
    playing: null,
    play: (id) => set({ playing: id }),
    pause: () => set({ playing: null }),
}));
