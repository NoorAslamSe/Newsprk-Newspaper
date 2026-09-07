/**
 * IAB Standard Ad Sizes & Container Configuration
 * Reference: https://www.dimensions.com/element/medium-rectangle-ad-300-x-250
 *
 * Container sizes are 20px larger than creatives (10px padding each side)
 * to allow user adjustment within the slot.
 */

export interface AdSizePreset {
  /** Human-readable name */
  name: string;
  /** IAB standard name */
  iabName: string;
  /** Creative width in px */
  width: number;
  /** Creative height in px */
  height: number;
  /** Container width (creative + 20px) */
  containerWidth: number;
  /** Container height (creative + 20px) */
  containerHeight: number;
  /** Category for grouping (banner, rectangle, skyscraper, mobile, billboard) */
  category: "banner" | "rectangle" | "skyscraper" | "mobile" | "billboard" | "native";
  /** Aspect ratio string */
  aspectRatio: string;
  /** Whether this size is recommended for mobile viewports */
  mobileCompatible: boolean;
  /** Whether this size is recommended for tablet viewports */
  tabletCompatible: boolean;
  /** Description / common use case */
  description: string;
}

export const AD_SIZE_PRESETS: AdSizePreset[] = [
  // ─── Rectangles ─────────────────────────────────────
  {
    name: "Medium Rectangle",
    iabName: "Medium Rectangle",
    width: 300,
    height: 250,
    containerWidth: 320,
    containerHeight: 270,
    category: "rectangle",
    aspectRatio: "6:5",
    mobileCompatible: true,
    tabletCompatible: true,
    description: "Most popular ad unit; works in-content, sidebar, and feeds",
  },
  {
    name: "Large Rectangle",
    iabName: "Large Rectangle",
    width: 336,
    height: 280,
    containerWidth: 356,
    containerHeight: 300,
    category: "rectangle",
    aspectRatio: "6:5",
    mobileCompatible: true,
    tabletCompatible: true,
    description: "Slightly larger format for premium content placements",
  },
  {
    name: "Square",
    iabName: "Square",
    width: 250,
    height: 250,
    containerWidth: 270,
    containerHeight: 270,
    category: "rectangle",
    aspectRatio: "1:1",
    mobileCompatible: true,
    tabletCompatible: true,
    description: "Standard square ad ideal for sidebar and in-feed positions",
  },
  {
    name: "Small Square",
    iabName: "Small Square",
    width: 200,
    height: 200,
    containerWidth: 220,
    containerHeight: 220,
    category: "rectangle",
    aspectRatio: "1:1",
    mobileCompatible: true,
    tabletCompatible: true,
    description: "Compact square unit for tight spaces",
  },

  // ─── Banners ────────────────────────────────────────
  {
    name: "Leaderboard",
    iabName: "Leaderboard",
    width: 728,
    height: 90,
    containerWidth: 748,
    containerHeight: 110,
    category: "banner",
    aspectRatio: "8:1",
    mobileCompatible: false,
    tabletCompatible: true,
    description: "Classic top-of-page banner; highest visibility on desktop",
  },
  {
    name: "Full Banner",
    iabName: "Full Banner",
    width: 468,
    height: 60,
    containerWidth: 488,
    containerHeight: 80,
    category: "banner",
    aspectRatio: "8:1",
    mobileCompatible: false,
    tabletCompatible: true,
    description: "Traditional banner format for mid-page placements",
  },
  {
    name: "Half Banner",
    iabName: "Half Banner",
    width: 234,
    height: 60,
    containerWidth: 254,
    containerHeight: 80,
    category: "banner",
    aspectRatio: "4:1",
    mobileCompatible: true,
    tabletCompatible: true,
    description: "Compact banner for inline use",
  },
  {
    name: "Large Leaderboard",
    iabName: "Large Leaderboard",
    width: 970,
    height: 90,
    containerWidth: 990,
    containerHeight: 110,
    category: "banner",
    aspectRatio: "11:1",
    mobileCompatible: false,
    tabletCompatible: false,
    description: "Extra-wide top-of-page leaderboard for wide desktop layouts",
  },

  // ─── Billboards ─────────────────────────────────────
  {
    name: "Billboard",
    iabName: "Billboard",
    width: 970,
    height: 250,
    containerWidth: 990,
    containerHeight: 270,
    category: "billboard",
    aspectRatio: "4:1",
    mobileCompatible: false,
    tabletCompatible: false,
    description: "High-impact takeover ad for premium campaigns",
  },

  // ─── Skyscrapers ────────────────────────────────────
  {
    name: "Half Page / Large Skyscraper",
    iabName: "Half Page Ad",
    width: 300,
    height: 600,
    containerWidth: 320,
    containerHeight: 620,
    category: "skyscraper",
    aspectRatio: "1:2",
    mobileCompatible: false,
    tabletCompatible: true,
    description: "High-profile sidebar ad; strong viewability metrics",
  },
  {
    name: "Wide Skyscraper",
    iabName: "Wide Skyscraper",
    width: 160,
    height: 600,
    containerWidth: 180,
    containerHeight: 620,
    category: "skyscraper",
    aspectRatio: "4:15",
    mobileCompatible: false,
    tabletCompatible: false,
    description: "Standard sidebar skyscraper",
  },
  {
    name: "Skyscraper",
    iabName: "Skyscraper",
    width: 120,
    height: 600,
    containerWidth: 140,
    containerHeight: 620,
    category: "skyscraper",
    aspectRatio: "1:5",
    mobileCompatible: false,
    tabletCompatible: false,
    description: "Narrow sidebar skyscraper",
  },

  // ─── Mobile ─────────────────────────────────────────
  {
    name: "Mobile Banner",
    iabName: "Mobile Banner",
    width: 320,
    height: 50,
    containerWidth: 340,
    containerHeight: 70,
    category: "mobile",
    aspectRatio: "32:5",
    mobileCompatible: true,
    tabletCompatible: true,
    description: "Standard mobile top/bottom banner",
  },
  {
    name: "Large Mobile Banner",
    iabName: "Large Mobile Banner",
    width: 320,
    height: 100,
    containerWidth: 340,
    containerHeight: 120,
    category: "mobile",
    aspectRatio: "16:5",
    mobileCompatible: true,
    tabletCompatible: true,
    description: "Double-height mobile banner for more creative room",
  },
  {
    name: "Mobile Interstitial",
    iabName: "Mobile Interstitial",
    width: 320,
    height: 480,
    containerWidth: 340,
    containerHeight: 500,
    category: "mobile",
    aspectRatio: "2:3",
    mobileCompatible: true,
    tabletCompatible: true,
    description: "Full-screen mobile interstitial ad",
  },

  // ─── Native ─────────────────────────────────────────
  {
    name: "Native Feed Ad",
    iabName: "Native",
    width: 360,
    height: 400,
    containerWidth: 380,
    containerHeight: 420,
    category: "native",
    aspectRatio: "16:10",
    mobileCompatible: true,
    tabletCompatible: true,
    description: "Responsive native ad that matches the website article card style",
  },
];

/**
 * Get all size presets for a given category
 */
export function getPresetsByCategory(category: AdSizePreset["category"]): AdSizePreset[] {
  return AD_SIZE_PRESETS.filter((p) => p.category === category);
}

/**
 * Get all mobile-compatible sizes
 */
export function getMobileCompatiblePresets(): AdSizePreset[] {
  return AD_SIZE_PRESETS.filter((p) => p.mobileCompatible);
}

/**
 * Get all tablet-compatible sizes
 */
export function getTabletCompatiblePresets(): AdSizePreset[] {
  return AD_SIZE_PRESETS.filter((p) => p.tabletCompatible);
}

/**
 * Find a preset that matches the given dimensions
 */
export function findMatchingPreset(width: number, height: number): AdSizePreset | undefined {
  return AD_SIZE_PRESETS.find((p) => p.width === width && p.height === height);
}

/**
 * Determine if creative dimensions fit within a given container
 */
export function getCreativeFitStatus(
  creativeWidth: number,
  creativeHeight: number,
  containerWidth: number,
  containerHeight: number
): "within-bounds" | "oversized" | "undersized" {
  if (creativeWidth > containerWidth || creativeHeight > containerHeight) {
    return "oversized";
  }
  // If creative is less than 50% of container in either dimension, it's undersized
  if (creativeWidth < containerWidth * 0.5 || creativeHeight < containerHeight * 0.5) {
    return "undersized";
  }
  return "within-bounds";
}

/**
 * Check responsive fit: does the creative fit on each viewport?
 * Returns errors/warnings for viewports where it doesn't fit.
 */
export interface ResponsiveFitResult {
  desktop: { fits: boolean; message: string };
  tablet: { fits: boolean; message: string };
  mobile: { fits: boolean; message: string };
}

export function checkResponsiveFit(
  creativeWidth: number,
  creativeHeight: number,
  selectedPreset?: AdSizePreset
): ResponsiveFitResult {
  const DESKTOP_MAX_WIDTH = 1200;
  const TABLET_MAX_WIDTH = 768;
  const MOBILE_MAX_WIDTH = 480;

  const fitsDesktop = creativeWidth <= DESKTOP_MAX_WIDTH;
  const fitsTablet = creativeWidth <= TABLET_MAX_WIDTH;
  const fitsMobile = creativeWidth <= MOBILE_MAX_WIDTH;

  return {
    desktop: {
      fits: fitsDesktop,
      message: fitsDesktop
        ? "Creative fits desktop viewport"
        : `Creative is ${creativeWidth - DESKTOP_MAX_WIDTH}px wider than maximum desktop width`,
    },
    tablet: {
      fits: fitsTablet,
      message: fitsTablet
        ? "Creative fits tablet viewport"
        : selectedPreset?.tabletCompatible === false
        ? "This ad size is not recommended for tablets. Consider a mobile-compatible size."
        : `Creative (${creativeWidth}px) exceeds tablet viewport (${TABLET_MAX_WIDTH}px). It will be auto-scaled or you should choose a smaller size.`,
    },
    mobile: {
      fits: fitsMobile,
      message: fitsMobile
        ? "Creative fits mobile viewport"
        : selectedPreset?.mobileCompatible === false
        ? "This ad size is not recommended for mobile. Use a mobile-specific size (320×50 or 320×100)."
        : `Creative (${creativeWidth}px) exceeds mobile viewport (${MOBILE_MAX_WIDTH}px). Auto-scaling will be applied.`,
    },
  };
}

/**
 * Position-specific size configuration with expanded real-world presets
 * Each position has recommended sizes and container dimensions set 20px larger
 */
export const POSITION_SIZE_CONFIG: Record<
  string,
  {
    desktop: { width: number; height: number };
    tablet: { width: number; height: number };
    mobile: { width: number; height: number };
    containerDesktop: { width: number; height: number };
    containerTablet: { width: number; height: number };
    containerMobile: { width: number; height: number };
    label: string;
    recommendedPresets: string[]; // names from AD_SIZE_PRESETS
  }
> = {
  "header-leaderboard": {
    desktop: { width: 728, height: 90 },
    tablet: { width: 468, height: 60 },
    mobile: { width: 320, height: 50 },
    containerDesktop: { width: 748, height: 110 },
    containerTablet: { width: 488, height: 80 },
    containerMobile: { width: 340, height: 70 },
    label: "Desktop 728×90 / Tablet 468×60 / Mobile 320×50",
    recommendedPresets: ["Leaderboard", "Full Banner", "Mobile Banner"],
  },
  "top-leaderboard": {
    desktop: { width: 728, height: 90 },
    tablet: { width: 468, height: 60 },
    mobile: { width: 320, height: 50 },
    containerDesktop: { width: 748, height: 110 },
    containerTablet: { width: 488, height: 80 },
    containerMobile: { width: 340, height: 70 },
    label: "Desktop 728×90 / Tablet 468×60 / Mobile 320×50",
    recommendedPresets: ["Leaderboard", "Full Banner", "Mobile Banner"],
  },
  "sticky-footer": {
    desktop: { width: 728, height: 90 },
    tablet: { width: 468, height: 60 },
    mobile: { width: 320, height: 50 },
    containerDesktop: { width: 748, height: 110 },
    containerTablet: { width: 488, height: 80 },
    containerMobile: { width: 340, height: 70 },
    label: "Desktop 728×90 / Tablet 468×60 / Mobile 320×50",
    recommendedPresets: ["Leaderboard", "Full Banner", "Mobile Banner"],
  },
  "in-feed-1": {
    desktop: { width: 360, height: 400 },
    tablet: { width: 320, height: 380 },
    mobile: { width: 320, height: 380 },
    containerDesktop: { width: 380, height: 420 },
    containerTablet: { width: 340, height: 400 },
    containerMobile: { width: 340, height: 400 },
    label: "Native Responsive (Matches Card Style)",
    recommendedPresets: ["Native Feed Ad", "Medium Rectangle", "Large Rectangle"],
  },
  "in-feed-2": {
    desktop: { width: 360, height: 400 },
    tablet: { width: 320, height: 380 },
    mobile: { width: 320, height: 380 },
    containerDesktop: { width: 380, height: 420 },
    containerTablet: { width: 340, height: 400 },
    containerMobile: { width: 340, height: 400 },
    label: "Native Responsive (Matches Card Style)",
    recommendedPresets: ["Native Feed Ad", "Medium Rectangle", "Large Rectangle"],
  },
  "in-feed-x": {
    desktop: { width: 360, height: 400 },
    tablet: { width: 320, height: 380 },
    mobile: { width: 320, height: 380 },
    containerDesktop: { width: 380, height: 420 },
    containerTablet: { width: 340, height: 400 },
    containerMobile: { width: 340, height: 400 },
    label: "Native Responsive (Matches Card Style)",
    recommendedPresets: ["Native Feed Ad", "Medium Rectangle", "Large Rectangle"],
  },
  "in-feed-3": {
    desktop: { width: 360, height: 400 },
    tablet: { width: 320, height: 380 },
    mobile: { width: 320, height: 380 },
    containerDesktop: { width: 380, height: 420 },
    containerTablet: { width: 340, height: 400 },
    containerMobile: { width: 340, height: 400 },
    label: "Featured Carousel — Native Responsive",
    recommendedPresets: ["Native Feed Ad", "Medium Rectangle", "Large Rectangle"],
  },
  "in-feed-4": {
    desktop: { width: 360, height: 400 },
    tablet: { width: 320, height: 380 },
    mobile: { width: 320, height: 380 },
    containerDesktop: { width: 380, height: 420 },
    containerTablet: { width: 340, height: 400 },
    containerMobile: { width: 340, height: 400 },
    label: "Hero Slider — Native Responsive",
    recommendedPresets: ["Native Feed Ad", "Medium Rectangle", "Large Rectangle"],
  },
  "in-feed-5": {
    desktop: { width: 240, height: 160 },
    tablet: { width: 220, height: 150 },
    mobile: { width: 220, height: 150 },
    containerDesktop: { width: 260, height: 180 },
    containerTablet: { width: 240, height: 170 },
    containerMobile: { width: 240, height: 170 },
    label: "Top Stories Sidebar — List Native",
    recommendedPresets: ["Native Feed Ad", "Medium Rectangle"],
  },
  "in-feed-6": {
    desktop: { width: 240, height: 160 },
    tablet: { width: 220, height: 150 },
    mobile: { width: 220, height: 150 },
    containerDesktop: { width: 260, height: 180 },
    containerTablet: { width: 240, height: 170 },
    containerMobile: { width: 240, height: 170 },
    label: "Most Viewed Sidebar — List Native",
    recommendedPresets: ["Native Feed Ad", "Medium Rectangle"],
  },
  "in-feed-7": {
    desktop: { width: 240, height: 160 },
    tablet: { width: 220, height: 150 },
    mobile: { width: 220, height: 150 },
    containerDesktop: { width: 260, height: 180 },
    containerTablet: { width: 240, height: 170 },
    containerMobile: { width: 240, height: 170 },
    label: "Popular News Sidebar — List Native",
    recommendedPresets: ["Native Feed Ad", "Medium Rectangle"],
  },
  "in-feed-8": {
    desktop: { width: 240, height: 160 },
    tablet: { width: 220, height: 150 },
    mobile: { width: 220, height: 150 },
    containerDesktop: { width: 260, height: 180 },
    containerTablet: { width: 240, height: 170 },
    containerMobile: { width: 240, height: 170 },
    label: "Tech & Innovation Sidebar — List Native",
    recommendedPresets: ["Native Feed Ad", "Medium Rectangle"],
  },
  "in-feed-9": {
    desktop: { width: 240, height: 160 },
    tablet: { width: 220, height: 150 },
    mobile: { width: 220, height: 150 },
    containerDesktop: { width: 260, height: 180 },
    containerTablet: { width: 240, height: 170 },
    containerMobile: { width: 240, height: 170 },
    label: "Editor's Picks Sidebar — List Native",
    recommendedPresets: ["Native Feed Ad", "Medium Rectangle"],
  },
  "in-feed-10": {
    desktop: { width: 360, height: 400 },
    tablet: { width: 320, height: 380 },
    mobile: { width: 320, height: 380 },
    containerDesktop: { width: 380, height: 420 },
    containerTablet: { width: 340, height: 400 },
    containerMobile: { width: 340, height: 400 },
    label: "Latest Articles Center — Native Responsive",
    recommendedPresets: ["Native Feed Ad", "Medium Rectangle", "Large Rectangle"],
  },
  "in-feed-11": {
    desktop: { width: 240, height: 160 },
    tablet: { width: 220, height: 150 },
    mobile: { width: 220, height: 150 },
    containerDesktop: { width: 260, height: 180 },
    containerTablet: { width: 240, height: 170 },
    containerMobile: { width: 240, height: 170 },
    label: "Latest Reviews Sidebar — List Native",
    recommendedPresets: ["Native Feed Ad", "Medium Rectangle"],
  },
  "in-feed-12": {
    desktop: { width: 240, height: 160 },
    tablet: { width: 220, height: 150 },
    mobile: { width: 160, height: 120 },
    containerDesktop: { width: 260, height: 180 },
    containerTablet: { width: 240, height: 170 },
    containerMobile: { width: 180, height: 140 },
    label: "Featured Carousel — Inline Slide",
    recommendedPresets: ["Native Feed Ad", "Small Rectangle", "Medium Rectangle"],
  },
  "in-feed-13": {
    desktop: { width: 336, height: 280 },
    tablet: { width: 300, height: 250 },
    mobile: { width: 300, height: 250 },
    containerDesktop: { width: 356, height: 300 },
    containerTablet: { width: 320, height: 270 },
    containerMobile: { width: 320, height: 270 },
    label: "Hero Slider — Side Card Native",
    recommendedPresets: ["Native Feed Ad", "Medium Rectangle", "Large Rectangle"],
  },
  "in-feed-14": {
    desktop: { width: 336, height: 520 },
    tablet: { width: 300, height: 420 },
    mobile: { width: 300, height: 280 },
    containerDesktop: { width: 356, height: 540 },
    containerTablet: { width: 320, height: 440 },
    containerMobile: { width: 320, height: 300 },
    label: "Hero Slider — Center Mid Native",
    recommendedPresets: ["Native Feed Ad", "Medium Rectangle", "Large Rectangle"],
  },
  "in-feed-15": {
    desktop: { width: 336, height: 280 },
    tablet: { width: 300, height: 250 },
    mobile: { width: 300, height: 250 },
    containerDesktop: { width: 356, height: 300 },
    containerTablet: { width: 320, height: 270 },
    containerMobile: { width: 320, height: 270 },
    label: "Hero Slider — Left Side Native",
    recommendedPresets: ["Native Feed Ad", "Medium Rectangle", "Large Rectangle"],
  },
  "atf-rectangle": {
    desktop: { width: 300, height: 250 },
    tablet: { width: 300, height: 250 },
    mobile: { width: 300, height: 250 },
    containerDesktop: { width: 320, height: 270 },
    containerTablet: { width: 320, height: 270 },
    containerMobile: { width: 320, height: 270 },
    label: "Desktop 300×250 / Tablet/Mobile 300×250",
    recommendedPresets: ["Medium Rectangle", "Large Rectangle", "Square"],
  },
  "in-content-1": {
    desktop: { width: 336, height: 280 },
    tablet: { width: 300, height: 250 },
    mobile: { width: 300, height: 250 },
    containerDesktop: { width: 356, height: 300 },
    containerTablet: { width: 320, height: 270 },
    containerMobile: { width: 320, height: 270 },
    label: "Desktop 336×280 / Tablet/Mobile 300×250",
    recommendedPresets: ["Large Rectangle", "Medium Rectangle"],
  },
  "in-content-2": {
    desktop: { width: 300, height: 250 },
    tablet: { width: 300, height: 250 },
    mobile: { width: 300, height: 250 },
    containerDesktop: { width: 320, height: 270 },
    containerTablet: { width: 320, height: 270 },
    containerMobile: { width: 320, height: 270 },
    label: "Desktop 300×250 / Tablet/Mobile 300×250",
    recommendedPresets: ["Medium Rectangle", "Large Rectangle"],
  },
  "sidebar-sticky": {
    desktop: { width: 300, height: 600 },
    tablet: { width: 300, height: 250 },
    mobile: { width: 300, height: 250 },
    containerDesktop: { width: 300, height: 600 },
    containerTablet: { width: 300, height: 250 },
    containerMobile: { width: 300, height: 250 },
    label: "Desktop 300×600 / Tablet/Mobile 300×250",
    recommendedPresets: ["Half Page / Large Skyscraper", "Medium Rectangle"],
  },
  "sidebar-infeed": {
    desktop: { width: 300, height: 250 },
    tablet: { width: 300, height: 250 },
    mobile: { width: 300, height: 250 },
    containerDesktop: { width: 300, height: 250 },
    containerTablet: { width: 300, height: 250 },
    containerMobile: { width: 300, height: 250 },
    label: "Sidebar In-Feed Native Ad (300×250)",
    recommendedPresets: ["Native Feed Ad", "Medium Rectangle"],
  },
  "bottom-leaderboard": {
    desktop: { width: 728, height: 90 },
    tablet: { width: 468, height: 60 },
    mobile: { width: 320, height: 50 },
    containerDesktop: { width: 748, height: 110 },
    containerTablet: { width: 488, height: 80 },
    containerMobile: { width: 340, height: 70 },
    label: "Desktop 728×90 / Tablet 468×60 / Mobile 320×50",
    recommendedPresets: ["Leaderboard", "Full Banner", "Mobile Banner"],
  },
  "video-section": {
    desktop: { width: 860, height: 484 },
    tablet: { width: 640, height: 360 },
    mobile: { width: 320, height: 180 },
    containerDesktop: { width: 1920, height: 1080 },
    containerTablet: { width: 1280, height: 720 },
    containerMobile: { width: 640, height: 360 },
    label: "Desktop 860×484 / Tablet 640×360 / Mobile 320×180 (16:9 Video)",
    recommendedPresets: ["VAST Video Ad"],
  },
};
