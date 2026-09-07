import { connectDB } from "@/lib/db";
import { Subscriber } from "@/lib/models/Subscriber";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return new Response("Invalid verification link.", { status: 400 });
    }

    await connectDB();

    const subscriber = await Subscriber.findOne({ verificationToken: token });
    if (!subscriber) {
      return new Response("Invalid or expired verification link.", { status: 400 });
    }

    if (subscriber.emailVerified && subscriber.isActive) {
      return new Response("Email already verified. You are subscribed!", { status: 200 });
    }

    // Verify the email and activate the subscription (double opt-in complete)
    subscriber.emailVerified = true;
    subscriber.isActive = true;
    await subscriber.save();

    // Send welcome email now that subscription is confirmed
    try {
      const { sendWelcomeEmail } = await import("@/lib/email/service");
      await sendWelcomeEmail(subscriber.email);
    } catch (emailErr) {
      console.error("Failed to send welcome email after verification:", emailErr);
    }

    return new Response(
      `<html><body style="font-family:system-ui;max-width:600px;margin:40px auto;text-align:center;padding:20px;">
        <h1 style="color:#10b981;">✓ Subscription Confirmed</h1>
        <p style="color:#666;">Thank you for confirming your email address. You are now subscribed to TrendsPosts alerts.</p>
        <p style="color:#999;font-size:14px;">You can close this tab or <a href="/" style="color:#6366f1;">return to the homepage</a>.</p>
      </body></html>`,
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  } catch (err: any) {
    console.error("Verification error:", err);
    return new Response("Verification failed. Please try again.", { status: 500 });
  }
}
