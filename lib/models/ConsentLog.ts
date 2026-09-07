import { Schema, model, models, type InferSchemaType } from "mongoose";

const consentLogSchema = new Schema(
  {
    sessionId: { type: String, required: true, index: true },
    timestamp: { type: Date, default: Date.now },
    consentState: {
      type: String,
      enum: ["accepted", "declined", "partial"],
      required: true,
    },
    ad_storage: { type: String, enum: ["granted", "denied"], default: "denied" },
    analytics_storage: { type: String, enum: ["granted", "denied"], default: "denied" },
    ad_user_data: { type: String, enum: ["granted", "denied"], default: "denied" },
    ad_personalization: { type: String, enum: ["granted", "denied"], default: "denied" },
    geo: { type: String, default: "" },
    userAgent: { type: String, default: "" },
  },
  { timestamps: false }
);

consentLogSchema.index({ sessionId: 1 });
consentLogSchema.index({ timestamp: -1 });

export type ConsentLogDoc = InferSchemaType<typeof consentLogSchema>;

export const ConsentLog = models.ConsentLog || model("ConsentLog", consentLogSchema);
