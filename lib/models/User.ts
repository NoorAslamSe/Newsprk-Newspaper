import { Schema, model, models, type InferSchemaType } from "mongoose";

/**
 * Allowed roles in descending privilege order:
 * super_admin > admin > editor > author
 *
 * super_admin: Untouchable root authority — cannot be deleted, deactivated, or demoted by anyone.
 * admin:       Full operational control — can manage editors/authors but NOT other admins.
 * editor:      Content management — can edit/publish all posts but cannot manage users.
 * author:      Limited — can only create and manage their own posts.
 */
export const Roles = ["super_admin", "admin", "editor", "author"] as const;
export type Role = (typeof Roles)[number];

/**
 * Numeric privilege level for each role.
 * Used by API governance rules to enforce "you can only manage users below your rank".
 */
export const ROLE_HIERARCHY: Record<string, number> = {
  super_admin: 100,
  admin: 50,
  editor: 20,
  author: 10,
};

/** Returns the highest privilege level among a user's roles. */
export function getMaxRoleLevel(roles: string[]): number {
  if (!roles?.length) return 0;
  return Math.max(...roles.map((r) => ROLE_HIERARCHY[r] ?? 0));
}

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, index: true, trim: true, maxlength: 254 },
    avatarUrl: { type: String, default: null },
    passwordHash: { type: String, default: null }, // null for users who have not yet set a password
    roles: { type: [String], enum: Roles, default: ["author"] },
    isActive: { type: Boolean, default: true },          // Soft-disable without deleting the account
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null }, // Who created/invited this user
    invitationTokenHash: { type: String, default: null }, // bcrypt hash of the email invite token
    invitationExpiresAt: { type: Date, default: null },
    resetTokenHash: { type: String, default: null },      // bcrypt hash of the password-reset token
    resetTokenExpiresAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

export type UserDoc = InferSchemaType<typeof userSchema>;

export const User = models.User || model("User", userSchema);
