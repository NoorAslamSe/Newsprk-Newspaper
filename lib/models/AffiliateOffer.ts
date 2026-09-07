import { Schema, model, models, type InferSchemaType } from "mongoose";

const affiliateOfferSchema = new Schema(
  {
    offerId: { type: String, required: true, unique: true },
    merchant: { type: String, required: true },
    merchantDisplayName: { type: String, default: "" },
    affiliateUrl: { type: String, required: true },
    region: { type: String, default: "global" },
    category: { type: String, default: "" },
    status: {
      type: String,
      enum: ["active", "paused", "dead"],
      default: "active",
    },
    lastChecked: { type: Date, default: null },
    lastStatus: { type: String, default: "" },
    clickCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

affiliateOfferSchema.index({ offerId: 1 });
affiliateOfferSchema.index({ status: 1 });
affiliateOfferSchema.index({ merchant: 1 });
affiliateOfferSchema.index({ region: 1 });

export type AffiliateOfferDoc = InferSchemaType<typeof affiliateOfferSchema> & { _id: any };

export const AffiliateOffer =
  models.AffiliateOffer || model("AffiliateOffer", affiliateOfferSchema);
