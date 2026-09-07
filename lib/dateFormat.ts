import { DEPLOYMENT_LOCALE } from "./i18n";
import type { Locale } from "./i18n";

const LOCALE_DATE_LOCALES: Record<Locale, string> = {
  en: "en-US",
  es: "es-ES",
  ar: "ar-SA",
};

export function formatDate(
  dateStr: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = new Date(dateStr);
  const localeStr = LOCALE_DATE_LOCALES[DEPLOYMENT_LOCALE] || "en-US";
  return date.toLocaleDateString(
    localeStr,
    options || { month: "short", day: "numeric", year: "numeric" }
  );
}

export function formatFullDate(dateStr: string): string {
  return formatDate(dateStr, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
