import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import type { Role } from "@/lib/models/User";
import { hasAnyRole, hasPermission } from "@/lib/auth/rbac";
import { authenticateApiRequest } from "@/lib/auth/apiAuth";

/** Returns the current session or null. For use inside Server Components and API routes. */
export async function getSession() {
  return getServerSession(authOptions);
}

/** 
 * Throws 'Unauthorized' if no session exists.
 * Supports both NextAuth sessions (cookies) and API Tokens (Bearer header).
 */
export async function requireSession() {
  // 1. Try NextAuth session (browser cookies)
  const session = await getSession();
  if (session?.user?.id) {
    return session;
  }

  // 2. Try API Token authentication (Bearer header)
  const { user } = await authenticateApiRequest();
  if (user) {
    // Return a session-compatible object so downstream logic (roles/permissions) works
    return {
      user: {
        id: (user as any)._id?.toString() || "",
        name: user.name,
        email: user.email,
        roles: (user.roles || []) as string[],
        avatarUrl: user.avatarUrl,
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Mock expiry
    };
  }

  throw new Error("Unauthorized");
}

/** Throws 'Forbidden' if the user doesn't hold at least one of the required roles. */
export async function requireRoles(allowed: Role[]) {
  const session = await requireSession();
  const roles = (session.user.roles ?? []) as Role[];

  if (!(await hasAnyRole(roles, allowed))) {
    throw new Error("Forbidden");
  }
  return session;
}

/** Throws 'Forbidden' if the user's roles don't include the required granular permission. */
export async function requirePermission(permission: string) {
  const session = await requireSession();
  const roles = (session.user.roles ?? []) as string[];

  const hasAccess = await hasPermission(roles, permission);
  if (!hasAccess) {
    throw new Error("Forbidden");
  }

  return session;
}

