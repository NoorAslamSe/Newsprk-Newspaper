import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { requireSession } from "@/lib/auth/server";
import { toApiError } from "@/lib/api/errors";
import { z } from "zod";

const ProfileUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
});

export async function GET() {
  try {
    const session = await requireSession();
    await connectDB();
    
    const user = await User.findById(session.user.id)
      .select("name email roles isActive createdAt avatarUrl")
      .lean();
      
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    return NextResponse.json({ item: user });
  } catch (err) {
    const apiError = toApiError(err);
    const status = apiError.error === "Unauthorized" ? 401 : 500;
    return NextResponse.json(apiError, { status });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireSession();
    await connectDB();
    
    const body = ProfileUpdateSchema.parse(await req.json());
    
    // Build update object based on what was provided
    const updateData: Record<string, any> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.avatarUrl !== undefined) {
      updateData.avatarUrl = body.avatarUrl === "" ? null : body.avatarUrl;
    }
    
    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("name email roles isActive createdAt avatarUrl").lean();
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    return NextResponse.json({ item: user });
  } catch (err) {
    const apiError = toApiError(err);
    const status = 
      apiError.error === "Validation error" ? 400 : 
      apiError.error === "Unauthorized" ? 401 : 500;
    return NextResponse.json(apiError, { status });
  }
}
