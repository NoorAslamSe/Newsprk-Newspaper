import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { toApiError } from "@/lib/api/errors";
import { requirePermission } from "@/lib/auth/server";
import { canDeleteUser, canModifyUser } from "@/lib/auth/governance";
import { z } from "zod";

const BulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1, "At least one ID is required"),
});

const BulkUpdateSchema = z.object({
  ids: z.array(z.string()).min(1, "At least one ID is required"),
  isActive: z.boolean(),
});

export async function DELETE(req: Request) {
  try {
    const session = await requirePermission("users.manage");
    await connectDB();

    const body = BulkDeleteSchema.parse(await req.json());
    const actorRoles = (session.user.roles ?? []) as string[];

    // Governance check on each target before proceeding
    const targets = await User.find({ _id: { $in: body.ids } }).lean();
    for (const target of targets) {
      const check = await canDeleteUser({
        actorId: session.user.id,
        actorRoles,
        targetId: target._id.toString(),
        targetRoles: (target.roles ?? []) as string[],
      });
      if (!check.allowed) {
        return NextResponse.json(
          { error: `Cannot delete ${target.email}: ${check.reason}` },
          { status: 403 }
        );
      }
    }

    const result = await User.deleteMany({
      _id: { $in: body.ids },
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    const apiError = toApiError(err);
    const status =
      apiError.error === "Validation error"
        ? 400
        : apiError.error === "Forbidden"
          ? 403
          : 500;
    return NextResponse.json(apiError, { status });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requirePermission("users.manage");
    await connectDB();

    const body = BulkUpdateSchema.parse(await req.json());
    const actorRoles = (session.user.roles ?? []) as string[];

    // Governance check on each target before proceeding
    const targets = await User.find({ _id: { $in: body.ids } }).lean();
    for (const target of targets) {
      const check = await canModifyUser({
        actorId: session.user.id,
        actorRoles,
        targetId: target._id.toString(),
        targetRoles: (target.roles ?? []) as string[],
      });
      if (!check.allowed) {
        return NextResponse.json(
          { error: `Cannot update ${target.email}: ${check.reason}` },
          { status: 403 }
        );
      }
    }

    const result = await User.updateMany(
      { _id: { $in: body.ids } },
      { $set: { isActive: body.isActive } }
    );

    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    const apiError = toApiError(err);
    const status =
      apiError.error === "Validation error"
        ? 400
        : apiError.error === "Forbidden"
          ? 403
          : 500;
    return NextResponse.json(apiError, { status });
  }
}
