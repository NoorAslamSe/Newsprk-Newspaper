import { Schema, model, models, type InferSchemaType } from "mongoose";

const publishEventSchema = new Schema(
  {
    articleId: { type: Schema.Types.ObjectId, ref: "Article", required: true, index: true },
    event: {
      type: String,
      enum: ["received", "validated", "reviewed", "published", "rejected", "rolled_back"],
      required: true,
    },
    timestamp: { type: Date, default: Date.now },
    publisherId: { type: String, default: "system" },
    details: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: false }
);

publishEventSchema.index({ articleId: 1, timestamp: -1 });
publishEventSchema.index({ event: 1, timestamp: -1 });

export type PublishEventDoc = InferSchemaType<typeof publishEventSchema>;

export const PublishEvent =
  models.PublishEvent || model("PublishEvent", publishEventSchema);
