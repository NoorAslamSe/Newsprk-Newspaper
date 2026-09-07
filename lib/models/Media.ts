import { Schema, model, models, type InferSchemaType } from "mongoose";

/**
 * Tracks where each media file is used (ad/post/template) for safe-deletion checks.
 * Prevents orphaning references when an admin tries to delete a file still in use.
 */
const mediaUsageSchema = new Schema({
  type: { type: String, required: true, enum: ["ad", "post", "template"] },
  referenceId: { type: Schema.Types.ObjectId, required: true }, // ID of the referencing document
  usedAt: { type: Date, default: Date.now },
}, { _id: false });

const mediaSchema = new Schema(
  {
    filename: { type: String, required: true, trim: true, maxlength: 260 },
    mimeType: { type: String, required: true, trim: true, maxlength: 120 },
    size: { type: Number, required: true, min: 0 },
    url: { type: String, required: true, trim: true, maxlength: 2048 }, // Primary public URL
    provider: { type: String, required: true, enum: ["cdn", "supabase"], default: "supabase", index: true }, // Storage backend
    // Auto-generated size variants for responsive images
    variants: {
      original: { type: String, default: null },
      thumbnail: { type: String, default: null },
      medium: { type: String, default: null },
    },
    alt: { type: String, default: "", trim: true, maxlength: 300 },
    metadata: { 
      width: { type: Number, default: null },
      height: { type: Number, default: null },
      duration: { type: Number, default: null },
      format: { type: String, default: null },
      colorSpace: { type: String, default: null },
      hasAlpha: { type: Boolean, default: null },
      // Keep existing mixed metadata for backward compatibility
      ...{ type: Schema.Types.Mixed, default: {} }
    },
    // Enhanced metadata fields
    tags: [{ type: String, trim: true, maxlength: 50 }],
    folder: { type: String, default: "", trim: true, maxlength: 200, index: true },
    cdnKey: { type: String, default: "", trim: true, maxlength: 500, index: true },
    cdnBucket: { type: String, default: "", trim: true, maxlength: 100 },
    objectPath: { type: String, default: "", trim: true, maxlength: 1000 },
    publicUrl: { type: String, default: "", trim: true, maxlength: 2048 },
    bucket: { type: String, default: "", trim: true, maxlength: 100 },
    vastTag: { type: String, default: "", trim: true, maxlength: 2048 },     // Optional VAST URL if this media is a video ad
    adTiming: { type: String, default: "", enum: ["pre-roll", "mid-roll", "post-roll", ""], trim: true }, // Where in a video the ad plays
    usage: [mediaUsageSchema], // References to every document that uses this file
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

mediaSchema.index({ filename: 1 });
mediaSchema.index({ tags: 1 });
mediaSchema.index({ folder: 1 });
mediaSchema.index({ provider: 1 });
mediaSchema.index({ cdnKey: 1 });

export type MediaUsageDoc = InferSchemaType<typeof mediaUsageSchema>;
export type MediaDoc = InferSchemaType<typeof mediaSchema>;

export const Media = models.Media || model("Media", mediaSchema);

