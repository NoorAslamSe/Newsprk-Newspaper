import { z } from "zod";
import { EmailSchema } from "@/lib/validations/common";
import { Roles } from "@/lib/models/User";

/**
 * Zod schemas for user management API endpoints.
 *
 * UserCreateSchema: used by admin when manually creating a user (sets initial password).
 * UserUpdateSchema: used by PATCH — name/roles/isActive only (password change has its own flow).
 * InvitationCreateSchema: validates the invite payload — email + pre-assigned roles.
 */

export const UserCreateSchema = z.object({
  name: z.string().min(1).max(120),
  email: EmailSchema,
  password: z.string().min(8).max(200),
  roles: z.array(z.enum(Roles)).optional().default(["author"]),
});

export const UserUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  roles: z.array(z.enum(Roles)).optional(),
  isActive: z.boolean().optional(),
});

export const InvitationCreateSchema = z.object({
  email: EmailSchema,
  roles: z.array(z.enum(Roles)).optional().default(["author"]),
});
