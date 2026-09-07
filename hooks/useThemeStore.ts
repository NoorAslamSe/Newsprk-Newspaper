"use client";
import { useTheme } from "next-themes";
import { useCallback, useMemo } from "react";

export type Theme = "light" | "dark" | "system";

/**
 * Modular wrapper around next-themes' useTheme hook.
 * Provides a simple API for theme toggling throughout the app.
 * 
 * NOTE: This hook can ONLY be used inside components wrapped by
 * the next-themes ThemeProvider.
 */
export function useThemeStore() {
    const { theme, setTheme, resolvedTheme } = useTheme();

    const toggleTheme = useCallback(() => {
        // Toggle between light and dark based on the currently resolved theme
        const next = resolvedTheme === "dark" ? "light" : "dark";
        setTheme(next);
    }, [resolvedTheme, setTheme]);

    return useMemo(() => ({
        /** The raw theme value ("light" | "dark" | "system") */
        theme: (theme || "system") as Theme,
        /** The resolved theme after system preference ("light" | "dark") */
        resolvedTheme: (resolvedTheme || "light") as "light" | "dark",
        /** Toggle between light and dark */
        toggleTheme,
        /** Set a specific theme */
        setTheme,
    }), [theme, resolvedTheme, toggleTheme, setTheme]);
}
