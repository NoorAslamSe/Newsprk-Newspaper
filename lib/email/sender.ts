import nodemailer from "nodemailer";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM || '"Trendsposts" <noreply@Trendsposts.com>';

  // Fail gracefully if SMTP is not configured
  if (!host || !user || !pass) {
    console.warn("⚠️ SMTP credentials not fully configured. Email was not sent to: " + to);
    // In development mode, we could log the email content
    if (process.env.NODE_ENV === "development") {
      console.log(`[Email Mock] To: ${to}\nSubject: ${subject}\nBody: ${html.substring(0, 100)}...`);
    }
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: { user, pass },
    });

    await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });

    console.log(`✅ Email sent successfully to: ${to}`);
    return true;
  } catch (error) {
    console.error("❌ Failed to send email:", error);
    return false;
  }
}
