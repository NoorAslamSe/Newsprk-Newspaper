"use server";

import { connectDB } from "@/lib/db";
import { ApiToken } from "@/lib/models/ApiToken";
import { getSession } from "@/lib/auth/server";
import { generateApiToken } from "@/lib/auth/apiAuth";
import { Types } from "mongoose";

export async function createApiTokenAction(name: string, isLive: boolean = true) {
  try {
    const session = await getSession();
    if (!session?.user?.id) throw new Error("Unauthorized");

    if (!name || name.trim() === "") throw new Error("Token name is required");

    await connectDB();

    const { plainToken, tokenHash, prefix } = generateApiToken(isLive);

    const newToken = await ApiToken.create({
      userId: new Types.ObjectId(session.user.id),
      name: name.trim(),
      tokenHash,
      prefix,
      revoked: false,
    });

    // We ONLY return the plain token THIS ONE TIME.
    // It is not stored anywhere else!
    return {
      success: true,
      data: {
        id: newToken._id.toString(),
        name: newToken.name,
        prefix: newToken.prefix,
        createdAt: newToken.createdAt,
        plainToken,
      },
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to create token" };
  }
}

export async function listApiTokensAction() {
  try {
    const session = await getSession();
    if (!session?.user?.id) throw new Error("Unauthorized");

    await connectDB();

    const tokens = await ApiToken.find({ userId: new Types.ObjectId(session.user.id) })
      .sort({ createdAt: -1 })
      .select("-tokenHash") // never leak hashes to client unnecessarily
      .lean();

    return {
      success: true,
      data: tokens.map((t: any) => ({
        id: t._id.toString(),
        name: t.name,
        prefix: t.prefix,
        lastUsedAt: t.lastUsedAt,
        createdAt: t.createdAt,
        revoked: t.revoked,
      })),
    };
  } catch (error) {
    return { success: false, error: "Failed to fetch tokens" };
  }
}

export async function revokeApiTokenAction(tokenId: string) {
  try {
    const session = await getSession();
    if (!session?.user?.id) throw new Error("Unauthorized");

    await connectDB();

    const token = await ApiToken.findOne({
      _id: new Types.ObjectId(tokenId),
      userId: new Types.ObjectId(session.user.id),
    });

    if (!token) throw new Error("Token not found");

    token.revoked = true;
    await token.save();

    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to revoke token" };
  }
}
