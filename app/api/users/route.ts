import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { UserCreateSchema } from "@/lib/validations/user";
import { toApiError } from "@/lib/api/errors";
import { requirePermission } from "@/lib/auth/server";
import { hashPassword } from "@/lib/auth/password";
import { canAssignRoles } from "@/lib/auth/governance";

export async function GET() {
  try {
    // For development, bypass authentication requirement
    let session = null;
    try {
      session = await requirePermission("users.manage");
    } catch (error) {
      // If authentication fails, create a mock session for development
      if (process.env.NODE_ENV === 'development') {
        session = {
          user: {
            id: 'dev-user',
            name: 'Development User',
            email: 'dev@example.com',
            roles: ['admin']
          }
        };
      } else {
        throw error;
      }
    }
    
    await connectDB();
    const items = await User.find({})
      .select("name email roles isActive createdAt updatedAt")
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ items });
  } catch (err) {
    const apiError = toApiError(err);
    const status = apiError.error === "Forbidden" ? 403 : 500;
    return NextResponse.json(apiError, { status });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requirePermission("users.manage");
    await connectDB();
    const body = UserCreateSchema.parse(await req.json());

    // ── Governance: Can the actor assign these roles? ──
    const actorRoles = (session.user.roles ?? []) as string[];
    if (body.roles) {
      const assignCheck = await canAssignRoles(actorRoles, body.roles);
      if (!assignCheck.allowed) {
        return NextResponse.json({ error: assignCheck.reason }, { status: 403 });
      }
    }

    const passwordHash = await hashPassword(body.password);
    const created = await User.create({
      name: body.name,
      email: body.email,
      passwordHash,
      roles: body.roles,
      isActive: true,
      createdBy: session.user.id,
    });
    return NextResponse.json({ item: created }, { status: 201 });
  } catch (err) {
    const apiError = toApiError(err);
    const status =
      apiError.error === "Validation error" ? 400 : apiError.error === "Forbidden" ? 403 : 500;
    return NextResponse.json(apiError, { status });
  }
}
