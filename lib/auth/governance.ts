import { User, getMaxRoleLevel } from "@/lib/models/User";

/**
 * Centralized governance rules for user management.
 * These are enforced at the API layer — the UI should also respect them,
 * but the API is the source of truth. Never trust the client.
 *
 * Rule 1: Super Admin accounts are immutable — nobody can delete, deactivate, or demote them.
 * Rule 2: Admins can only be modified (roles/status/delete) by Super Admins.
 * Rule 3: No user can delete or deactivate their own account.
 * Rule 4: The last Super Admin cannot be deleted or demoted (system lockout prevention).
 * Rule 5: You can only assign roles at or below your own privilege level.
 * Rule 6: Non-super-admins cannot invite users with admin or super_admin roles.
 */

interface GovernanceContext {
  actorId: string;
  actorRoles: string[];
  targetId?: string;
  targetRoles?: string[];
}

interface GovernanceResult {
  allowed: boolean;
  reason?: string;
}

// ─── Rule: Can this actor modify (update roles/status) the target? ─────────

export async function canModifyUser(ctx: GovernanceContext): Promise<GovernanceResult> {
  const { actorId, actorRoles, targetId, targetRoles } = ctx;

  // Rule 3: Self-modification blocked for critical actions
  if (actorId === targetId) {
    return { allowed: false, reason: "You cannot modify your own account through this action." };
  }

  // Rule 1: Super Admin protection — absolutely immutable
  if (targetRoles?.includes("super_admin")) {
    return { allowed: false, reason: "Super Admin accounts are protected and cannot be modified." };
  }

  // Rule 2: Admin accounts can only be touched by Super Admins
  if (targetRoles?.includes("admin")) {
    if (!actorRoles.includes("super_admin")) {
      return { allowed: false, reason: "Only a Super Admin can modify Admin accounts." };
    }
  }

  // General hierarchy: actor must outrank target
  const actorLevel = getMaxRoleLevel(actorRoles);
  const targetLevel = getMaxRoleLevel(targetRoles || []);
  if (actorLevel <= targetLevel) {
    return { allowed: false, reason: "You cannot modify a user with equal or higher privileges." };
  }

  return { allowed: true };
}

// ─── Rule: Can this actor delete the target? ─────────

export async function canDeleteUser(ctx: GovernanceContext): Promise<GovernanceResult> {
  const { actorId, actorRoles, targetId, targetRoles } = ctx;

  // Rule 3: Cannot delete yourself
  if (actorId === targetId) {
    return { allowed: false, reason: "You cannot delete your own account." };
  }

  // Rule 1: Super Admin is undeletable
  if (targetRoles?.includes("super_admin")) {
    return { allowed: false, reason: "Super Admin accounts cannot be deleted." };
  }

  // Rule 2: Only Super Admin can delete Admins
  if (targetRoles?.includes("admin")) {
    if (!actorRoles.includes("super_admin")) {
      return { allowed: false, reason: "Only a Super Admin can delete Admin accounts." };
    }
  }

  // Hierarchy check
  const actorLevel = getMaxRoleLevel(actorRoles);
  const targetLevel = getMaxRoleLevel(targetRoles || []);
  if (actorLevel <= targetLevel) {
    return { allowed: false, reason: "You cannot delete a user with equal or higher privileges." };
  }

  return { allowed: true };
}

// ─── Rule: Can this actor assign these specific roles? ─────────

export async function canAssignRoles(actorRoles: string[], newRoles: string[]): Promise<GovernanceResult> {
  const actorLevel = getMaxRoleLevel(actorRoles);

  for (const role of newRoles) {
    const roleLevel = getMaxRoleLevel([role]);
    // Rule 5: Cannot assign roles at or above your own level
    if (roleLevel >= actorLevel) {
      return { allowed: false, reason: `You do not have permission to assign the "${role}" role.` };
    }
  }

  return { allowed: true };
}

// ─── Rule: Can this actor invite with these roles? ─────────

export async function canInviteWithRoles(actorRoles: string[], inviteRoles: string[]): Promise<GovernanceResult> {
  // Rule 6: Only super_admin can invite admins or super_admins
  for (const role of inviteRoles) {
    if (role === "super_admin") {
      return { allowed: false, reason: "Super Admin accounts cannot be created via invitation." };
    }
    if (role === "admin" && !actorRoles.includes("super_admin")) {
      return { allowed: false, reason: "Only a Super Admin can invite users with the Admin role." };
    }
  }

  return { allowed: true };
}

// ─── Rule 4: Last Super Admin protection ─────────

export async function ensureNotLastSuperAdmin(targetRoles: string[]): Promise<GovernanceResult> {
  if (!targetRoles?.includes("super_admin")) {
    return { allowed: true };
  }

  const superAdminCount = await User.countDocuments({ roles: "super_admin", isActive: true });
  if (superAdminCount <= 1) {
    return { allowed: false, reason: "Cannot remove or demote the last remaining Super Admin. The system would become unmanageable." };
  }

  return { allowed: true };
}

// ─── Rule 4 (variant): Last admin-or-above protection ─────────

export async function ensureNotLastAdmin(targetRoles: string[]): Promise<GovernanceResult> {
  if (!targetRoles?.includes("admin") && !targetRoles?.includes("super_admin")) {
    return { allowed: true };
  }

  // Count all users with admin-level or above access
  const adminCount = await User.countDocuments({
    roles: { $in: ["admin", "super_admin"] },
    isActive: true,
  });

  if (adminCount <= 1) {
    return { allowed: false, reason: "Cannot disable or demote the last remaining administrator." };
  }

  return { allowed: true };
}
