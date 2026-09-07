import { Schema, model, models, type InferSchemaType } from "mongoose";

const affiliateClickSchema = new Schema(
  {
    offerId: { type: String, required: true, index: true },
    timestamp: { type: Date, default: Date.now, index: true },
    userAgent: { type: String, default: "" },
    referer: { type: String, default: "" },
    pageClass: { type: String, default: "" },
    entity: { type: String, default: "" },
    position: { type: String, default: "" },
    locale: { type: String, default: "en" },
    subId: { type: String, default: "" },
  },
  { timestamps: false }
);

affiliateClickSchema.index({ offerId: 1, timestamp: -1 });

export type AffiliateClickDoc = InferSchemaType<typeof affiliateClickSchema>;

export const AffiliateClick =
  models.AffiliateClick || model("AffiliateClick", affiliateClickSchema);
