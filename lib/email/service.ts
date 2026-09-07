import { sendEmail } from "./sender";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const baseHtml = (content: string, footerAddon: string = "") => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 32px; border-radius: 8px; margin-top: 32px; margin-bottom: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .header { text-align: center; margin-bottom: 32px; }
    .logo { font-size: 24px; font-weight: bold; color: #ff184e; text-decoration: none; }
    .content { color: #3f3f46; line-height: 1.6; font-size: 16px; }
    .btn { display: inline-block; background-color: #ff184e; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin-top: 16px; margin-bottom: 16px; text-align: center; }
    .footer { margin-top: 32px; text-align: center; color: #a1a1aa; font-size: 14px; border-top: 1px solid #e4e4e7; padding-top: 24px; }
    .unsubscribe { color: #a1a1aa; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="${BASE_URL}" class="logo">TrendsPosts</a>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>TrendsPosts - Your daily source for viral stories.</p>
      ${footerAddon}
    </div>
  </div>
</body>
</html>
`;

export async function sendInviteEmail(email: string, token: string) {
  const inviteUrl = `${BASE_URL}/auth/accept-invite?token=${token}&email=${encodeURIComponent(email)}`;
  
  const html = baseHtml(`
    <h2>You've been invited!</h2>
    <p>You have been invited to join the Trendsposts team.</p>
    <p>Click the button below to accept your invitation and set up your account. This link will expire in 24 hours.</p>
    <div style="text-align: center;">
      <a href="${inviteUrl}" class="btn">Accept Invitation</a>
    </div>
    <p>If you did not expect this invitation, you can safely ignore this email.</p>
  `);

  return sendEmail({
    to: email,
    subject: "You've been invited to join Trendsposts",
    html
  });
}

export async function sendWelcomeEmail(email: string) {
  const html = baseHtml(`
    <h2>Welcome to Trendsposts!</h2>
    <p>We're thrilled to have you on board.</p>
    <p>Get ready to discover the latest viral stories, trending news, and the content everyone is talking about.</p>
    <div style="text-align: center;">
      <a href="${BASE_URL}" class="btn">Explore Trendsposts</a>
    </div>
  `);

  return sendEmail({
    to: email,
    subject: "Welcome to Trendsposts!",
    html
  });
}

export async function sendNotificationEmail(email: string, article: any, unsubscribeToken: string) {
  const articleUrl = `${BASE_URL}/posts/${article.slug}`;
  const unsubscribeUrl = `${BASE_URL}/api/unsubscribe?token=${unsubscribeToken}`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 32px; border-radius: 8px; margin-top: 32px; margin-bottom: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .header { text-align: center; margin-bottom: 32px; }
    .logo { font-size: 24px; font-weight: bold; color: #ff184e; text-decoration: none; }
    .content { color: #3f3f46; line-height: 1.6; font-size: 16px; }
    .article-image { width: 100%; border-radius: 8px; margin-bottom: 16px; max-height: 300px; object-fit: cover; }
    .btn { display: inline-block; background-color: #ff184e; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin-top: 16px; margin-bottom: 16px; text-align: center; }
    .footer { margin-top: 32px; text-align: center; color: #a1a1aa; font-size: 14px; border-top: 1px solid #e4e4e7; padding-top: 24px; }
    .unsubscribe { color: #a1a1aa; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="${BASE_URL}" class="logo">Trendsposts</a>
    </div>
    <div class="content">
      <h2>${article.title}</h2>
      ${article.coverImage ? `<img src="${article.coverImage}" alt="Cover Image" class="article-image" />` : ''}
      <p>${article.excerpt}</p>
      <div style="text-align: center;">
        <a href="${articleUrl}" class="btn">Read More</a>
      </div>
    </div>
    <div class="footer">
      <p>You received this email because you are subscribed to Trendsposts.</p>
      <p><a href="${unsubscribeUrl}" class="unsubscribe">Unsubscribe here</a></p>
    </div>
  </div>
</body>
</html>`;

  return sendEmail({
    to: email,
    subject: `New Article: ${article.title}`,
    html
  });
}
