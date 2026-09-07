import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { AdSnippet } from "@/lib/models/AdSnippet";
import { toApiError } from "@/lib/api/errors";
import { requirePermission } from "@/lib/auth/server";
import { z } from "zod";

const BulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1, "At least one ID is required"),
});

const BulkUpdateSchema = z.object({
  ids: z.array(z.string()).min(1, "At least one ID is required"),
  enabled: z.boolean(),
});

export async function DELETE(req: Request) {
  try {
    await requirePermission("adsmanager.manage");
    await connectDB();

    const body = BulkDeleteSchema.parse(await req.json());

    const result = await AdSnippet.deleteMany({
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
    await requirePermission("adsmanager.manage");
    await connectDB();

    const body = BulkUpdateSchema.parse(await req.json());

    const result = await AdSnippet.updateMany(
      { _id: { $in: body.ids } },
      { $set: { enabled: body.enabled } }
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
