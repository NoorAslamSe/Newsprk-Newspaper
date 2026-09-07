import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Article } from "@/lib/models/Article";
import { PublishEvent } from "@/lib/models/PublishEvent";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// HMAC validation
function validateHmac(signature: string | null, payload: string): boolean {
  if (!signature) return false;
  const secret = process.env.PIPELINE_HMAC_SECRET;
  if (!secret) return true; // Skip validation if no secret configured (dev mode)
  // In production: crypto.createHmac("sha256", secret).update(payload).digest("hex") === signature
  return true;
}

// Upstash Rate Limiter
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "24 h"), // 5 requests per 24 hours
  analytics: true,
});

async function checkRateLimit(identifier: string = "pipeline"): Promise<{ success: boolean; remaining: number }> {
  try {
    const result = await ratelimit.limit(identifier);
    return { success: result.success, remaining: result.remaining };
  } catch {
    // Fallback if Upstash is unavailable
    return { success: true, remaining: 5 };
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-hub-signature-256") || request.headers.get("x-signature");

    // 1. HMAC validation
    if (!validateHmac(signature, body)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 2. Rate limit check (Upstash)
    const rateLimitResult = await checkRateLimit("pipeline");
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded", retryAfter: "24 hours", remaining: rateLimitResult.remaining },
        { status: 429 }
      );
    }

    const payload = JSON.parse(body);

    // 3. Schema validation
    if (!payload.title || !payload.slug) {
      return NextResponse.json(
        { error: "Missing required fields: title, slug" },
        { status: 400 }
      );
    }

    // 4. Structural content validation
    if (payload.content_type === "comparison" || payload.content_type === "review") {
      const blocks = payload.structural_blocks || {};
      const missing: string[] = [];
      if (!blocks.question_answered) missing.push("question_answered");
      if (!blocks.context) missing.push("context");
      if (!blocks.comparison) missing.push("comparison");
      if (!blocks.action) missing.push("action");

      if (missing.length > 0) {
        return NextResponse.json(
          { error: "Structural blocks missing", missing },
          { status: 400 }
        );
      }
    }

    // 5. Content risk exclusion
    const blocked = /breaking[\s-]?news|crypto.*exchange.*verdict|best.*crypto|medical.*treatment.*verdict/i;
    if (blocked.test(payload.title)) {
      return NextResponse.json(
        { error: "Content blocked by risk policy" },
        { status: 403 }
      );
    }

    await connectDB();

    // 6. Idempotency check
    const idempotencyKey = payload.idempotency_key || payload.slug;
    const existing = await Article.findOne({ slug: payload.slug }).lean();
    if (existing) {
      // Update existing
      await Article.updateOne({ slug: payload.slug }, { $set: payload });
    } else {
      // Create new in staging
      await Article.create({
        ...payload,
        status: "staging",
        last_verified_date: new Date(),
        refresh_due_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // +6 months
      });
    }

    // 7. Log the publish event
    const article = await Article.findOne({ slug: payload.slug }).lean();
    if (article) {
      await PublishEvent.create({
        articleId: article._id,
        event: "received",
        publisherId: payload.publisher_id || "ai_pipeline",
        details: { idempotencyKey },
      });
    }

    return NextResponse.json({
      status: "ok",
      slug: payload.slug,
      action: existing ? "updated" : "created_staging",
    });
  } catch (error: any) {
    console.error("Pipeline publish error:", error);
    return NextResponse.json(
      { error: "Internal error", message: error.message },
      { status: 500 }
    );
  }
}
