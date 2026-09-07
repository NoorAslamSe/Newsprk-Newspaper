"use client";
import { create } from "zustand";

/**
 * Zustand store for the mobile navigation drawer.
 * Centralizes open/close state so the Header toggle and overlay close
 * buttons can both control the same drawer without prop drilling.
 */
interface MenuStore {
    isOpen: boolean;
    toggle: () => void;
    close: () => void;
}

export const useMenuStore = create<MenuStore>((set) => ({
    isOpen: false,
    toggle: () => set((s) => ({ isOpen: !s.isOpen })),
    close: () => set({ isOpen: false }),
}));
