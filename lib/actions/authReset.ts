"use server";

import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { hashPassword } from "@/lib/auth/password";
import { createHash, randomBytes } from "crypto";
import { headers } from "next/headers";

/**
 * SHA-256 hash for the reset token — same rationale as apiAuth:
 * tokens are already high-entropy random bytes, so bcrypt cost adds no security.
 */
function hashResetToken(plainToken: string): string {
  return createHash('sha256').update(plainToken).digest('hex');
}

/**
 * Step 1: User requests a password reset link to their email
 */
export async function requestPasswordResetAction(email: string) {
  try {
    if (!email || !email.includes("@")) throw new Error("Invalid email format");

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Always securely pretend it succeeded even if user not found (prevents email enumeration attacks)
    if (!user) {
      return { success: true, message: "If an account exists, a reset link was sent." };
    }

    // Generate cryptographic reset token
    const plainToken = randomBytes(32).toString("hex");
    const tokenHash = hashResetToken(plainToken);
    
    // Set 1 Hour Expiration
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    user.resetTokenHash = tokenHash;
    user.resetTokenExpiresAt = expiresAt;
    await user.save();

    const headersList = await headers();
    const origin = headersList.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const recoveryLink = `${origin}/auth/reset-password/${plainToken}`;

    // === PRODUCTION VS DEVELOPMENT EMAIL HANDLER ===
    if (process.env.NODE_ENV === "development") {
      // In Development, we print to the server console because we aren't using real emails
      console.log("\n\n=========================================");
      console.log("🔒 PASSWORD RESET LINK INTERCEPTED (DEV)");
      console.log(recoveryLink);
      console.log("=========================================\n\n");
    } else {
      // In Production, you inject your Email Provider here (e.g. Resend, NodeMailer)
      // Example pseudo-code:
      // await resend.emails.send({
      //   from: 'security@Trendsposts.com',
      //   to: user.email,
      //   subject: 'Secure Password Reset',
      //   html: `<p>Click here to reset: <a href="${recoveryLink}">Reset Password</a></p>`
      // });
      console.log(`[PROD] Password reset token generated for ${user.email}. (Implement Mail Delivery)`);
    }

    return {
      success: true,
      message: "If an account exists, a reset link was sent.",
      // devLink is only populated in development — gives the reset URL directly so devs don't need to set up email
      devLink: process.env.NODE_ENV === "development" ? recoveryLink : undefined
    };

  } catch (error) {
    return { success: false, error: "System error initiating password reset." };
  }
}

/**
 * Step 2: User successfully opens link and enforces the new password
 */
export async function executePasswordResetAction(token: string, newPassword: string) {
  try {
    if (!token || token.length < 32) throw new Error("Invalid or mangled recovery token.");
    if (!newPassword || newPassword.length < 6) throw new Error("Password must be at least 6 characters.");

    await connectDB();
    
    const tokenHash = hashResetToken(token);

    // Single compound query: validates token hash AND expiry simultaneously
    const user = await User.findOne({
      resetTokenHash: tokenHash,
      resetTokenExpiresAt: { $gt: new Date() } // Reject if link has expired
    });

    if (!user) {
      return { success: false, error: "The recovery link has expired or is invalid." };
    }

    const newPasswordHashed = await hashPassword(newPassword);

    // Invalidate the reset token immediately after successful use (one-time-use)
    user.passwordHash = newPasswordHashed;
    user.resetTokenHash = null;
    user.resetTokenExpiresAt = null;
    await user.save();

    return { success: true, message: "Password updated successfully. You may now log in." };

  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to reset password." };
  }
}
