import { Schema, model, models, type InferSchemaType } from "mongoose";

/**
 * Catalog of products used across the site (megamenu, compare view, reviews).
 * Products can be backed by an Article (review/comparison) via `articleSlug`,
 * and linked into the CompareView via `comparisonSlug`/`slug`.
 */
const productSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    brand: { type: String, default: "" },
    image: { type: String, default: "" },
    price: { type: String, default: "" },
    description: { type: String, default: "" },
    category: { type: String, default: "", index: true },
    categoryLabel: { type: String, default: "" },
    subcategory: { type: String, default: "", index: true },
    locale: { type: String, default: "en", index: true },
    articleSlug: { type: String, default: "" },
    comparisonSlug: { type: String, default: "" },
    featured: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["active", "paused", "archived"],
      default: "active",
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

productSchema.index({ slug: 1, locale: 1 }, { unique: true });
productSchema.index({ category: 1, subcategory: 1 });
productSchema.index({ locale: 1, status: 1, featured: 1 });

export type ProductDoc = InferSchemaType<typeof productSchema> & { _id: any };

export const Product = models.Product || model("Product", productSchema);
