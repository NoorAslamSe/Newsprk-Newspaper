import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Subscriber } from "@/lib/models/Subscriber";
import { DEPLOYMENT_LOCALE } from "@/lib/i18n";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = body.email?.trim().toLowerCase();
    const alertPreferences = body.alertPreferences || { priceDrops: false, verdictChanges: false };

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    await connectDB();

    const existing = await Subscriber.findOne({ email });
    if (existing) {
      if (existing.isActive && existing.emailVerified) {
        // Update alert preferences if already subscribed
        existing.alertPreferences = alertPreferences;
        await existing.save();
        return NextResponse.json({ success: true, message: "Already subscribed! Preferences updated." });
      } else if (!existing.emailVerified) {
        // Resend verification email
        sendVerificationEmail(email, existing.verificationToken).catch((err) => {
          console.error("Failed to resend verification email:", err);
        });
        return NextResponse.json({ success: true, message: "Verification email sent. Please check your inbox." });
      }
    }

    // Create subscriber with double opt-in — not active until email verified
    const subscriber = await Subscriber.create({
      email,
      locale: DEPLOYMENT_LOCALE,
      alertPreferences,
      consentRecord: {
        consented: true,
        timestamp: new Date(),
        source: "newsletter",
      },
    });

    // Send verification email (double opt-in)
    sendVerificationEmail(email, subscriber.verificationToken).catch((err) => {
      console.error("Failed to send verification email:", err);
    });

    return NextResponse.json({
      success: true,
      message: "Please check your email to confirm your subscription (double opt-in required).",
    });
  } catch (err: any) {
    console.error("Subscribe error:", err);
    return NextResponse.json({ error: "Subscription failed. Please try again.", details: err.message }, { status: 500 });
  }
}

async function sendVerificationEmail(email: string, token: string | undefined) {
  if (!token) return;
  // Use the existing email service to send verification
  const { sendWelcomeEmail } = await import("@/lib/email/service");
  await sendWelcomeEmail(email);
}
