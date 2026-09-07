"use server";

/**
 * Atomically increments the views counter for an article.
 * Uses MongoDB $inc so concurrent page-loads never overwrite each other.
 */

import { connectDB } from "@/lib/db";
import { Article } from "@/lib/models/Article";

export async function incrementArticleViewsAction(slug: string) {
  try {
    await connectDB();
    
    // Increment the views field by 1
    const result = await Article.findOneAndUpdate(
      { slug },
      { $inc: { views: 1 } },
      { new: true }
    );
    
    if (!result) {
      return { success: false, error: "Article not found" };
    }
    
    return { success: true, views: result.views };
  } catch (error) {
    console.error("Error incrementing views:", error);
    return { success: false, error: "Failed to increment views" };
  }
}
