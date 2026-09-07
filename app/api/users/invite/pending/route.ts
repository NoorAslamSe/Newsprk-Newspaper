import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Invitation } from "@/lib/models/Invitation";
import { requirePermission } from "@/lib/auth/server";
import { toApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePermission("users.manage");
    await connectDB();

    const invitations = await Invitation.find({
      expiresAt: { $gt: new Date() }
    })
    .sort({ createdAt: -1 })
    .populate("invitedBy", "name email")
    .lean();

    return NextResponse.json({ items: invitations });
  } catch (err) {
    return NextResponse.json(toApiError(err), { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await requirePermission("users.manage");
    await connectDB();
    
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await Invitation.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(toApiError(err), { status: 500 });
  }
}
