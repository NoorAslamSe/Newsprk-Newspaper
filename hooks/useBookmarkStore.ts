"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface BookmarkStore {
    bookmarks: string[]; // Array of article IDs the user has bookmarked
    toggle: (id: string) => void;
    isBookmarked: (id: string) => boolean;
}

/**
 * Persisted bookmark store backed by localStorage ('nv-bookmarks').
 * Survives page refreshes without requiring a backend or user account.
 */
export const useBookmarkStore = create<BookmarkStore>()(
    persist(
        (set, get) => ({
            bookmarks: [],
            // Adds the id if not present, removes it if already bookmarked (toggle)
            toggle: (id) => {
                const current = get().bookmarks;
                set({
                    bookmarks: current.includes(id)
                        ? current.filter((b) => b !== id)
                        : [...current, id],
                });
            },
            isBookmarked: (id) => get().bookmarks.includes(id),
        }),
        { name: "nv-bookmarks" } // localStorage key
    )
);
