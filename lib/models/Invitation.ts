import { Schema, model, models } from "mongoose";

/**
 * Pending email invitations. Decoupled from User — an Invitation record
 * exists until accepted (then converted to a User) or expired/revoked.
 * MongoDB's TTL index auto-deletes expired invitations without a cron job.
 */
const invitationSchema = new Schema(
  {
    email: { 
      type: String, 
      required: true, 
      unique: true,   // One pending invite per email at a time
      trim: true, 
      lowercase: true,
      index: true
    },
    roles: { 
      type: [String], 
      default: ["author"]  // Pre-assigned roles carried over on User creation
    },
    tokenHash: { 
      type: String, 
      required: true, 
      index: true    // Hashed invite token — validated on acceptance
    },
    invitedBy: { 
      type: Schema.Types.ObjectId, 
      ref: "User",
      required: true 
    },
    expiresAt: { 
      type: Date, 
      required: true,
      index: { expires: 0 } // TTL index: MongoDB auto-deletes the document when expiresAt is reached
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Invitation = models.Invitation || model("Invitation", invitationSchema);
