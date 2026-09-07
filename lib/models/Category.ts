import { Schema, model, models, type InferSchemaType, Types } from "mongoose";

/**
 * Full-featured category with optional parent-child hierarchy.
 * For the lightweight public-facing version (nav/footer counts) use SimpleCategory.
 */
const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    locale: { type: String, default: "en", index: true },
    parent: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    meta: { type: Schema.Types.Mixed, default: {} },
    color: { type: String, default: "#64748b" },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

categorySchema.index({ slug: 1, locale: 1 });
categorySchema.index({ locale: 1, name: 1 });

export type CategoryDoc = InferSchemaType<typeof categorySchema> & {
  _id: Types.ObjectId;
};

export const Category = models.Category || model("Category", categorySchema);

