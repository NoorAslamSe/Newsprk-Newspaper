import { Schema, model, models } from "mongoose";

/**
 * Newsletter subscribers. Uses soft-unsubscribe (status = "unsubscribed")
 * so we can honour re-subscribe requests and maintain suppression lists.
 */
const newsletterSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, trim: true },
    status: { type: String, enum: ["active", "unsubscribed"], default: "active" },
  },
  { timestamps: true }
);

export const Newsletter = models.Newsletter || model("Newsletter", newsletterSchema);
