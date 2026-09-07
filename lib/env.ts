import { z } from "zod";

/**
 * Zod schema for all required/optional environment variables.
 * Using safeParse ensures missing vars throw a clear, descriptive error
 * at startup rather than crashing silently at runtime.
 */
const EnvSchema = z.object({
  USE_DATABASE: z.enum(["true", "false"]).default("true"),
  MONGO_URI: z.string().min(1, "MONGO_URI missing"),
  NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET missing"),
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL missing or invalid"),
  // Storage providers — only required when that upload path is active
  AWS_ACCESS_KEY_ID: z.string().min(1).optional(),
  AWS_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  S3_BUCKET: z.string().min(1).optional(),
  CLOUDINARY_URL: z.string().min(1).optional(),
});

/** Call this at the top of any server-only module to get type-safe env vars. */
export function getEnv() {
  // Trim string values (next.config/`.env` values can carry trailing whitespace/semicolons).
  const raw: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(process.env)) {
    raw[k] = typeof v === "string" ? v.trim() : v;
  }
  const parsed = EnvSchema.safeParse(raw);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(", ");
    throw new Error(message);
  }
  return parsed.data;
}

