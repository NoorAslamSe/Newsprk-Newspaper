import { Schema, model, models, type InferSchemaType } from "mongoose";

const commentSchema = new Schema(
  {
    articleSlug: { type: String, required: true },
    authorName: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    parentCommentId: { type: Schema.Types.ObjectId, ref: "Comment", default: null },
  },
  { timestamps: true }
);

commentSchema.index({ articleSlug: 1, createdAt: -1 });
commentSchema.index({ articleSlug: 1, rating: 1 });

export type CommentDoc = InferSchemaType<typeof commentSchema>;

export const Comment = models.Comment || model("Comment", commentSchema);
