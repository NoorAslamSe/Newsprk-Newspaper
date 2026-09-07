import { Schema, model, models, type InferSchemaType, Types } from "mongoose";

/**
 * API tokens for headless/programmatic access.
 * The raw token is shown to the user once; only its bcrypt hash is stored.
 * Prefix (nv_live_ / nv_test_) lets callers quickly identify the environment.
 */
const apiTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    tokenHash: { type: String, required: true, unique: true }, // bcrypt hash, never store plaintext
    prefix: { type: String, required: true, enum: ["nv_live_", "nv_test_"] }, // environment indicator
    lastUsedAt: { type: Date, default: null },
    revoked: { type: Boolean, default: false }, // soft-revoke without deleting history
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

export type ApiTokenDoc = InferSchemaType<typeof apiTokenSchema> & { _id: Types.ObjectId };

export const ApiToken = models.ApiToken || model("ApiToken", apiTokenSchema);
