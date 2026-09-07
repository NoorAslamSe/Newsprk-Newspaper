"use server";

/**
 * Handles newsletter subscription with re-subscribe support.
 * If the email already exists as 'unsubscribed', it is reactivated rather than rejected.
 */

import { connectDB } from "@/lib/db";
import { Newsletter } from "@/lib/models/Newsletter";

export async function subscribeToNewsletterAction(email: string) {
  try {
    await connectDB();
    
    const existing = await Newsletter.findOne({ email });
    if (existing) {
      if (existing.status === "active") {
        return { success: true, message: "Already subscribed!" }; // Idempotent — no duplicate
      } else {
        // Reactivate a previously unsubscribed email without creating a new record
        existing.status = "active";
        await existing.save();
        return { success: true, message: "Welcome back! Subscribed again." };
      }
    }
    
    await Newsletter.create({ email });
    return { success: true, message: "Successfully subscribed!" };
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return { success: false, error: "Subscription failed. Please try again later." };
  }
}
