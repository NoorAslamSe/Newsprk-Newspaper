"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { useMenuStore } from "@/hooks/useMenuStore";
import { useTranslations } from "@/hooks/useTranslations";
import { DEPLOYMENT_LOCALE, LOCALE_LABELS } from "@/lib/i18n";
import type { Category, Article, Product } from "@/types";
import { ListenButton } from "@/components/ui/ListenButton";
import { useBookmarkStore } from "@/hooks/useBookmarkStore";

interface Props {
    categories: Category[];
    articles: Article[];
    products: Product[];
}

export default function Header({ categories, articles, products }: Props) {
    const { isOpen, toggle, close } = useMenuStore();
    const tHeader = useTranslations("header");
    const tCommon = useTranslations("common");
    const tPagesCategories = useTranslations("pagesCategories");
    const tHome = useTranslations("home");
    const bookmarkCount = useBookmarkStore((s) => s.bookmarks.length);

    const PAGES_CATEGORIES = [
        { label: tPagesCategories("business"), href: "/category/business" },
        { label: tPagesCategories("technology"), href: "/category/technology" },
        { label: tPagesCategories("sports"), href: "/category/sports" },
        { label: tPagesCategories("travel"), href: "/category/travel" },
        { label: tPagesCategories("politics"), href: "/category/politics" },
        { label: tPagesCategories("lifestyle"), href: "/category/lifestyle" },
        { label: tPagesCategories("entertainment"), href: "/category/entertainment" },
        { label: tPagesCategories("fashion"), href: "/category/fashion" },
        { label: tPagesCategories("science"), href: "/category/science" },
        { label: tPagesCategories("photography"), href: "/category/photography" },
    ];

    // Build the megamenu dynamically from the product catalog so product items
    // (with images) deep-link into the CompareView for comparisons.
    const megaMenuCols = (() => {
        const byCategory = new Map<string, Product[]>();
        for (const p of products) {
            const list = byCategory.get(p.category) || [];
            list.push(p);
            byCategory.set(p.category, list);
        }
        return Array.from(byCategory.entries()).map(([category, prods]) => {
            const bySub = new Map<string, Product[]>();
            for (const p of prods) {
                const key = p.subcategory || "other";
                const list = bySub.get(key) || [];
                list.push(p);
                bySub.set(key, list);
            }
            return {
                category,
                label: tPagesCategories(category) || category,
                href: `/category/${category}`,
                subcategories: Array.from(bySub.entries()).map(([sub, items]) => ({
                    sub,
                    items: items.slice(0, 5),
                })),
            };
        });
    })();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQ, setSearchQ] = useState("");
    const [megaOpen, setMegaOpen] = useState(false);
    const [pagesOpen, setPagesOpen] = useState(false);
    const [pagesCatOpen, setPagesCatOpen] = useState(false);
    const [currentDate, setCurrentDate] = useState("");
    const [mounted, setMounted] = useState(false);

    const closeSidebar = useCallback(() => setSidebarOpen(false), []);
    const [isRtl, setIsRtl] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        setIsRtl(document.documentElement.dir === "rtl");
    }, []);

    useEffect(() => {
        const localeMap: Record<string, string> = { en: "en-US", es: "es-ES", ar: "ar-SA" };
        setCurrentDate(
            new Date().toLocaleDateString(localeMap[DEPLOYMENT_LOCALE] || "en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
            })
        );
    }, []);

    const navLinkStyle: React.CSSProperties = {
        padding: "15px 15px",
        fontWeight: 600,
        fontSize: "15px",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        borderRadius: 0,
        color: "var(--nav-color, #fff)",
        textDecoration: "none",
        display: "block",
    };

    return (
        <header className="w-full">
            {/* ═══ TIER 1: HEADER TOP (.header-top) ═══ */}
            <div style={{ background: "#EF4444", padding: "10px 0" }}>
                <div className="mx-auto px-4" style={{ maxWidth: "1140px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        {/* Left: social + Contact + Donation */}
                        <div>
                            <ul style={{ display: "flex", alignItems: "center", listStyle: "none", padding: 0, margin: 0 }}>
                                <li style={{ paddingInlineEnd: "15px" }}>
                                    <ul style={{ display: "flex", alignItems: "center", gap: "8px", listStyle: "none", padding: 0, margin: 0 }}>
                                        <li><a href="#" style={{ color: "#fff", fontSize: "0.844rem" }} className="hover:opacity-30 transition-opacity"><i className="fab fa-facebook-f"></i></a></li>
                                        <li><a href="#" style={{ color: "#fff", fontSize: "0.844rem" }} className="hover:opacity-30 transition-opacity"><i className="fab fa-twitter"></i></a></li>
                                        <li><a href="#" style={{ color: "#fff", fontSize: "0.844rem" }} className="hover:opacity-30 transition-opacity"><i className="fab fa-vk"></i></a></li>
                                        <li><a href="#" style={{ color: "#fff", fontSize: "0.844rem" }} className="hover:opacity-30 transition-opacity"><i className="fab fa-instagram"></i></a></li>
                                        <li><a href="#" style={{ color: "#fff", fontSize: "0.844rem" }} className="hover:opacity-30 transition-opacity"><i className="fab fa-youtube"></i></a></li>
                                        <li><a href="#" style={{ color: "#fff", fontSize: "0.844rem" }} className="hover:opacity-30 transition-opacity"><i className="fab fa-vimeo-v"></i></a></li>
                                    </ul>
                                </li>
                                <li className="hidden sm:list-item" style={{ fontSize: "0.781rem", padding: "0 15px", letterSpacing: "0.5px", textTransform: "uppercase", borderInlineStart: "1px solid rgba(255,255,255,0.2)" }}>
                                    <a href="/contact" style={{ color: "#fff" }} className="hover:border-b hover:border-dotted hover:border-[#fecc17] transition-all">{tHeader("contact")}</a>
                                </li>
                                <li className="hidden sm:list-item" style={{ fontSize: "0.781rem", padding: "0 15px", letterSpacing: "0.5px", textTransform: "uppercase", borderInlineStart: "1px solid rgba(255,255,255,0.2)" }}>
                                    <a href="/advertise" style={{ color: "#fff" }} className="hover:border-b hover:border-dotted hover:border-[#fecc17] transition-all">{tHeader("donation")}</a>
                                </li>
                            </ul>
                        </div>
                        {/* Right: Currency + Wishlist + Sign Up/Login */}
                        <div>
                            <ul style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", listStyle: "none", padding: 0, margin: 0 }}>
                                <li className="hidden md:list-item" style={{ fontSize: "0.781rem", padding: "0 15px", letterSpacing: "0.5px", textTransform: "uppercase", borderInlineStart: "1px solid rgba(255,255,255,0.2)" }}>
                                    {tHeader("currencyLabel")}: <a href="#" style={{ color: "#fff", fontWeight: 700 }} className="hover:border-b hover:border-dotted hover:border-[#fecc17] transition-all">{tCommon("currency")}</a>
                                </li>
                                <li className="hidden md:list-item" style={{ fontSize: "0.781rem", padding: "0 15px", letterSpacing: "0.5px", textTransform: "uppercase", borderInlineStart: "1px solid rgba(255,255,255,0.2)" }}>
                                    <Link href="/bookmarks" style={{ color: "#fff", display: "inline-flex", alignItems: "center", gap: "5px" }} className="hover:border-b hover:border-dotted hover:border-[#fecc17] transition-all">
                                        <i className="fa fa-bookmark" style={{ fontSize: "0.9rem" }}></i>
                                        {tHeader("bookmarks")}: <span style={{ fontWeight: 700 }}>{mounted ? bookmarkCount : 0}</span>
                                    </Link>
                                </li>
                                <li style={{ fontSize: "0.781rem", padding: "0 15px", letterSpacing: "0.5px", textTransform: "uppercase", borderInlineStart: "1px solid rgba(255,255,255,0.2)" }}>
                                    <a href="/auth/signin" style={{ color: "#fff" }} className="hover:border-b hover:border-dotted hover:border-[#fecc17] transition-all">
                                        <i className="fa fa-lock" style={{ marginInlineEnd: "5px" }}></i> {tHeader("signUp")}
                                    </a>
                                    {" "}
                                    <span style={{ fontWeight: 700 }}>{tCommon("or")}</span>
                                    {" "}
                                    <a href="/auth/signin" style={{ color: "#fff" }} className="hover:border-b hover:border-dotted hover:border-[#fecc17] transition-all">{tHeader("login")}</a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══ TIER 2: HEADER MID (.header-mid) ═══ */}
            <div className="hidden md:block" style={{ padding: "20px 0" }}>
                <div className="mx-auto px-4" style={{ maxWidth: "1140px" }}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <div style={{ flex: "1 0 0%" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div id="nav-icon" className={"cursor-pointer" + (sidebarOpen ? " open" : "")} onClick={() => setSidebarOpen(!sidebarOpen)} style={{ width: "24px", height: "14px", position: "relative", transition: ".5s ease-in-out" }}>
                                    <span style={{ display: "block", position: "absolute", height: "2px", width: "100%", background: "var(--nav-color, #fff)", borderRadius: "9px", insetInlineStart: 0, top: sidebarOpen ? "6px" : "0px", transform: sidebarOpen ? "rotate(135deg)" : "rotate(0deg)", transition: ".25s ease-in-out" }}></span>
                                    <span style={{ display: "block", position: "absolute", height: "2px", width: "100%", background: "var(--nav-color, #fff)", borderRadius: "9px", insetInlineStart: sidebarOpen ? "-60px" : "0", top: "6px", opacity: sidebarOpen ? 0 : 1, transition: ".25s ease-in-out" }}></span>
                                    <span style={{ display: "block", position: "absolute", height: "2px", width: "100%", background: "var(--nav-color, #fff)", borderRadius: "9px", insetInlineStart: 0, top: sidebarOpen ? "6px" : "12px", transform: sidebarOpen ? "rotate(-135deg)" : "rotate(0deg)", transition: ".25s ease-in-out" }}></span>
                                </div>
                                <div style={{ width: "1px", height: "20px", backgroundColor: "var(--flex-gray-15, rgba(255,255,255,0.3))" }}></div>
                                <span style={{ color: "var(--nav-color, #fff)", fontSize: "14px", fontWeight: 600, textTransform: "uppercase" }}>{tHeader("allSection")}</span>
                            </div>
                        </div>
                        <div style={{ flex: "0 0 auto" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div style={{ color: "var(--nav-color, #fff)", fontSize: "1.25rem", fontWeight: 600 }}>
                                        <i className="wi wi-day-lightning" style={{ marginInlineEnd: "4px" }}></i> 11.23°C
                                </div>
                                <Link href="/" style={{ display: "flex", alignItems: "center" }}>
                                    <span className="font-black tracking-tight leading-none" style={{ fontSize: "28px" }}>
                                        <span style={{ color: "#eb0254" }}>{tHome("brandTrends")}</span><span style={{ color: "var(--body-fcolor, #fff)" }}>{tHome("brandPosts")}</span>
                                    </span>
                                </Link>
                                <div className="relative">
                                    <button className="flex items-center gap-2 bg-transparent border-0 cursor-pointer" style={{ color: "var(--nav-color, #fff)", padding: 0 }}>
                                        <i className="fa-solid fa-earth-americas"></i>
                                        <span style={{ fontWeight: 600 }}>{LOCALE_LABELS[DEPLOYMENT_LOCALE]?.substring(0, 2) || "En"}</span>
                                        {/* <svg style={{ width: "12px", height: "12px" }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg> */}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div style={{ flex: "1 0 0%", textAlign: "end" }}>
                            <span style={{ color: "var(--nav-color, #fff)", fontSize: "14px", fontWeight: 600, textTransform: "uppercase" }}>{currentDate}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══ TIER 3: NAVIGATION (.custom-navbar) ═══ */}
            <nav className="custom-navbar sticky top-0 z-50 flex flex-col" style={{ borderTop: "1px solid var(--flex-gray-15, rgba(255,255,255,0.1))", borderBottom: "1px solid var(--flex-gray-15, rgba(255,255,255,0.1))" }}>
                {searchOpen && (
                    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.95)", zIndex: 1000000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={() => setSearchOpen(false)}>
                        <a href="#" onClick={(e) => { e.preventDefault(); setSearchOpen(false); }} style={{ position: "absolute", insetInlineEnd: "20px", top: "20px", color: "#fff", fontSize: "20px", zIndex: 1, cursor: "pointer" }}>
                            <i className="ti-close"></i>
                        </a>
                        <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "800px", position: "relative", textAlign: "center" }}>
                            <form onSubmit={(e) => { e.preventDefault(); if (searchQ.trim()) window.location.href = "/search?q=" + encodeURIComponent(searchQ.trim()); }} style={{ position: "relative", maxWidth: "800px", margin: "auto" }}>
                                <input type="text" value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder={tCommon("searchPlaceholder")} autoFocus style={{ width: "100%", background: "transparent", border: "none", borderBottom: "2px solid #EF4444", color: "#fff", fontSize: "35px", padding: "20px 50px 20px 0", outline: "none", transition: "all 0.3s ease-out", textAlign: "start" }} />
                                <i className="ti-search" style={{ position: "absolute", insetInlineEnd: "20px", top: "50%", transform: "translateY(-50%)", color: "#EF4444", fontSize: "18px", cursor: "pointer" }}>
                                    <input value="" type="submit" style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
                                </i>
                            </form>
                        </div>
                    </div>
                )}

                <div className="mx-auto w-full px-4" style={{ maxWidth: "1140px", position: "relative" }}>
                    {/* Mobile logo */}
                        <a className="lg:hidden flex items-center py-3" href="/">
                            <span className="font-black text-xl leading-none">
                                <span style={{ color: "#eb0254" }}>{tHome("brandTrends")}</span><span style={{ color: "var(--body-fcolor, #fff)" }}>{tHome("brandPosts")}</span>
                            </span>
                    </a>

                    {/* Mobile Listen Button — only visible below lg */}
                    <ListenButton className="lg:hidden absolute" style={{ insetInlineStart: "96px", top: "50%", transform: "translateY(-50%)" }} />

                    {/* Mobile search — only visible below lg */}
                    <button type="button" className="lg:hidden absolute bg-transparent border-0 cursor-pointer" style={{ color: "var(--nav-color, #fff)", fontSize: "17px", height: "38px", width: "38px", padding: 0, insetInlineStart: "52px", top: "50%", transform: "translateY(-50%)" }} onClick={() => setSearchOpen(true)}>
                        <i className="fa fa-search"></i>
                    </button>

                    {/* Mobile toggler — only visible below lg */}
                    <button className="lg:hidden absolute bg-transparent border-0 cursor-pointer" type="button" onClick={toggle} aria-label="Toggle navigation" style={{ insetInlineStart: "16px", top: "50%", transform: "translateY(-50%)" }}>
                        <span style={{ display: "block", width: "30px", height: "30px", background: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3E%3Cpath stroke='%23fff' stroke-linecap='round' stroke-miterlimit='10' stroke-width='3' d='M4 7h22M4 15h22M4 23h22'/%3E%3C/svg%3E\") no-repeat center / contain" }}></span>
                    </button>

                    {/* Desktop navbar + search button — only visible lg+ */}
                    <div className="hidden lg:flex items-center justify-between">
                        <ul className="flex items-center list-none p-0 m-0">
                            <li style={{ borderInlineStart: "1px solid var(--flex-gray-15, rgba(255,255,255,0.1))" }}>
                                <Link href="/" style={{ ...navLinkStyle, color: "#eb0254" }}>{tCommon("home")}</Link>
                            </li>
                            <li className="hidden lg:list-item" style={{ borderInlineStart: "1px solid var(--flex-gray-15, rgba(255,255,255,0.1))" }} onMouseEnter={() => setMegaOpen(true)} onMouseLeave={() => setMegaOpen(false)}>
                                <a href="#" style={navLinkStyle} onClick={(e) => e.preventDefault()}>{tHeader("megaMenu")}</a>
                                {megaOpen && (
                                    <div style={{ position: "absolute", top: "100%", insetInlineStart: 0, backgroundColor: "var(--solid-white, #222327)", border: "1px solid var(--flex-gray-15, #383838)", boxShadow: "1px 1px 4px rgba(0,0,0,0.15)", padding: "12px", zIndex: 50, minWidth: "760px", maxWidth: "100%", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0" }}>
                                        {megaMenuCols.slice(0, 6).map((col, idx) => (
                                            <div key={col.category} style={{ padding: "0 12px", borderInlineStart: idx > 0 ? "1px solid var(--flex-gray-15, #383838)" : "none" }}>
                                                <Link href={col.href} className="hover:text-[#eb0254] transition-colors" style={{ fontSize: "15px", color: "var(--heading-color, #fff)", fontWeight: 600, marginBottom: "10px", display: "block" }}>
                                                    {col.label}
                                                </Link>
                                                <ul style={{ display: "flex", flexDirection: "column", gap: "10px", listStyle: "none", padding: 0, margin: 0 }}>
                                                    {col.subcategories.map(({ sub, items }) => (
                                                        <li key={sub}>
                                                            {col.subcategories.length > 1 && (
                                                                <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.4px", color: "var(--meta-fcolor, #999)", display: "block", marginBottom: "4px" }}>{sub}</span>
                                                            )}
                                                            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                                                                {items.map((p) => (
                                                                    <li key={p.slug} style={{ marginBottom: "6px" }}>
                                                                        <Link href={`/compare?product=${p.slug}`} className="flex items-center gap-2 text-sm hover:text-[#eb0254] transition-colors" style={{ color: "var(--nav-color, #fff)" }}>
                                                                            <span style={{ position: "relative", width: "30px", height: "30px", borderRadius: "6px", overflow: "hidden", flexShrink: 0, background: "var(--flex-gray-15, #383838)" }}>
                                                                                {p.image ? (
                                                                                    <Image src={p.image} alt={p.name} fill sizes="30px" className="object-cover" />
                                                                                ) : null}
                                                                            </span>
                                                                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "150px" }}>{p.name}</span>
                                                                        </Link>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                        {megaMenuCols.length === 0 &&
                                            PAGES_CATEGORIES.map((c, idx) => (
                                                <div key={c.href} style={{ padding: "0 12px", borderInlineStart: idx > 0 ? "1px solid var(--flex-gray-15, #383838)" : "none" }}>
                                                    <Link href={c.href} className="hover:text-[#eb0254] transition-colors" style={{ fontSize: "15px", color: "var(--heading-color, #fff)", fontWeight: 600, display: "block" }}>
                                                        {c.label}
                                                    </Link>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </li>
                            <li className="relative" style={{ borderInlineStart: "1px solid var(--flex-gray-15, rgba(255,255,255,0.1))" }} onMouseEnter={() => setPagesOpen(true)} onMouseLeave={() => { setPagesOpen(false); setPagesCatOpen(false); }}>
                                <a href="#" style={{ ...navLinkStyle, color: "#eb0254", display: "inline-flex", alignItems: "center", gap: "6px" }} onClick={(e) => e.preventDefault()}>
                                    {tHeader("pages")}
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
                                </a>
                                {pagesOpen && (
                                    <div style={{ position: "absolute", top: "100%", insetInlineStart: 0, backgroundColor: "var(--solid-white, #222327)", border: "1px solid var(--flex-gray-15, #383838)", boxShadow: "1px 1px 4px rgba(0,0,0,0.15)", minWidth: "220px", padding: "4px 0", zIndex: 50 }}>
                                        <div className="relative" onMouseEnter={() => setPagesCatOpen(true)} onMouseLeave={() => setPagesCatOpen(false)}>
                                            <a href="#" className="flex items-center justify-between px-4 py-2 text-sm" style={{ color: "var(--nav-color, #fff)" }} onClick={(e) => e.preventDefault()}>{tCommon("categories")} <span style={{ fontSize: "12px" }}>&#8250;</span></a>
                                            {pagesCatOpen && (
                                                <div style={{ position: "absolute", insetInlineStart: "100%", top: 0, backgroundColor: "var(--solid-white, #222327)", border: "1px solid var(--flex-gray-15, #383838)", minWidth: "200px", padding: "4px 0", maxHeight: "400px", overflowY: "auto", zIndex: 51 }}>
                                                    {PAGES_CATEGORIES.map((c) => (
                                                        <Link key={c.href} href={c.href} className="block px-4 py-2 text-sm hover:bg-[#eb0254] hover:text-white transition-colors" style={{ color: "var(--nav-color, #fff)" }}>{c.label}</Link>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <Link href="/advertise" className="block px-4 py-2 text-sm hover:bg-[#eb0254] hover:text-white transition-colors" style={{ color: "var(--nav-color, #fff)" }}>{tHeader("aboutUs")}</Link>
                                        <Link href="/terms" className="block px-4 py-2 text-sm hover:bg-[#eb0254] hover:text-white transition-colors" style={{ color: "var(--nav-color, #fff)" }}>{tHeader("Terms And Services")}</Link>
                                        <Link href="/contact" className="block px-4 py-2 text-sm hover:bg-[#eb0254] hover:text-white transition-colors" style={{ color: "var(--nav-color, #fff)" }}>{tHeader("contact")}</Link>
                                        <Link href="/privacy" className="block px-4 py-2 text-sm hover:bg-[#eb0254] hover:text-white transition-colors" style={{ color: "var(--nav-color, #fff)" }}>{tCommon("faq")}</Link>
                                    </div>
                                )}
                            </li>
                            <li style={{ borderInlineStart: "1px solid var(--flex-gray-15, rgba(255,255,255,0.1))" }}>
                                <Link href="/advertise" style={navLinkStyle}>{tHeader("aboutUs")}</Link>
                            </li>
                            <li style={{ borderInlineStart: "1px solid var(--flex-gray-15, rgba(255,255,255,0.1))" }}>
                                <Link href="/contact" style={navLinkStyle}>{tHeader("contact")}</Link>
                            </li>
                            <li style={{ borderInlineStart: "1px solid var(--flex-gray-15, rgba(255,255,255,0.1))", borderInlineEnd: "1px solid var(--flex-gray-15, rgba(255,255,255,0.1))" }}>
                                <Link href="/privacy" style={navLinkStyle}>{tCommon("faq")}</Link>
                            </li>
                        </ul>
                        {/* Listen Button - Audio Player */}
                        <ListenButton />
                        {/* Desktop search button */}
                        <button type="button" className="bg-transparent border-0 cursor-pointer" style={{ color: "var(--nav-color, #fff)", fontSize: "17px", height: "38px", width: "38px", padding: 0 }} onClick={() => setSearchOpen(true)}>
                            <i className="fa fa-search"></i>
                        </button>
                    </div>
                </div>
            </nav>

            {/* ═══ LEFT SIDEBAR (reference #sidebar) ═══ */}
            {sidebarOpen && <div className="fixed inset-0 z-[998]" onClick={closeSidebar} style={{ display: "block", width: "100vw", height: "100vh", background: "rgba(0,0,0,0.7)", opacity: 1, transition: "all 0.5s ease-in-out", top: 0, insetInlineStart: 0 }}></div>}
            <nav id="sidebar" style={{
                width: "min(350px, 85vw)",
                position: "fixed",
                top: 0,
                [isRtl ? "right" : "left"]: "0",
                transform: sidebarOpen ? "translateX(0)" : isRtl ? "translateX(100%)" : "translateX(-100%)",
                height: "100vh",
                zIndex: 999,
                background: "var(--solid-white, #222327)",
                color: "var(--body-fcolor, #fff)",
                transition: "all 0.3s",
                overflowY: "auto",
                padding: "16px",
                boxShadow: sidebarOpen ? "3px 3px 3px rgba(0,0,0,0.2)" : "none",
            }}>
                <div style={{ position: "absolute", top: "10px", insetInlineEnd: "10px", width: "35px", height: "35px", lineHeight: "35px", textAlign: "center", background: "#EF4444", cursor: "pointer", transition: "all 0.3s" }} onClick={closeSidebar}>
                    <i className="fas fa-arrow-right" style={{ color: "#fff" }}></i>
                </div>
                <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                    <div>
                        <a href="/" className="inline-block" style={{ margin: "12px 0" }}>
                            <span className="font-black tracking-tight leading-none" style={{ fontSize: "24px" }}>
                                <span style={{ color: "var(--body-fcolor, #fff)" }}>{tHome("brandTrends")}</span><span style={{ color: "#eb0254" }}>{tHome("brandPosts")}</span>
                            </span>
                        </a>
                        <p style={{ color: "var(--meta-fcolor, #aaa)", fontSize: "14px", lineHeight: "1.6", marginTop: "8px" }}>
                            {tHeader("sidebarDescription")}
                        </p>
                    </div>
                    <ul className="flex flex-col" style={{ listStyle: "none", padding: 0, margin: "16px 0" }}>
                        <li style={{ fontSize: "1.125rem" }}><Link href="/" onClick={closeSidebar} className="block py-2 hover:text-[#eb0254] transition-colors" style={{ color: "var(--nav-color, #fff)" }}>{tCommon("home")}</Link></li>
                        <li style={{ fontSize: "1.125rem" }}><Link href="/advertise" onClick={closeSidebar} className="block py-2 hover:text-[#eb0254] transition-colors" style={{ color: "var(--nav-color, #fff)" }}>{tHeader("aboutUs")}</Link></li>
                        <li style={{ fontSize: "1.125rem" }}><Link href="/category/technology" onClick={closeSidebar} className="block py-2 hover:text-[#eb0254] transition-colors" style={{ color: "var(--nav-color, #fff)" }}>{tHeader("ourJournal")}</Link></li>
                        <li style={{ fontSize: "1.125rem" }}><Link href="/contact" onClick={closeSidebar} className="block py-2 hover:text-[#eb0254] transition-colors" style={{ color: "var(--nav-color, #fff)" }}>{tHeader("contact")}</Link></li>
                    </ul>
                    <h5 style={{ color: "var(--heading-color, #fff)", margin: "0 0 20px 0" }}>{tHeader("instagrams")}</h5>
                    <div className="grid grid-cols-2 gap-1">
                        {[1, 2, 3, 4].map(i => (
                            <a key={i} href="#" className="block relative overflow-hidden">
                                <img src={`https://picsum.photos/seed/insta${i}/300/300`} alt="" className="w-full h-auto" />
                            </a>
                        ))}
                    </div>
                    <div className="mt-auto" style={{ paddingBottom: "12px" }}>
                        <p className="font-bold" style={{ marginBottom: "8px" }}>{tHeader("hqLocation")}</p>
                        <address style={{ marginBottom: "8px", fontStyle: "normal" }}>{tHeader("address")}</address>
                        <p style={{ marginBottom: "8px" }}>{tHeader("callLabel")}: <a href="#" className="underline" style={{ color: "var(--nav-color, #fff)" }}>(123) 456-7890</a> ({tHeader("tollFree")})</p>
                        <a href="#" className="block" style={{ color: "var(--nav-color, #fff)" }}>info@example.com</a>
                    </div>
                </div>
            </nav>

            {/* ═══ MOBILE SLIDE-IN MENU ═══ */}
            {isOpen && <div className="fixed inset-0 z-40 md:hidden" onClick={close}><div className="absolute inset-0 bg-black/50"></div></div>}
            <div className={"fixed top-0 h-full w-[280px] max-w-[85vw] z-50 md:hidden transform transition-transform duration-300 " + (isOpen ? "translate-x-0" : "-translate-x-full")} style={{ backgroundColor: "var(--solid-white, #222327)", insetInlineStart: 0 }}>
                <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid var(--flex-gray-15, #383838)" }}>
                    <a href="/" className="font-black text-lg leading-none">
                        <span style={{ color: "#eb0254" }}>Trends</span><span style={{ color: "var(--body-fcolor, #fff)" }}>Posts</span>
                    </a>
                    <button onClick={close} className="bg-transparent border-0 p-0 relative cursor-pointer" style={{ width: "20px", height: "20px" }}>
                        <span className="block w-5 h-[2px] bg-white absolute top-1/2 inset-inline-start-0 -translate-y-1/2 rotate-45"></span>
                        <span className="block w-5 h-[2px] bg-white absolute top-1/2 inset-inline-start-0 -translate-y-1/2 -rotate-45"></span>
                    </button>
                </div>
                <nav className="p-3 space-y-0.5 overflow-y-auto max-h-[calc(100vh-60px)]">
                    <Link href="/" onClick={close} className="block px-3 py-2.5 text-sm font-semibold hover:text-[#eb0254] hover:bg-white/5 rounded transition-all" style={{ color: "var(--nav-color, #fff)" }}>{tCommon("home")}</Link>
                    <Link href="/advertise" onClick={close} className="block px-3 py-2.5 text-sm font-semibold hover:text-[#eb0254] hover:bg-white/5 rounded transition-all" style={{ color: "var(--nav-color, #fff)" }}>{tHeader("aboutUs")}</Link>
                    <Link href="/contact" onClick={close} className="block px-3 py-2.5 text-sm font-semibold hover:text-[#eb0254] hover:bg-white/5 rounded transition-all" style={{ color: "var(--nav-color, #fff)" }}>{tHeader("contact")}</Link>
                    <Link href="/privacy" onClick={close} className="block px-3 py-2.5 text-sm font-semibold hover:text-[#eb0254] hover:bg-white/5 rounded transition-all" style={{ color: "var(--nav-color, #fff)" }}>{tCommon("faq")}</Link>
                    <div style={{ borderTop: "1px solid var(--flex-gray-15, #383838)", margin: "8px 0" }}></div>
                    {PAGES_CATEGORIES.map((c) => (
                        <Link key={c.href} href={c.href} onClick={close} className="block px-3 py-2 text-sm hover:text-[#eb0254] hover:bg-white/5 rounded transition-all" style={{ color: "var(--nav-color, #fff)" }}>{c.label}</Link>
                    ))}
                </nav>
            </div>
        </header>
    );
}
