"use client";
import { useState, useEffect } from "react";
import { useThemeStore } from "@/hooks/useThemeStore";
import { useTranslations } from "@/hooks/useTranslations";
import { isRtl, RTL_LOCALES, DEPLOYMENT_LOCALE } from "@/lib/i18n";

/**
 * Style Selector — floating panel on right side of the page.
 * Exact replica of iNews v3.2 style_selector widget.
 *
 * Features:
 * - LIGHT / RTL / Dark layout preview thumbnails
 * - Light/Dark color scheme dropdown (connected to next-themes)
 * - RTL layout toggle (connected to useLayoutStore)
 * - Slides in/out with cubic-bezier transition
 * - Adapts colors for dark/light mode
 */
export default function StyleSelector() {
    const [opened, setOpened] = useState(false);
    const { resolvedTheme, setTheme } = useThemeStore();
    const tStyleSelector = useTranslations("styleSelector");
    const isDark = resolvedTheme === "dark";
    const rtlMode = isRtl(DEPLOYMENT_LOCALE);

    // Apply skin-dark class on body for reference CSS compatibility
    useEffect(() => {
        if (isDark) {
            document.body.classList.add("skin-dark");
        } else {
            document.body.classList.remove("skin-dark");
        }
    }, [isDark]);

    const handleColorSchemeChange = (value: string) => {
        if (value === "skin-dark") {
            setTheme("dark");
        } else {
            setTheme("light");
        }
    };

    const handleLayoutClick = (layout: "light" | "dark") => {
        if (layout === "dark") {
            setTheme("dark");
        } else {
            setTheme("light");
        }
    };

    const activeLayout = isDark ? "dark" : "light";

    const panelBg = isDark ? "#222327" : "#fff";
    const panelBorder = isDark ? "#484848" : "#e2e2e2";
    const labelColor = isDark ? "#bfbfbf" : "#7b7b7b";
    const selectColor = isDark ? "#fff" : "#3E3E3E";
    const selectBorder = isDark ? "rgba(255,255,255,0.1)" : "#E9E9E9";
    const iconBg = isDark ? "#222327" : "#fff";
    const headingColor = isDark ? "#fff" : "#333";
    const h6Color = isDark ? "#fff" : "#333";

    const panelLeft = rtlMode ? (opened ? "0" : "-245px") : undefined;
    const panelRight = rtlMode ? undefined : (opened ? "0" : "-245px");

    return (
        <div
            className={`style-settings ${opened ? "opened" : ""}`}
            style={{
                position: "fixed",
                top: "20%",
                zIndex: 1002,
                left: panelLeft,
                right: panelRight,
                width: "245px",
                background: panelBg,
                fontFamily: "'Montserrat', sans-serif",
                transition: "all 0.6s cubic-bezier(0.77, 0, 0.175, 1)",
                border: "none",
                borderTop: `1px solid ${panelBorder}`,
                borderBottom: `1px solid ${panelBorder}`,
                borderLeft: rtlMode ? "none" : `1px solid ${panelBorder}`,
                borderRight: rtlMode ? `1px solid ${panelBorder}` : "none",
                textAlign: rtlMode ? "right" : "left",
            }}
        >
            {/* Toggle icon — settings gear image */}
            <div
                className="style-settings-icon"
                onClick={() => setOpened(!opened)}
                style={{
                    background: `url(${isDark ? "/images/style-selector/settings.png" : "/images/style-selector/settings-dark.png"}) no-repeat scroll center center ${iconBg}`,
                    cursor: "pointer",
                    width: "50px",
                    height: "50px",
                    position: "absolute",
                    top: "-1px",
                    left: rtlMode ? "auto" : "-50px",
                    right: rtlMode ? "-50px" : "auto",
                    border: "none",
                    borderTop: `1px solid ${panelBorder}`,
                    borderBottom: `1px solid ${panelBorder}`,
                    borderLeft: rtlMode ? "none" : `1px solid ${panelBorder}`,
                    borderRight: rtlMode ? `1px solid ${panelBorder}` : "none",
                    transition: "background 0.3s",
                }}
            />

            <div className="style-settings-content" style={{ padding: "20px", textAlign: rtlMode ? "right" : "left" }}>
                <h4 style={{ fontSize: "14px", margin: "0 0 10px", color: headingColor, fontWeight: 700 }}>
                    {tStyleSelector("selectLayout")}
                </h4>

                {/* Layout previews — 2-column grid */}
                <div className="main-demo" style={{ display: "flex", flexWrap: "wrap", margin: "-10px -5px 0 -5px" }}>
                    {[
                        { key: "light" as const, label: "Light", img: "/images/style-selector/preview_ltr.jpg" },
                        { key: "dark" as const, label: tStyleSelector("dark"), img: "/images/style-selector/preview_dark.jpg" },
                    ].map((item) => (
                        <div
                            key={item.key}
                            className="d-col"
                            style={{ padding: "10px 5px 0 5px", flex: "0 0 50%", maxWidth: "50%", position: "relative" }}
                        >
                            <a
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleLayoutClick(item.key);
                                }}
                                style={{ display: "block", position: "relative" }}
                            >
                                <img
                                    src={item.img}
                                    alt={item.label}
                                    style={{
                                        maxWidth: "100%",
                                        boxShadow: "0 .125rem .25rem rgba(0,0,0,.2)",
                                        border: activeLayout === item.key ? "2px solid #56B665" : "2px solid transparent",
                                        transition: "border-color 0.2s",
                                    }}
                                />
                                {/* Green tick for active */}
                                {activeLayout === item.key && (
                                    <span
                                        style={{
                                            position: "absolute",
                                            top: "4px",
                                            right: rtlMode ? "auto" : "4px",
                                            left: rtlMode ? "4px" : "auto",
                                            width: "20px",
                                            height: "20px",
                                            borderRadius: "50%",
                                            backgroundColor: "#56B665",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: "11px",
                                            color: "#fff",
                                            lineHeight: 1,
                                        }}
                                    >
                                        &#10003;
                                    </span>
                                )}
                            </a>
                            <h6 style={{ fontSize: "13px", marginTop: "6px", textAlign: "center", color: h6Color, fontWeight: 600 }}>
                                {item.label}
                            </h6>
                        </div>
                    ))}
                </div>

                <h4 style={{ fontSize: "14px", margin: "16px 0 10px", color: headingColor, fontWeight: 700 }}>
                    {tStyleSelector("lightDarkVersion")}
                </h4>

                {/* Color Scheme dropdown */}
                <ul style={{ listStyle: "none", padding: 0, margin: 0, borderBottom: `1px solid ${isDark ? "#484848" : "#E9E9E9"}`, paddingBottom: "10px" }}>
                    <li style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <label style={{ display: "inline-block", fontSize: "13px", color: labelColor, fontWeight: 500, margin: "4px 2px" }}>
                            {tStyleSelector("colorScheme")}
                        </label>
                        <select
                            name="color_scheme"
                            value={isDark ? "skin-dark" : "light-mode"}
                            onChange={(e) => handleColorSchemeChange(e.target.value)}
                            style={{
                                float: rtlMode ? "left" : "right",
                                width: "85px",
                                fontFamily: "'Montserrat', sans-serif",
                                fontSize: "13px",
                                color: selectColor,
                                border: `1px solid ${selectBorder}`,
                                padding: "4px 5px",
                                background: isDark ? "transparent" : "#fff",
                                boxShadow: "0px 2px 0px 0px rgba(0,0,0,0.03)",
                                outline: "none",
                                cursor: "pointer",
                            }}
                        >
                            <option value="light-mode">{tStyleSelector("light")}</option>
                            <option value="skin-dark">{tStyleSelector("dark")}</option>
                        </select>
                    </li>
                </ul>
            </div>
        </div>
    );
}
