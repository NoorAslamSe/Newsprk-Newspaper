"use client";

import { useEffect, type ReactNode } from "react";

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

interface GA4ProviderProps {
  measurementId: string;
  children: ReactNode;
}

export default function GA4Provider({ measurementId, children }: GA4ProviderProps) {
  useEffect(() => {
    if (!measurementId) return;

    // Check consent state
    const consent = document.cookie
      .split("; ")
      .find((c) => c.startsWith("consent_state="));

    const consentGranted = consent?.split("=")[1] === "accepted";

    // Load gtag script
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
      window.dataLayer!.push(args);
    }
    gtag("js", new Date());
    gtag("config", measurementId, {
      anonymize_ip: true,
      cookie_flags: "SameSite=None;Secure",
    });

    // Set default consent state
    gtag("consent", "default", {
      ad_storage: consentGranted ? "granted" : "denied",
      analytics_storage: consentGranted ? "granted" : "denied",
      ad_user_data: consentGranted ? "granted" : "denied",
      ad_personalization: consentGranted ? "granted" : "denied",
    });
  }, [measurementId]);

  return <>{children}</>;
}

// Event helpers for affiliate tracking
export function trackAffiliateClick(comparison: string, clickedItem: string, pageClass?: string) {
  if (typeof window !== "undefined" && window.dataLayer) {
    window.dataLayer.push({
      event: "affiliate_click",
      comparison,
      clicked_item: clickedItem,
      page_class: pageClass || "",
    });
  }
}

export function trackVerdictView(comparison: string) {
  if (typeof window !== "undefined" && window.dataLayer) {
    window.dataLayer.push({
      event: "verdict_view",
      comparison,
    });
  }
}

export function trackNewsletterSignup() {
  if (typeof window !== "undefined" && window.dataLayer) {
    window.dataLayer.push({
      event: "newsletter_signup",
    });
  }
}
