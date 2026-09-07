import { connectDB } from "@/lib/db";
import { RolePolicy } from "@/lib/models/RolePolicy";

/**
 * In-memory cache for role permissions.
 * Avoids a DB round-trip on every authenticated request.
 * Cache expires every 5 minutes; can be force-refreshed after admin updates.
 */
let cachedPolicies: Record<string, string[]> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/** Fetches all RolePolicy documents and indexes them by roleName. */
export async function getRolePolicies(forceRefresh = false): Promise<Record<string, string[]>> {
  const now = Date.now();
  if (!forceRefresh && cachedPolicies && (now - cacheTimestamp < CACHE_TTL)) {
    return cachedPolicies; // Return from cache if still fresh
  }

  await connectDB();
  const policies = await RolePolicy.find({}).lean();

  const map: Record<string, string[]> = {};
  policies.forEach((policy: any) => {
    map[policy.roleName] = policy.permissions || [];
  });

  cachedPolicies = map;
  cacheTimestamp = now;
  return map;
}

/** Call this after admin updates RolePolicy so the next request re-fetches fresh policies. */
export function invalidatePolicyCache() {
  cachedPolicies = null;
  cacheTimestamp = 0;
}

/** Returns true if the user has at least one of the allowed roles (OR logic). */
export async function hasAnyRole(userRoles: string[] | undefined, allowed: string[]) {
  if (!userRoles?.length) return false;
  if (userRoles.includes("super_admin")) return true;
  return allowed.some((r) => userRoles.includes(r));
}

/**
 * Checks a granular permission string against the user's roles via the DB-driven policy cache.
 * super_admin and admin both bypass all permission checks — they always have full access.
 */
export async function hasPermission(userRoles: string[] | undefined, permission: string): Promise<boolean> {
  // Super Admins and Admins bypass all permission checks — they always have full access
  if (userRoles?.includes("super_admin")) return true;
  if (userRoles?.includes("admin")) return true;
  if (!userRoles || userRoles.length === 0) return false;

  const policies = await getRolePolicies();

  // Check each role the user holds until a matching permission is found
  for (const role of userRoles) {
    const rolePerms = policies[role] || [];
    if (rolePerms.includes(permission)) {
      return true;
    }
  }

  return false;
}
