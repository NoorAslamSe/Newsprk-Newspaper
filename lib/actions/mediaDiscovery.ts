'use server';

import { connectDB } from "@/lib/db";
import { Media } from "@/lib/models/Media";
import { getSupabaseAdminClient, getPublicUrl } from "@/lib/storage/supabase";
import { Types } from "mongoose";
import { getSession } from "@/lib/auth/server";

/**
 * Discovers and imports files from a Supabase storage folder that were uploaded
 * outside the app (e.g., via the Supabase dashboard or another tool).
 * Three-step process: List → Deduplicate → Create Media records.
 */
export async function syncMediaFolderAction(folderName: string = 'ads') {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();
    const admin = getSupabaseAdminClient();
    const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'media';
    
    // 1. List files in the storage folder
    const { data: files, error } = await admin.storage.from(bucket).list(folderName, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'name', order: 'desc' },
    });

    if (error) throw error;
    if (!files || files.length === 0) {
      return { success: true, count: 0, message: "No files found in storage folder." };
    }

    // 2. Map existing items to avoid duplicates
    const existingPaths = await Media.find({ 
      $or: [
        { folder: folderName },
        { objectPath: { $regex: `^${folderName}/` } }
      ]
    }).distinct('objectPath');

    const existingPathSet = new Set(existingPaths);
    let createdCount = 0;

    // Step 3: Create a Media record for each file not already in the DB
    for (const file of files) {
      if (file.name === '.emptyFolderPlaceholder') continue; // Supabase creates this for empty folders

      const objectPath = `${folderName}/${file.name}`;
      if (existingPathSet.has(objectPath)) continue; // Skip already-known files

      const publicUrl = getPublicUrl(bucket, objectPath);
      const mimeType = file.metadata?.mimetype || (
        file.name.endsWith('.mp4') ? 'video/mp4' : 
        file.name.endsWith('.png') ? 'image/png' : 
        file.name.endsWith('.jpg') || file.name.endsWith('.jpeg') ? 'image/jpeg' : 
        'image/webp'
      );

      await Media.create({
        filename: file.name,
        mimeType: mimeType,
        size: file.metadata?.size || 0,
        url: publicUrl,
        provider: 'supabase',
        folder: folderName,
        bucket: bucket,
        objectPath: objectPath,
        publicUrl: publicUrl,
        uploadedBy: new Types.ObjectId(session.user.id),
        metadata: {
            format: file.name.split('.').pop(),
            width: null,
            height: null
        }
      });
      createdCount++;
    }

    return { 
      success: true, 
      count: createdCount, 
      message: `Successfully synchronized ${createdCount} new files from ${folderName} folder.` 
    };
  } catch (error) {
    console.error('Sync error:', error);
    return { success: false, error: error instanceof Error ? error.message : "Sync failed" };
  }
}
