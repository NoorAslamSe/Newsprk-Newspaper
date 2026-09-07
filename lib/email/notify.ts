import { Subscriber } from "@/lib/models/Subscriber";
import { sendNotificationEmail } from "./service";
import { connectDB } from "@/lib/db";

/**
 * Background function to send notifications to all active subscribers.
 * We process in batches to prevent overwhelming the SMTP connection
 * and to keep memory usage low.
 */
export async function notifySubscribersOfNewArticle(article: any) {
  try {
    await connectDB();
    const subscribers = await Subscriber.find({ isActive: true });
    
    if (subscribers.length === 0) return;
    
    console.log(`Sending article notification to ${subscribers.length} active subscribers...`);
    
    // Process in batches
    const BATCH_SIZE = 20;
    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const batch = subscribers.slice(i, i + BATCH_SIZE);
      
      await Promise.all(
        batch.map(async (sub) => {
          try {
            await sendNotificationEmail(sub.email, article, sub.unsubscribeToken);
          } catch (err) {
            console.error(`Failed to send notification to ${sub.email}:`, err);
          }
        })
      );
      
      // Delay between batches to respect SMTP rate limits
      if (i + BATCH_SIZE < subscribers.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`Finished sending article notifications for "${article.title}".`);
  } catch (err) {
    console.error("Error in notifySubscribersOfNewArticle:", err);
  }
}
