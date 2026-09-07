import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { RolePolicy } from "@/lib/models/RolePolicy";
import { requirePermission } from "@/lib/auth/server";
import { invalidatePolicyCache } from "@/lib/auth/rbac";
import { z } from "zod";

const UpdatePolicySchema = z.object({
  roleName: z.string().min(1),
  permissions: z.array(z.string()),
});

export async function GET() {
  try {
    await requirePermission("settings.manage");
    await connectDB();
    const policies = await RolePolicy.find({}).lean();
    return NextResponse.json({ items: policies });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}

export async function POST(req: Request) {
  try {
    await requirePermission("settings.manage");
    await connectDB();
    
    // Accept an array of objects to bulk update roles
    const body = z.array(UpdatePolicySchema).parse(await req.json());
    
    for (const item of body) {
      if (item.roleName === "admin") {
        // Superadmin permissions are intrinsic, skip saving to prevent hard overrides
        continue;
      }
      await RolePolicy.findOneAndUpdate(
        { roleName: item.roleName },
        { permissions: item.permissions },
        { upsert: true, new: true }
      );
    }

    // Immediately flush cache so next requests use new perms!
    invalidatePolicyCache();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
