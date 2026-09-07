import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Subscriber } from "@/lib/models/Subscriber";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = body.token;

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    await connectDB();
    const subscriber = await Subscriber.findOne({ unsubscribeToken: token });

    if (!subscriber) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    subscriber.isActive = false;
    await subscriber.save();

    return NextResponse.json({ success: true, message: "Successfully unsubscribed." });
  } catch (err: any) {
    console.error("Unsubscribe error:", err);
    return NextResponse.json({ error: "Unsubscribe failed" }, { status: 500 });
  }
}

// Allow GET for simple click-to-unsubscribe links from emails
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return new NextResponse("Token is required", { status: 400 });
    }

    await connectDB();
    const subscriber = await Subscriber.findOne({ unsubscribeToken: token });

    if (!subscriber) {
      return new NextResponse("Invalid or expired token", { status: 400 });
    }

    subscriber.isActive = false;
    await subscriber.save();

    // Redirect to a simple confirmation page or homepage with a success message
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(`${baseUrl}/?unsubscribed=true`);
  } catch (err: any) {
    console.error("Unsubscribe GET error:", err);
    return new NextResponse("Unsubscribe failed", { status: 500 });
  }
}
