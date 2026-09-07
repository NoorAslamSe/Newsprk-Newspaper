import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { UserUpdateSchema } from "@/lib/validations/user";
import { toApiError } from "@/lib/api/errors";
import { requirePermission } from "@/lib/auth/server";
import { AuditLog } from "@/lib/models/AuditLog";
import {
  canModifyUser,
  canDeleteUser,
  canAssignRoles,
  ensureNotLastSuperAdmin,
  ensureNotLastAdmin,
} from "@/lib/auth/governance";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission("users.manage");
    await connectDB();
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid user id." }, { status: 400 });

    const targetUser = await User.findById(id);
    if (!targetUser) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const body = UserUpdateSchema.parse(await req.json());

    const actorRoles = (session.user.roles ?? []) as string[];
    const targetRoles = (targetUser.roles ?? []) as string[];

    // ── Governance: Can this actor modify this target? ──
    const modifyCheck = await canModifyUser({
      actorId: session.user.id,
      actorRoles,
      targetId: targetUser._id.toString(),
      targetRoles,
    });
    if (!modifyCheck.allowed) {
      return NextResponse.json({ error: modifyCheck.reason }, { status: 403 });
    }

    // ── Governance: Can the actor assign these specific roles? ──
    if (body.roles) {
      const assignCheck = await canAssignRoles(actorRoles, body.roles);
      if (!assignCheck.allowed) {
        return NextResponse.json({ error: assignCheck.reason }, { status: 403 });
      }

      // If demoting from admin/super_admin, ensure we're not removing the last one
      const isLosingAdminAccess = targetRoles.some(r => ["admin", "super_admin"].includes(r))
        && !body.roles.some(r => ["admin", "super_admin"].includes(r));
      if (isLosingAdminAccess) {
        const lastAdminCheck = await ensureNotLastAdmin(targetRoles);
        if (!lastAdminCheck.allowed) {
          return NextResponse.json({ error: lastAdminCheck.reason }, { status: 403 });
        }
      }

      // Super Admin demotion requires last-SA check
      if (targetRoles.includes("super_admin") && !body.roles.includes("super_admin")) {
        const lastSaCheck = await ensureNotLastSuperAdmin(targetRoles);
        if (!lastSaCheck.allowed) {
          return NextResponse.json({ error: lastSaCheck.reason }, { status: 403 });
        }
      }
    }

    // ── Governance: Deactivation checks ──
    if (body.isActive === false) {
      const lastAdminCheck = await ensureNotLastAdmin(targetRoles);
      if (!lastAdminCheck.allowed) {
        return NextResponse.json({ error: lastAdminCheck.reason }, { status: 403 });
      }
    }

    // ── Apply changes ──
    if (body.name !== undefined) targetUser.name = body.name;
    if (body.roles !== undefined) targetUser.roles = body.roles;
    if (body.isActive !== undefined) targetUser.isActive = body.isActive;
    await targetUser.save();

    // ── Audit logging ──
    if (body.roles !== undefined) {
      await AuditLog.create({
        action: "user.roles.update",
        actorUserId: new Types.ObjectId(session.user.id),
        resourceType: "User",
        resourceId: targetUser._id,
        meta: { roles: body.roles, previousRoles: targetRoles },
      });
    }
    if (body.isActive === false) {
      await AuditLog.create({
        action: "user.deactivate",
        actorUserId: new Types.ObjectId(session.user.id),
        resourceType: "User",
        resourceId: targetUser._id,
      });
    }

    return NextResponse.json({ item: targetUser });
  } catch (err) {
    const apiError = toApiError(err);
    const status =
      apiError.error === "Validation error" ? 400 : apiError.error === "Forbidden" ? 403 : 500;
    return NextResponse.json(apiError, { status });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission("users.manage");
    await connectDB();
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid user id." }, { status: 400 });

    const targetUser = await User.findById(id);
    if (!targetUser) return NextResponse.json({ error: "Not found." }, { status: 404 });

    const actorRoles = (session.user.roles ?? []) as string[];
    const targetRoles = (targetUser.roles ?? []) as string[];

    // ── Governance: Can this actor delete this target? ──
    const deleteCheck = await canDeleteUser({
      actorId: session.user.id,
      actorRoles,
      targetId: targetUser._id.toString(),
      targetRoles,
    });
    if (!deleteCheck.allowed) {
      return NextResponse.json({ error: deleteCheck.reason }, { status: 403 });
    }

    // ── Governance: Last admin/super_admin protection ──
    const lastAdminCheck = await ensureNotLastAdmin(targetRoles);
    if (!lastAdminCheck.allowed) {
      return NextResponse.json({ error: lastAdminCheck.reason }, { status: 403 });
    }

    await User.findByIdAndDelete(id);

    await AuditLog.create({
      action: "user.delete",
      actorUserId: new Types.ObjectId(session.user.id),
      resourceType: "User",
      resourceId: new Types.ObjectId(id),
      meta: { name: targetUser.name, email: targetUser.email, roles: targetUser.roles },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const apiError = toApiError(err);
    const status = apiError.error === "Forbidden" ? 403 : 500;
    return NextResponse.json(apiError, { status });
  }
}
