import bcrypt from "bcryptjs";

/** Cost factor 12: ~250ms on modern hardware. High enough to slow brute-force, fast enough for login UX. */
export async function hashPassword(password: string) {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/** Returns true if the plain password matches the stored bcrypt hash. */
export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

