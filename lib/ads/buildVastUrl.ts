/**
 * buildVastUrl — Server-side VAST macro replacement engine.
 *
 * Ad providers (e.g. MonetizeMatrix) supply VAST tag URLs containing
 * `[replace_me]` placeholders (macros).  This module resolves every
 * macro at request-time using server-derived values (IP, UA, etc.)
 * so the final URL reaching the IMA SDK is clean and ready.
 *
 * Design principles:
 *   - **No unresolved macros** — every `[replace_me]` is replaced or removed.
 *   - **Server-first** — IP and UA come from request headers, not the client.
 *   - **Extensible** — add new named macros by extending `MACRO_MAP`.
 *   - **Safe** — all values are URI-encoded; failures return `null`.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Client-side visitor data object.
 *
 * Collected on the browser when a visitor views or interacts with an ad.
 * Contains all the values needed to populate SSP/VAST macro placeholders.
 */
export interface VisitorData {
  /** Full URL of the page where the ad is being served. */
  url: string;
  /** Browser User-Agent string. */
  ua: string;
  /** Visitor's public IP address (fetched from /api/visitor-ip). */
  uip: string;
  /** Ad container width in pixels. */
  width: number;
  /** Ad container height in pixels. */
  height: number;
  /** Cache-buster — unique per request (timestamp + random). */
  cb: string;
}

/** Values gathered from the incoming HTTP request + ad slot config. */
export interface VastMacroContext {
  /** Full URL of the page where the ad renders (Referer header or explicit). */
  pageUrl: string;
  /** Raw User-Agent header string. */
  userAgent: string;
  /** Visitor IP from x-forwarded-for / x-real-ip / socket. */
  userIp: string;
  /** Ad container width in pixels (from slot sizing config). */
  width: number;
  /** Ad container height in pixels (from slot sizing config). */
  height: number;
  /** Cache-buster value — auto-generated if omitted. */
  cacheBuster?: string;

  // ── Optional enrichment (parsed from UA or passed explicitly) ──
  /** e.g. "iPhone 15 Pro", "SM-S918B", "Pixel 8" */
  deviceModel?: string;
  /** e.g. "Apple", "Samsung", "Google" */
  deviceMake?: string;
  /** "desktop" | "tablet" | "mobile" — derived from viewport or UA */
  deviceCategory?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a deterministic map from query-parameter *name* → resolved value.
 * Only parameters whose placeholder is literally `[replace_me]` are touched;
 * fixed values (like `aid=979338`) pass through untouched.
 */
function buildMacroMap(ctx: VastMacroContext): Record<string, string> {
  const cb = ctx.cacheBuster ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    site_full_url: ctx.pageUrl,
    ua:            ctx.userAgent,
    uip:           ctx.userIp,
    width:         String(ctx.width),
    height:        String(ctx.height),
    cb:            cb,

    // Optional enrichment — safe to leave empty
    app_name:         "",            // Web app — not applicable
    app_bundle:       "",            // Web app — not applicable
    app_store_url:    "",            // Web app — not applicable
    device_model:     ctx.deviceModel ?? "",
    device_make:      ctx.deviceMake ?? "",
    device_category:  ctx.deviceCategory ?? "",
    device_id:        "",            // Web — no GAID/IDFA
    vast_version:     "2",           // MonetizeMatrix default
  };
}

/**
 * Detect simple device category from User-Agent string.
 * Used as a fallback when `deviceCategory` is not explicitly provided.
 */
function detectDeviceCategory(ua: string): "mobile" | "tablet" | "desktop" {
  const lower = ua.toLowerCase();
  if (/tablet|ipad|playbook|silk/i.test(lower)) return "tablet";
  if (/mobile|iphone|ipod|opera mini|iemobile/i.test(lower)) return "mobile";
  // Android devices with a Build ID but without "mobile" keyword — still phones
  if (/android/i.test(lower)) return "mobile";
  return "desktop";
}

/**
 * Attempt to extract device make/model from a User-Agent string.
 * This is best-effort — ad providers don't expect perfection here.
 */
function parseDeviceInfo(ua: string): { make: string; model: string } {
  // iOS devices
  const iosMatch = ua.match(/\((iPhone|iPad|iPod)[^)]*\)/);
  if (iosMatch) {
    return { make: "Apple", model: iosMatch[1] };
  }

  // Android devices — "Android X.X; <Make> <Model> Build/"
  const androidMatch = ua.match(/Android\s[\d.]+;\s*([^;)]+?)(?:\s+Build\/|\))/);
  if (androidMatch) {
    const parts = androidMatch[1].trim().split(/\s+/);
    return {
      make: parts[0] || "",
      model: parts.slice(1).join(" ") || parts[0] || "",
    };
  }

  return { make: "", model: "" };
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Replace all `[replace_me]` macros in a VAST template URL.
 *
 * The function works by parsing the URL, iterating over every query parameter,
 * and replacing any `[replace_me]` value with the corresponding resolved value
 * from `VastMacroContext`.
 *
 * @param template  — The raw VAST URL template (e.g. from `vastTagUrl` field)
 * @param context   — Server-derived values for macro resolution
 * @returns Fully resolved URL, or `null` if the template is invalid / empty.
 *
 * @example
 * ```ts
 * const resolved = buildVastUrl(
 *   "https://s.ssp.monetizematrix.com/?site_full_url=[replace_me]&ua=[replace_me]&aid=979338",
 *   { pageUrl: "https://Trendsposts.com/article/x", userAgent: "Mozilla/5.0...", ... }
 * );
 * // => "https://s.ssp.monetizematrix.com/?site_full_url=https%3A%2F%2FTrendsposts.com%2Farticle%2Fx&ua=Mozilla%2F5.0...&aid=979338"
 * ```
 */
export function buildVastUrl(
  template: string,
  context: VastMacroContext,
): string | null {
  try {
    if (!template || template.trim() === "") return null;

    // Enrich context with UA-derived values when not explicitly provided
    if (!context.deviceCategory) {
      context.deviceCategory = detectDeviceCategory(context.userAgent);
    }
    if (!context.deviceModel || !context.deviceMake) {
      const info = parseDeviceInfo(context.userAgent);
      if (!context.deviceMake)  context.deviceMake  = info.make;
      if (!context.deviceModel) context.deviceModel = info.model;
    }

    const macroMap = buildMacroMap(context);

    // Parse URL and resolve each [replace_me] parameter
    const url = new URL(template);

    for (const [key, value] of Array.from(url.searchParams.entries())) {
      if (value === "[replace_me]") {
        const resolved = macroMap[key];
        if (resolved !== undefined) {
          url.searchParams.set(key, resolved);
        } else {
          // Unknown macro key — clear it rather than leave [replace_me]
          url.searchParams.set(key, "");
        }
      }
    }

    const finalUrl = url.toString();

    // Safety check — ensure no unresolved macros remain
    if (finalUrl.includes("[replace_me]")) {
      console.warn("[buildVastUrl] Unresolved macros detected after build:", finalUrl);
      // Force-clean any remaining
      return finalUrl.replace(/\[replace_me\]/g, "");
    }

    return finalUrl;
  } catch (error) {
    console.error("[buildVastUrl] Failed to build VAST URL:", error);
    return null;
  }
}

/**
 * Check whether a VAST tag URL contains unresolved macros.
 * Useful for deciding whether to call `buildVastUrl`.
 */
export function hasUnresolvedMacros(url: string): boolean {
  return url.includes("[replace_me]");
}

/**
 * Build a VastMacroContext from a Next.js Request object + slot config.
 * This is the primary way to create context in API route handlers.
 */
export function contextFromRequest(
  req: Request,
  slotWidth: number,
  slotHeight: number,
): VastMacroContext {
  const headers = new Headers(req.headers);

  // IP resolution — try common proxy headers first
  const ip =
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    "0.0.0.0";

  const ua = headers.get("user-agent") || "";
  const referer = headers.get("referer") || headers.get("origin") || "";

  return {
    pageUrl: referer,
    userAgent: ua,
    userIp: ip,
    width: slotWidth,
    height: slotHeight,
  };
}

// ---------------------------------------------------------------------------
// Client-side helpers  (VisitorData-based)
// ---------------------------------------------------------------------------

/**
 * Build a VisitorData object from the current browser environment.
 *
 * Call this on the client (e.g. inside a React component or event handler)
 * to collect all the data points SSP providers expect.
 *
 * @param visitorIp  — IP address previously fetched from `/api/visitor-ip`
 * @param width      — Ad slot width in pixels
 * @param height     — Ad slot height in pixels
 */
export function buildVisitorData(
  visitorIp: string,
  width: number,
  height: number,
): VisitorData {
  return {
    url:    typeof window !== "undefined" ? window.location.href : "",
    ua:     typeof navigator !== "undefined" ? navigator.userAgent : "",
    uip:    visitorIp || "",
    width,
    height,
    cb:     `${Date.now()}-${Math.floor(Math.random() * 1_000_000_000)}`,
  };
}

/**
 * Build a fully-resolved SSP / VAST request URL from a template and
 * a `VisitorData` object.
 *
 * Replaces every `[replace_me]` placeholder in the template's query
 * parameters with the matching value from `visitorData`.
 * Fixed parameters (like `aid=979338`) pass through untouched.
 *
 * Also handles common bracket macros: [cb], [cachebuster], [timestamp],
 * [url], [page_url], [ua], [uip], [width], [height].
 *
 * @param template     — The raw SSP/VAST URL template containing `[replace_me]` values.
 * @param visitorData  — Visitor data collected client-side.
 * @returns Fully-resolved URL string, or `null` if the template is invalid.
 *
 * @example
 * ```ts
 * const data = buildVisitorData("203.0.113.42", 728, 90);
 * const url  = buildSspRequestUrl(
 *   "https://s.ssp.monetizematrix.com/?site_full_url=[replace_me]&ua=[replace_me]&uip=[replace_me]&width=[replace_me]&height=[replace_me]&cb=[replace_me]&aid=979338",
 *   data
 * );
 * ```
 */
export function buildSspRequestUrl(
  template: string,
  visitorData: VisitorData,
): string | null {
  try {
    if (!template || template.trim() === "") return null;

    // Map SSP query-parameter names to visitor data values
    const macroMap: Record<string, string> = {
      site_full_url: visitorData.url,
      ua:            visitorData.ua,
      uip:           visitorData.uip,
      width:         String(visitorData.width),
      height:        String(visitorData.height),
      cb:            visitorData.cb,
      // Common aliases
      page_url:      visitorData.url,
      url:           visitorData.url,
      cachebuster:   visitorData.cb,
      timestamp:     String(Date.now()),
    };

    const url = new URL(template);

    for (const [key, value] of Array.from(url.searchParams.entries())) {
      if (value === "[replace_me]") {
        const resolved = macroMap[key.toLowerCase()];
        url.searchParams.set(key, resolved !== undefined ? resolved : "");
      }
    }

    // Also handle inline bracket macros (e.g. [cb], [ua]) in case they appear
    let finalUrl = url.toString();
    finalUrl = finalUrl
      .replace(/\[cb\]|\[cachebuster\]/gi, encodeURIComponent(visitorData.cb))
      .replace(/\[timestamp\]|\[time\]/gi, encodeURIComponent(String(Date.now())))
      .replace(/\[page_url\]|\[url\]/gi, encodeURIComponent(visitorData.url))
      .replace(/\[ua\]/gi, encodeURIComponent(visitorData.ua))
      .replace(/\[uip\]/gi, encodeURIComponent(visitorData.uip))
      .replace(/\[width\]/gi, String(visitorData.width))
      .replace(/\[height\]/gi, String(visitorData.height));

    // Safety: strip any remaining [replace_me] placeholders
    if (finalUrl.includes("[replace_me]")) {
      console.warn("[buildSspRequestUrl] Unresolved macros detected:", finalUrl);
      finalUrl = finalUrl.replace(/\[replace_me\]/g, "");
    }

    return finalUrl;
  } catch (error) {
    console.error("[buildSspRequestUrl] Failed to build SSP URL:", error);
    return null;
  }
}
