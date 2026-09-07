"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "@/hooks/useTranslations";

interface ConsentBannerProps {
  onAccept?: () => void;
  onDecline?: () => void;
}

export default function ConsentBanner({ onAccept, onDecline }: ConsentBannerProps) {
  const [visible, setVisible] = useState(false);
  const tConsent = useTranslations("consent");

  useEffect(() => {
    // Read cookie from document (client-only)
    const consent = document.cookie
      .split("; ")
      .find((c) => c.startsWith("consent_state="));
    if (!consent) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
    }
  }, []);

  const logConsent = useCallback(async (state: "accepted" | "declined") => {
    try {
      await fetch("/api/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consentState: state }),
      });
    } catch {
      // Non-critical — consent logging failure should not block the user
    }
  }, []);

  const handleAccept = useCallback(() => {
    document.cookie = "consent_state=accepted; path=/; max-age=31536000; SameSite=Lax";
    setVisible(false);
    logConsent("accepted");
    onAccept?.();
  }, [logConsent, onAccept]);

  const handleDecline = useCallback(() => {
    document.cookie = "consent_state=declined; path=/; max-age=31536000; SameSite=Lax";
    setVisible(false);
    logConsent("declined");
    onDecline?.();
  }, [logConsent, onDecline]);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] border-t border-zinc-800 bg-zinc-950/98 p-4 backdrop-blur-md md:p-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 text-sm text-zinc-400">
          <p className="mb-1 font-medium text-white">{tConsent("title")}</p>
          <p>
            {tConsent("description")}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleDecline}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            {tConsent("decline")}
          </button>
          <button
            onClick={handleAccept}
            className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-indigo-500"
          >
            {tConsent("acceptAll")}
          </button>
        </div>
      </div>
    </div>
  );
}
