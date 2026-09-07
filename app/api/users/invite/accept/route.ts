import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { Invitation } from "@/lib/models/Invitation";
import { hashPassword } from "@/lib/auth/password";
import { toApiError } from "@/lib/api/errors";

const BodySchema = z.object({
  token: z.string().min(1),
  name: z.string().min(1).max(120),
  password: z.string().min(8).max(200),
});

export async function POST(req: Request) {
  try {
    const body = BodySchema.parse(await req.json());
    const tokenHash = crypto.createHash("sha256").update(body.token).digest("hex");

    await connectDB();
    const invitation = await Invitation.findOne({
      tokenHash: tokenHash,
      expiresAt: { $gt: new Date() },
    });
    
    if (!invitation) {
      return NextResponse.json({ error: "Invitation is invalid or expired." }, { status: 400 });
    }

    // Prevent duplicate user creation if someone accepts the same invite twice
    const existingUser = await User.findOne({ email: invitation.email });
    if (existingUser) {
      // Clean up the invitation since the user already exists
      await Invitation.findByIdAndDelete(invitation._id);
      return NextResponse.json({ error: "An account with this email already exists. Please sign in instead." }, { status: 400 });
    }

    // 1. Create the new User — link back to who invited them
    const passwordHash = await hashPassword(body.password);
    const user = await User.create({
      name: body.name,
      email: invitation.email,
      passwordHash: passwordHash,
      roles: invitation.roles,
      isActive: true,
      createdBy: invitation.invitedBy, // Track who invited this user
    });

    // 2. Delete the Invitation
    await Invitation.findByIdAndDelete(invitation._id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    const apiError = toApiError(err);
    const status = apiError.error === "Validation error" ? 400 : 500;
    return NextResponse.json(apiError, { status });
  }
}
