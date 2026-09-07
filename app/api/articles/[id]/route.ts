import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Article } from "@/lib/models/Article";
import { Category } from "@/lib/models/Category";
import { ObjectId } from "mongodb";
import { requirePermission } from "@/lib/auth/server";
import { notifySubscribersOfNewArticle } from "@/lib/email/notify";
import { PostUpdateSchema } from "@/lib/validations/post";

function buildArticleUpdateData(parsed: any) {
  // Build update data explicitly — only include fields that are present in parsed body
  const updateData: Record<string, any> = {};
  if (parsed.title !== undefined) updateData.title = parsed.title;
  if (parsed.slug !== undefined) updateData.slug = parsed.slug;
  if (parsed.excerpt !== undefined) updateData.excerpt = parsed.excerpt;
  if (parsed.category !== undefined) updateData.category = parsed.category;
  if (parsed.categoryLabel !== undefined) updateData.categoryLabel = parsed.categoryLabel;
  if (parsed.author !== undefined) updateData.author = parsed.author;
  if (parsed.authorName !== undefined) updateData.authorName = parsed.authorName;
  if (parsed.date !== undefined) updateData.date = parsed.date;
  if (parsed.readTime !== undefined) updateData.readTime = parsed.readTime;
  if (parsed.featured !== undefined) updateData.featured = parsed.featured;
  if (parsed.tags !== undefined) updateData.tags = parsed.tags;
  if (parsed.views !== undefined) updateData.views = parsed.views;
  if (parsed.status !== undefined) updateData.status = parsed.status;
  if (parsed.locale !== undefined) updateData.locale = parsed.locale;
  if (parsed.bodyContent !== undefined) updateData.bodyContent = parsed.bodyContent;
  if (parsed.keyTakeawaysContent !== undefined) updateData.keyTakeawaysContent = parsed.keyTakeawaysContent;
  if (parsed.finalThoughtsContent !== undefined) updateData.finalThoughtsContent = parsed.finalThoughtsContent;
  if (parsed.adOverrides !== undefined) updateData.adOverrides = parsed.adOverrides;

  // articleMedia — always set the full structure if any media field is provided
  if (parsed.articleMedia !== undefined) {
    updateData.articleMedia = {
      heroCoverMedia: {
        url: parsed.articleMedia.heroCoverMedia?.url || "",
        vastTagUrl: parsed.articleMedia.heroCoverMedia?.vastTagUrl || "",
        poster: parsed.articleMedia.heroCoverMedia?.poster || "",
      },
      postBodyMedia: {
        url: parsed.articleMedia.postBodyMedia?.url || "",
        vastTagUrl: parsed.articleMedia.postBodyMedia?.vastTagUrl || "",
        poster: parsed.articleMedia.postBodyMedia?.poster || "",
      },
      keyTakeawaysMedia: {
        url: parsed.articleMedia.keyTakeawaysMedia?.url || "",
        vastTagUrl: parsed.articleMedia.keyTakeawaysMedia?.vastTagUrl || "",
        poster: parsed.articleMedia.keyTakeawaysMedia?.poster || "",
      },
      finalThoughtsMedia: {
        url: parsed.articleMedia.finalThoughtsMedia?.url || "",
        vastTagUrl: parsed.articleMedia.finalThoughtsMedia?.vastTagUrl || "",
        poster: parsed.articleMedia.finalThoughtsMedia?.poster || "",
      },
    };
  }

  // v2.0 fields
  if (parsed.content_type !== undefined) updateData.content_type = parsed.content_type;
  if (parsed.entity_A !== undefined) updateData.entity_A = parsed.entity_A;
  if (parsed.entity_B !== undefined) updateData.entity_B = parsed.entity_B;
  if (parsed.verdict_winner !== undefined) updateData.verdict_winner = parsed.verdict_winner;
  if (parsed.spec_comparison_matrix !== undefined) updateData.spec_comparison_matrix = parsed.spec_comparison_matrix;
  if (parsed.pros_cons_A !== undefined) updateData.pros_cons_A = parsed.pros_cons_A;
  if (parsed.pros_cons_B !== undefined) updateData.pros_cons_B = parsed.pros_cons_B;
  if (parsed.when_loser_wins !== undefined) updateData.when_loser_wins = parsed.when_loser_wins;
  if (parsed.page_class !== undefined) updateData.page_class = parsed.page_class;
  if (parsed.structural_blocks !== undefined) updateData.structural_blocks = parsed.structural_blocks;
  if (parsed.reviewer !== undefined) updateData.reviewer = parsed.reviewer;
  if (parsed.methodology_ref !== undefined) updateData.methodology_ref = parsed.methodology_ref;
  if (parsed.affiliate_offer_ids !== undefined) updateData.affiliate_offer_ids = parsed.affiliate_offer_ids;
  if (parsed.seo_metadata !== undefined) updateData.seo_metadata = parsed.seo_metadata;
  if (parsed.hreflang_group_id !== undefined) updateData.hreflang_group_id = parsed.hreflang_group_id;
  if (parsed.videoAsset !== undefined) updateData.videoAsset = parsed.videoAsset;
  if (parsed.is_product !== undefined) updateData.is_product = parsed.is_product;
  if (parsed.product_name !== undefined) updateData.product_name = parsed.product_name;
  if (parsed.product_brand !== undefined) updateData.product_brand = parsed.product_brand;
  if (parsed.product_price !== undefined) updateData.product_price = parsed.product_price;

  const unsetFields: Record<string, number> = {
    image: 1,
    articleImages: 1,
    heroCoverImage: 1,
    postBodyImage: 1,
    keyTakeawaysImage: 1,
    finalThoughtsImage: 1,
    articleVideoUrls: 1
  };
  for (const key of Object.keys(unsetFields)) {
    if (updateData[key] !== undefined) delete updateData[key];
  }

  return updateData;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await connectDB();

    let query: any = {};
    if (ObjectId.isValid(id) && id.length === 24) {
      query = { _id: id };
    } else {
      query = { slug: id };
    }

    const a = await Article.findOne(query).lean();
    if (!a) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    return NextResponse.json({
      _id: a._id.toString(),
      slug: a.slug,
      title: a.title,
      excerpt: a.excerpt,
      category: a.category,
      categoryLabel: a.categoryLabel,
      author: a.author,
      authorName: a.authorName,
      date: a.date,
      readTime: a.readTime,
      image: a.articleMedia?.heroCoverMedia?.url || "",
      featured: a.featured,
      tags: a.tags,
      views: a.views,
      status: a.status,
      articleMedia: a.articleMedia || {},
      bodyContent: a.bodyContent,
      keyTakeawaysContent: a.keyTakeawaysContent,
      finalThoughtsContent: a.finalThoughtsContent,
      adOverrides: a.adOverrides || [],
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      id: a._id.toString(),
      is_product: a.is_product,
      product_name: a.product_name
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("articles.create");
    const { id } = await params;
    const rawBody = await request.json();
    
    await connectDB();

    // Validate with Zod — strips unknown fields, applies defaults
    let parsed;
    try {
      parsed = PostUpdateSchema.parse(rawBody);
    } catch (err: any) {
      return NextResponse.json(
        { error: "Validation error", details: err.errors?.map((e: any) => `${e.path.join(".")}: ${e.message}`).join("; ") ?? err.message },
        { status: 400 }
      );
    }

    if (parsed.status === "published") {
      await requirePermission("articles.publish");
    }

    // Verify category if provided
    let categoryLabel = parsed.categoryLabel || "";
    if (parsed.category) {
       if (parsed.category === "uncategorized") {
          return NextResponse.json(
            { error: "Validation error", details: "A valid category must be selected." },
            { status: 400 }
          );
       }
       const validCategory = await Category.findOne({ slug: parsed.category });
       if (!validCategory) {
         return NextResponse.json(
           { error: "Validation error", details: `The category '${parsed.category}' does not exist.` },
           { status: 400 }
         );
       }
       categoryLabel = validCategory.name;
    }

    // Build update data explicitly — only include fields that are present in parsed body
    const updateData = buildArticleUpdateData({ ...parsed, categoryLabel: parsed.categoryLabel || categoryLabel });

    const unsetFields = {
      image: 1,
      articleImages: 1,
      heroCoverImage: 1,
      postBodyImage: 1,
      keyTakeawaysImage: 1,
      finalThoughtsImage: 1,
      articleVideoUrls: 1
    };

    // Updates typically use ID in dashboard
    const query = ObjectId.isValid(id) ? { _id: id } : { slug: id };

    const prevArticle = await Article.findOne(query).lean();
    if (!prevArticle) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }
    const wasPublished = prevArticle.status === "published";

    const article = await Article.findOneAndUpdate(
      query,
      { 
        $set: updateData,
        $unset: unsetFields
      },
      { new: true, lean: true }
    );

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    if (!wasPublished && article.status === "published") {
      // Run in background
      notifySubscribersOfNewArticle(article).catch(console.error);
    }

    const a = article as any;
    return NextResponse.json({
      _id: a._id.toString(),
      slug: a.slug,
      title: a.title,
      excerpt: a.excerpt,
      category: a.category,
      categoryLabel: a.categoryLabel,
      author: a.author,
      authorName: a.authorName,
      date: a.date,
      readTime: a.readTime,
      featured: a.featured,
      tags: a.tags,
      views: a.views,
      status: a.status,
      articleMedia: a.articleMedia,
      bodyContent: a.bodyContent,
      keyTakeawaysContent: a.keyTakeawaysContent,
      finalThoughtsContent: a.finalThoughtsContent,
      adOverrides: a.adOverrides,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      id: a._id.toString()
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Valid article template positions
const ARTICLE_TEMPLATE_POSITIONS = [
  "top-leaderboard",
  "atf-rectangle",
  "sticky-footer",
  "top-article-sidebar",
  "in-content-1",
  "in-content-2",
  "sidebar-sticky",
  "bottom-article-sidebar"
] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("articles.create");
    const { id } = await params;
    const body = await request.json();
    
    if (body.status === "published") {
      await requirePermission("articles.publish");
    }

    await connectDB();

    // Detect if ID is a Mongo ObjectId or a Slug
    const query = ObjectId.isValid(id) ? { _id: id } : { slug: id };
    const article = await Article.findOne(query);

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Update adOverrides if provided
    if (body.adOverrides) {
      if (!Array.isArray(body.adOverrides)) {
        return NextResponse.json(
          { error: "Validation error", details: "adOverrides must be an array" },
          { status: 400 }
        );
      }

      // Optional: Add snippet existence verification here if needed

      article.adOverrides = body.adOverrides;
    }

    // Update status if provided (for bulk actions or simple status flips)
    let triggeredPublish = false;
    if (body.status && body.status !== article.status) {
      if (body.status === "published") {
        triggeredPublish = true;
      }
      article.status = body.status;
    }

    await article.save();

    if (triggeredPublish) {
      notifySubscribersOfNewArticle(article).catch(console.error);
    }

    const a = article.toObject() as any;
    return NextResponse.json({
      item: {
        _id: a._id.toString(),
        slug: a.slug,
        title: a.title,
        status: a.status,
        adOverrides: a.adOverrides,
        id: a._id.toString()
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("articles.create");
    const { id } = await params;

    await connectDB();
    

    const query = ObjectId.isValid(id) ? { _id: id } : { slug: id };
    const deleted = await Article.findOneAndDelete(query);
    
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
