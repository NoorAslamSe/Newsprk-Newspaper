import { PostEditor } from "@/components/admin/post-editor";
import { connectDB } from "@/lib/db";
import { Article } from "@/lib/models/Article";
import { ObjectId } from "mongodb";

function buildInitial(article: any) {
  return {
    title: article.title || "",
    slug: article.slug || "",
    excerpt: article.excerpt || "",
    category: article.category || "",
    categoryLabel: article.categoryLabel || "",
    author: article.author || "admin",
    authorName: article.authorName || "Admin",
    date: article.date || new Date().toISOString(),
    readTime: article.readTime || 5,
    featured: article.featured || false,
    tags: article.tags || [],
    views: article.views || 0,
    status: article.status || "draft",
    articleMedia: {
      heroCoverMedia: {
        url: article.articleMedia?.heroCoverMedia?.url || article.articleImages?.heroCoverImage || article.heroCoverImage || "",
        vastTagUrl: article.articleMedia?.heroCoverMedia?.vastTagUrl || "",
        poster: article.articleMedia?.heroCoverMedia?.poster || ""
      },
      postBodyMedia: {
        url: article.articleMedia?.postBodyMedia?.url || article.articleImages?.postBodyImage || article.postBodyImage || "",
        vastTagUrl: article.articleMedia?.postBodyMedia?.vastTagUrl || "",
        poster: article.articleMedia?.postBodyMedia?.poster || ""
      },
      keyTakeawaysMedia: {
        url: article.articleMedia?.keyTakeawaysMedia?.url || article.articleImages?.keyTakeawaysImage || article.keyTakeawaysImage || "",
        vastTagUrl: article.articleMedia?.keyTakeawaysMedia?.vastTagUrl || "",
        poster: article.articleMedia?.keyTakeawaysMedia?.poster || ""
      },
      finalThoughtsMedia: {
        url: article.articleMedia?.finalThoughtsMedia?.url || article.articleImages?.finalThoughtsImage || article.finalThoughtsImage || "",
        vastTagUrl: article.articleMedia?.finalThoughtsMedia?.vastTagUrl || "",
        poster: article.articleMedia?.finalThoughtsMedia?.poster || ""
      }
    },
    bodyContent: article.bodyContent || "",
    keyTakeawaysContent: article.keyTakeawaysContent || "",
    finalThoughtsContent: article.finalThoughtsContent || "",
  };
}

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  try {
    // Connect directly to database instead of API call
    await connectDB();
    
    if (!ObjectId.isValid(id)) {
      throw new Error("Invalid post ID format");
    }

    const article = await Article.findById(id).lean();

    if (!article) {
      throw new Error("Post not found");
    }

    return (
      <div className="px-4 py-4 lg:px-6 lg:py-6">
        <PostEditor
          mode="edit"
          postId={id}
          initial={buildInitial(article)}
        />
      </div>
    );
  } catch (error: any) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
        <p className="text-muted-foreground">{error.message}</p>
      </div>
    );
  }
}
