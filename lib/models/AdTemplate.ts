import { Schema, model, models, type InferSchemaType } from "mongoose";

export const TemplateCategories = ["banner", "native", "video", "interactive"] as const;
export type TemplateCategory = (typeof TemplateCategories)[number];

export const TemplateVariableTypes = ["text", "url", "media", "color"] as const;
export type TemplateVariableType = (typeof TemplateVariableTypes)[number];

export const ValidationStatuses = ["valid", "invalid", "warning"] as const;
export type ValidationStatus = (typeof ValidationStatuses)[number];

/**
 * Declares a single interpolation variable within the template's HTML code.
 * The dashboard form renders an appropriate input widget based on `type`.
 */
const templateVariableSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 50 },
  type: { type: String, required: true, enum: TemplateVariableTypes }, // drives the dashboard input widget
  required: { type: Boolean, default: false },
  defaultValue: { type: String, default: "", trim: true, maxlength: 500 },
}, { _id: false });

/**
 * Reusable HTML ad templates stored in the DB.
 * A template defines the structure + variable placeholders;
 * an AdSnippet then references it and fills in the variables.
 */
const adTemplateSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: "", trim: true, maxlength: 500 },
    category: { type: String, required: true, enum: TemplateCategories, index: true },
    code: { type: String, required: true },             // HTML with {{variable}} placeholders
    variables: [templateVariableSchema],                // Declares available placeholders
    preview: { type: String, default: "", trim: true, maxlength: 2048 }, // Screenshot/preview URL
    isActive: { type: Boolean, default: true },
    validationStatus: { type: String, enum: ValidationStatuses, default: "valid" },
    lastValidated: { type: Date, default: Date.now },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

// Indexes for efficient queries
adTemplateSchema.index({ name: 1 }, { unique: true });
adTemplateSchema.index({ category: 1, isActive: 1 });
adTemplateSchema.index({ createdBy: 1 });

export type TemplateVariableDoc = InferSchemaType<typeof templateVariableSchema>;
export type AdTemplateDoc = InferSchemaType<typeof adTemplateSchema>;

export const AdTemplate = models.AdTemplate || model("AdTemplate", adTemplateSchema);