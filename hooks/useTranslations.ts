"use client";

import { useLocale } from "./useLocale";
import en from "@/messages/en.json";
import es from "@/messages/es.json";
import ar from "@/messages/ar.json";

type Messages = Record<string, any>;

const messagesByLocale: Record<string, Messages> = { en, es, ar };

function getMessages(locale: string): Messages {
  return messagesByLocale[locale] || {};
}

function resolveKey(obj: any, path: string): string | undefined {
  const val = path.split(".").reduce((acc, key) => acc?.[key], obj);
  return typeof val === "string" ? val : undefined;
}

export function useTranslations(namespace?: string) {
  const locale = useLocale();
  const messages = getMessages(locale);

  return (key: string): string => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    return resolveKey(messages, fullKey) || resolveKey(messages, key) || key;
  };
}