import { Schema, model, models, type InferSchemaType } from "mongoose";

/**
 * Exhaustive list of tracked admin actions.
 * Adding a new action here automatically enforces its validity across the codebase.
 */
export const AuditActions = [
  "post.create",
  "post.update",
  "post.delete",
  "user.roles.update",
  "user.deactivate",
  "user.delete",
  "user.invite",
  "category.create",
  "category.update",
  "category.delete",
  "ad.create",
  "ad.update",
  "ad.delete",
  "media.upload",
  "settings.update",
] as const;
export type AuditAction = (typeof AuditActions)[number];

/**
 * Immutable append-only log of every significant dashboard action.
 * updatedAt is intentionally absent because audit entries must not be modified.
 */
const auditLogSchema = new Schema(
  {
    action: { type: String, required: true, enum: AuditActions, index: true },
    actorUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    resourceType: { type: String, required: true, trim: true, maxlength: 60 }, // e.g. "Post", "User"
    resourceId: { type: Schema.Types.ObjectId, default: null },
    meta: { type: Schema.Types.Mixed, default: {} }, // before/after snapshots or extra context
  },
  { timestamps: { createdAt: true, updatedAt: false } } // logs are immutable — no updatedAt needed
);

auditLogSchema.index({ createdAt: -1 }); // dashboard shows most-recent logs first

export type AuditLogDoc = InferSchemaType<typeof auditLogSchema>;

export const AuditLog = models.AuditLog || model("AuditLog", auditLogSchema);

