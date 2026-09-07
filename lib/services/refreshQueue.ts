import { connectDB } from "@/lib/db";
import { Article } from "@/lib/models/Article";
import { PublishEvent } from "@/lib/models/PublishEvent";

const REFRESH_INTERVALS: Record<string, number> = {
  phones: 90, // 3 months
  laptops: 90,
  software: 180, // 6 months
  default: 180,
};

export async function getStaleArticles(): Promise<any[]> {
  await connectDB();

  const now = new Date();
  return Article.find({
    status: "published",
    refresh_due_date: { $lte: now },
    page_class: { $in: ["money", "support"] },
  })
    .sort({ refresh_due_date: 1 })
    .limit(10)
    .lean();
}

export async function markForRefresh(articleId: string): Promise<void> {
  await connectDB();

  await PublishEvent.create({
    articleId,
    event: "received",
    publisherId: "refresh_queue",
    details: { reason: "stale_refresh" },
  });
}

export async function updateRefreshDate(
  articleId: string,
  category: string
): Promise<void> {
  await connectDB();

  const intervalDays = REFRESH_INTERVALS[category] || REFRESH_INTERVALS.default;
  const refreshDue = new Date();
  refreshDue.setDate(refreshDue.getDate() + intervalDays);

  await Article.updateOne(
    { _id: articleId },
    {
      $set: {
        last_verified_date: new Date(),
        refresh_due_date: refreshDue,
      },
    }
  );
}

export async function getRefreshStats(): Promise<{
  total: number;
  overdue: number;
  dueThisWeek: number;
}> {
  await connectDB();

  const now = new Date();
  const weekFromNow = new Date();
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  const total = await Article.countDocuments({ status: "published" });
  const overdue = await Article.countDocuments({
    status: "published",
    refresh_due_date: { $lte: now },
  });
  const dueThisWeek = await Article.countDocuments({
    status: "published",
    refresh_due_date: { $gt: now, $lte: weekFromNow },
  });

  return { total, overdue, dueThisWeek };
}
