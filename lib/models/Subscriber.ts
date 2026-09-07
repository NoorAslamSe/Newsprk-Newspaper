import { Schema, model, models } from "mongoose";
import crypto from "crypto";

const subscriberSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    isActive: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    verificationToken: { type: String, unique: true },
    unsubscribeToken: { type: String, unique: true },
    locale: { type: String, default: "en" },
    alertPreferences: {
      priceDrops: { type: Boolean, default: false },
      verdictChanges: { type: Boolean, default: false },
    },
    consentRecord: {
      consented: { type: Boolean, default: false },
      timestamp: { type: Date },
      source: { type: String, default: "newsletter" },
    },
  },
  { timestamps: true }
);

// Generate unique tokens before validation/saving if they don't exist
subscriberSchema.pre("validate", async function() {
  if (!this.verificationToken) {
    this.verificationToken = crypto.randomBytes(32).toString("hex");
  }
  if (!this.unsubscribeToken) {
    this.unsubscribeToken = crypto.randomBytes(32).toString("hex");
  }
});

if (process.env.NODE_ENV !== "production") {
  delete models.Subscriber;
}
export const Subscriber = models.Subscriber || model("Subscriber", subscriberSchema);
