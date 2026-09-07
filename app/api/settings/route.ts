import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Setting } from "@/lib/models/Setting";
import { SettingsUpdateSchema } from "@/lib/validations/settings";
import { toApiError } from "@/lib/api/errors";
import { requirePermission } from "@/lib/auth/server";
import { AuditLog } from "@/lib/models/AuditLog";
import { Types } from "mongoose";
import { DEPLOYMENT_LOCALE } from "@/lib/i18n";

const SETTINGS_KEY = "site";

export async function GET() {
  try {
    await requirePermission("settings.manage");
    await connectDB();
    const doc = await Setting.findOne({ key: SETTINGS_KEY, locale: DEPLOYMENT_LOCALE }).lean();
    return NextResponse.json({ item: doc?.value ?? {} });
  } catch (err) {
    const apiError = toApiError(err);
    const status =
      apiError.error === "Unauthorized" ? 401 :
      apiError.error === "Forbidden" ? 403 : 500;
    return NextResponse.json(apiError, { status });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await requirePermission("settings.manage");
    await connectDB();
    const body = SettingsUpdateSchema.parse(await req.json());

    const current = await Setting.findOne({ key: SETTINGS_KEY, locale: DEPLOYMENT_LOCALE });
    const nextValue = { ...(current?.value ?? {}), ...body };

    await Setting.updateOne(
      { key: SETTINGS_KEY, locale: DEPLOYMENT_LOCALE },
      { $set: { value: nextValue } },
      { upsert: true }
    );

    await AuditLog.create({
      action: "settings.update",
      actorUserId: new Types.ObjectId(session.user.id),
      resourceType: "Setting",
      meta: Object.keys(body),
    });

    return NextResponse.json({ item: nextValue });
  } catch (err) {
    const apiError = toApiError(err);
    const status =
      apiError.error === "Validation error" ? 400 : apiError.error === "Forbidden" ? 403 : 500;
    return NextResponse.json(apiError, { status });
  }
}

