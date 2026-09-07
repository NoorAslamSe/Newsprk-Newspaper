"use client";
import { useEffect } from "react";
import { useThemeStore } from "@/hooks/useThemeStore";
import { useLayoutStore, initLayout } from "@/hooks/useLayoutStore";

/**
 * Synchronizes the next-themes resolved theme with:
 * 1. `data-theme` attribute on <html> and <body> (for foxiz CSS compatibility)
 * 2. `skin-dark` class on <body> (for iNews reference CSS compatibility)
 * 3. RTL layout direction (for layout-rtl class on <body>)
 */
export default function ThemeInitializer() {
    const { resolvedTheme } = useThemeStore();

    useEffect(() => {
        // 1. Mirror next-themes to data-theme attribute
        const dataThemeValue = resolvedTheme === "dark" ? "dark" : "default";
        document.documentElement.setAttribute("data-theme", dataThemeValue);
        document.body?.setAttribute("data-theme", dataThemeValue);

        // 2. Toggle skin-dark class on body for reference CSS
        if (resolvedTheme === "dark") {
            document.body?.classList.add("skin-dark");
        } else {
            document.body?.classList.remove("skin-dark");
        }

        // 3. Sync dark class on html element
        document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
        document.documentElement.classList.toggle("light", resolvedTheme !== "dark");
    }, [resolvedTheme]);

    // Initialize RTL layout from cookie on mount
    useEffect(() => {
        initLayout();
    }, []);

    return null;
}
