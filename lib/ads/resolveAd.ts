/**
 * Ad Resolution Utility
 * 
 * Resolves which ad to display for a given page/position with priority:
 * 1. Article-specific override (highest priority)
 * 2. Global article ad (fallback for article pages)
 * 3. null (no ad)
 * 
 * Used by both the /api/ads/resolve endpoint and server-side rendering.
 */

import { connectDB } from "@/lib/db";
import { AdSnippet } from "@/lib/models/AdSnippet";
import { Article } from "@/lib/models/Article";
import { DEPLOYMENT_LOCALE } from "@/lib/i18n";

export interface ResolvedAd {
  _id: string;
  name: string;
  label: string;
  pageType: string;
  position: string;
  enabled: boolean;
  code: string;
  type?: string;
  templateType?: string;
  creativeType?: string;
  mediaUrl?: string;
  url?: string;
  vastTagUrl?: string;
  clickThroughUrl?: string;
  nativeContent?: any;
  trackingPixels?: any;
  appearance?: any;
  [key: string]: any;
}

/**
 * Resolve which ad to display for a given position on an article page.
 * 
 * @param position - The ad position (e.g., "top-leaderboard", "in-content-1")
 * @param articleSlug - Optional article slug to check for overrides
 * @returns The resolved ad or null if no ad should be shown
 */
export async function resolveArticleAd(
  position: string,
  articleSlug?: string
): Promise<ResolvedAd | null> {
  await connectDB();

  // 1. Check for article-specific override (highest priority)
  if (articleSlug) {
    try {
      const article = await Article.findOne({ slug: articleSlug })
        .select({ adOverrides: 1 })
        .lean();
      
      const override = article?.adOverrides?.find(
        (o: any) => o.position === position
      );
      
      if (override?.adSnippetId) {
        const ad = await AdSnippet.findOne({
          _id: override.adSnippetId,
          enabled: true,
          locale: DEPLOYMENT_LOCALE,
        }).lean();
        
        if (ad) return ad as unknown as ResolvedAd;
        // Override exists but ad is disabled or missing — fall through to global
      }
    } catch (err) {
      console.error(`[resolveAd] Failed to resolve override for article=${articleSlug} position=${position}:`, err);
    }
  }

  // 2. Fallback to global article ad
  try {
    const globalAd = await AdSnippet.findOne({
      pageType: "article",
      position,
      enabled: true,
      isArticleOverride: { $ne: true },
      locale: DEPLOYMENT_LOCALE,
    }).lean();
    
    if (globalAd) return globalAd as unknown as ResolvedAd;
  } catch (err) {
    console.error(`[resolveAd] Failed to resolve global ad for position=${position}:`, err);
  }

  // 3. No ad
  return null;
}

/**
 * Resolve which ad to display for a non-article page (homepage, category, website).
 * These pages only have global ads, no per-page overrides.
 */
export async function resolveGlobalAd(
  pageType: string,
  position: string
): Promise<ResolvedAd | null> {
  await connectDB();

  try {
    const ad = await AdSnippet.findOne({
      pageType,
      position,
      enabled: true,
      locale: DEPLOYMENT_LOCALE,
    }).lean();
    
    if (ad) return ad as unknown as ResolvedAd;
  } catch (err) {
    console.error(`[resolveAd] Failed to resolve global ad for pageType=${pageType} position=${position}:`, err);
  }

  return null;
}
