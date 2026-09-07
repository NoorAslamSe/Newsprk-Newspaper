import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { Invitation } from "@/lib/models/Invitation";
import { InvitationCreateSchema } from "@/lib/validations/user";
import { toApiError } from "@/lib/api/errors";
import { requirePermission } from "@/lib/auth/server";
import { generateInvitationToken } from "@/lib/auth/token";
import { sendEmail } from "@/lib/email/sender";
import { canInviteWithRoles } from "@/lib/auth/governance";

// Basic in-memory rate limiting map: { userId: { count, resetTime } }
const rateLimitCache = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 5; // 5 invites
const RATE_LIMIT_WINDOW = 60 * 1000; // per minute

export async function POST(req: Request) {
  try {
    const session = await requirePermission("users.invite");
    
    // Rate Limiting Enforcement
    const userId = session.user.id;
    const now = Date.now();
    const limiter = rateLimitCache.get(userId);
    
    if (limiter && now < limiter.resetTime) {
      if (limiter.count >= RATE_LIMIT_MAX) {
         return NextResponse.json({ error: "Too many invites sent. Please wait a minute." }, { status: 429 });
      }
      limiter.count += 1;
    } else {
      rateLimitCache.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    }

    await connectDB();
    const body = InvitationCreateSchema.parse(await req.json());

    // ── Governance: Can the actor invite with these roles? ──
    const actorRoles = (session.user.roles ?? []) as string[];
    const inviteCheck = await canInviteWithRoles(actorRoles, body.roles);
    if (!inviteCheck.allowed) {
      return NextResponse.json({ error: inviteCheck.reason }, { status: 403 });
    }

    // 1. Check if user already exists
    const existingUser = await User.findOne({ email: body.email });
    if (existingUser) {
      return NextResponse.json({ error: "A user with this email already exists." }, { status: 400 });
    }

    const { token, tokenHash } = generateInvitationToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // 2. Create/Update Invitation record
    const invitation = await Invitation.findOneAndUpdate(
      { email: body.email },
      {
        $set: {
          roles: body.roles,
          tokenHash: tokenHash,
          invitedBy: userId,
          expiresAt: expiresAt,
        },
      },
      { upsert: true, new: true }
    ).lean();

    const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/invite/${token}`;

    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>You've been invited!</h2>
        <p>You have been invited to join the <strong>Trendsposts</strong> dashboard.</p>
        <p>Click the link below to accept your invitation and set up your password. This link will expire in 7 days.</p>
        <a href="${acceptUrl}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px;">Accept Invitation</a>
        <hr style="margin-top: 30px; border: none; border-top: 1px solid #eaeaea;" />
        <p style="font-size: 12px; color: #666;">If you didn't expect this invitation, you can simply ignore this email.</p>
      </div>
    `;

    const emailSent = await sendEmail({
      to: body.email,
      subject: "You've been invited to Trendsposts!",
      html: htmlBody,
    });

    return NextResponse.json({
      success: true,
      emailDispatched: emailSent,
      invitation: {
        token,
        email: body.email,
        expiresAt,
        acceptUrl: `/auth/invite/${token}`,
      },
    });
  } catch (err) {
    const apiError = toApiError(err);
    const status =
      apiError.error === "Validation error" ? 400 : apiError.error === "Forbidden" ? 403 : 500;
    return NextResponse.json(apiError, { status });
  }
}
