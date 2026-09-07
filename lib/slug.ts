import slugify from "slugify";

/** Converts any string to a URL-safe lowercase slug. Supports Arabic/UTF-8. */
export function toSlug(input: string) {
  // Check if input contains non-ASCII characters (Arabic, etc.)
  const hasNonAscii = /[^\x00-\x7F]/.test(input);

  if (hasNonAscii) {
    // For non-ASCII text (Arabic, etc.), preserve Unicode word characters
    return input
      .toLowerCase()
      .normalize("NFC")
      .replace(/[^\p{L}\p{N}\s-]/gu, "") // keep letters, numbers, spaces, hyphens
      .replace(/\s+/g, "-")               // spaces → hyphens
      .replace(/-+/g, "-")                // collapse multiple hyphens
      .replace(/^-|-$/g, "");             // trim leading/trailing hyphens
  }

  // For ASCII-only text, use slugify with strict mode
  return slugify(input, {
    lower: true,
    strict: true,
    trim: true,
  });
}

/**
 * Generates a guaranteed unique slug by appending -2, -3, ... until available.
 * The `exists` callback delegates the DB lookup to the caller, keeping this utility DB-agnostic.
 */
export async function ensureUniqueSlug(opts: {
  base: string;
  exists: (slug: string) => Promise<boolean>;
}) {
  const baseSlug = toSlug(opts.base);
  if (!(await opts.exists(baseSlug))) return baseSlug;
  // suffix starts at -2 as required
  for (let n = 2; n < 10_000; n++) {
    const next = `${baseSlug}-${n}`;
    if (!(await opts.exists(next))) return next;
  }
  throw new Error("Unable to generate unique slug");
}
