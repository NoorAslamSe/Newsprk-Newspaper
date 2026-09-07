import mongoose from "mongoose";

/**
 * Database-driven RBAC permission sets.
 * Each document maps a role name (e.g. "editor") to an array of
 * permission strings (e.g. ["post.create", "post.update"]).
 * Admins can update permissions live without a code deploy.
 */
export interface IRolePolicy {
  _id: mongoose.Types.ObjectId;
  roleName: string;
  permissions: string[]; // e.g. ["post.create", "media.upload"]
  createdAt: Date;
  updatedAt: Date;
}

const rolePolicySchema = new mongoose.Schema<IRolePolicy>(
  {
    roleName: { type: String, required: true, unique: true },
    permissions: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const RolePolicy = mongoose.models.RolePolicy || mongoose.model<IRolePolicy>("RolePolicy", rolePolicySchema);
