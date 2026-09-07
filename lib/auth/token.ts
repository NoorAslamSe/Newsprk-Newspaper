import crypto from "crypto";

/**
 * Generates a secure invitation token pair.
 * `token` is sent in the email invite link (shown once, never stored).
 * `tokenHash` (SHA-256) is stored in the DB for later verification.
 */
export function generateInvitationToken() {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, tokenHash };
}

