"use server";

/**
 * Fetches social link settings from the DB.
 * Uses a primary → legacy key → hardcoded default fallback chain
 * so the site never renders broken links even with an empty DB.
 */

import { connectDB } from "@/lib/db";
import { Setting } from "@/lib/models/Setting";

export async function getSocialSettingsAction() {
  try {
    await connectDB();
    
    // 1. Prefer modern unified 'site' key (set by the dashboard settings page)
    const siteSetting = await Setting.findOne({ key: "site" });
    if (siteSetting?.value?.socialLinks) {
      return { success: true, data: siteSetting.value.socialLinks };
    }

    // 2. Fall back to legacy standalone key for backward compatibility
    const legacySetting = await Setting.findOne({ key: "social_links" });
    
    // 3. Hardcoded defaults ensure the widget always renders even with a fresh DB
    const defaultSocials = [
      { name: "Facebook", count: "125K", label: "Fans", network: "facebook", url: "https://Trendsposts.com" },
      { name: "Twitter", count: "89K", label: "Followers", network: "twitter", url: "https://Trendsposts.com" },
      { name: "YouTube", count: "1.2M", label: "Subscribers", network: "youtube", url: "https://Trendsposts.com" },
      { name: "Instagram", count: "550K", label: "Followers", network: "instagram", url: "https://Trendsposts.com" },
    ];

    if (!legacySetting) {
      return { success: true, data: defaultSocials };
    }

    return { success: true, data: legacySetting.value || defaultSocials };
  } catch (error) {
    console.error("Social settings fetch error:", error);
    return { success: false, error: "Failed to fetch social links" };
  }
}
