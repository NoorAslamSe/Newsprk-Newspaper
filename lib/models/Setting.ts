import { Schema, model, models, type InferSchemaType } from "mongoose";

/**
 * Generic key-value store for application-level settings (e.g. site name, analytics IDs).
 * Using Mixed value allows strings, numbers, booleans, or nested objects without schema changes.
 * Admins update these via the dashboard without needing a redeploy.
 */
const settingSchema = new Schema(
  {
    key: { type: String, required: true, trim: true, maxlength: 120 },
    locale: { type: String, default: "en", maxlength: 5 },
    value: { type: Schema.Types.Mixed, default: null }, // Flexible: any JSON-serialisable value
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);
settingSchema.index({ key: 1, locale: 1 }, { unique: true });

export type SettingDoc = InferSchemaType<typeof settingSchema>;

export const Setting = models.Setting || model("Setting", settingSchema);

