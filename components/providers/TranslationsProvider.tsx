"use client";

import { createContext, useContext } from "react";
import type { Locale } from "@/lib/i18n";

type TranslationsContextValue = {
  locale: Locale;
  messages: Record<string, any>;
};

const TranslationsContext = createContext<TranslationsContextValue>({
  locale: "en",
  messages: {},
});

export function useTranslationsContext() {
  return useContext(TranslationsContext);
}

export function TranslationsProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Record<string, any>;
  children: React.ReactNode;
}) {
  return (
    <TranslationsContext.Provider value={{ locale, messages }}>
      {children}
    </TranslationsContext.Provider>
  );
}
