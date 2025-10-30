import { RequestHandler } from "express";
import nodemailer from "nodemailer";

const SMTP_HOST = process.env.EMAIL_HOST;
const SMTP_PORT = parseInt(process.env.EMAIL_PORT || "587");
const SMTP_USER = process.env.EMAIL_USER;
const SMTP_PASS = process.env.EMAIL_PASSWORD;
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@sharekte.com";

let transporter: nodemailer.Transporter | null = null;

/**
 * Initialize email transporter
 */
function getTransporter() {
  if (transporter) return transporter;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn("Email configuration not set - notifications will be logged only");
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return transporter;
}

/**
 * Send email notification
 */
export const sendEmailNotification: RequestHandler = async (req, res) => {
  try {
    const { to, subject, message, notificationType, details } = req.body;

    if (!to || !subject || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const transporter = getTransporter();

    // Build HTML email
    const htmlContent = buildEmailTemplate(subject, message, notificationType, details);

    // Send email
    if (transporter) {
      try {
        await transporter.sendMail({
          from: FROM_EMAIL,
          to,
          subject,
          html: htmlContent,
          text: message,
        });

        console.log(`Email sent to ${to}: ${subject}`);
        return res.json({ success: true, message: "Email sent successfully" });
      } catch (emailError) {
        console.error("SMTP Error:", emailError);
        // Log but don't fail - we still want to track the notification
        return res.status(500).json({ success: false, error: "Failed to send email" });
      }
    } else {
      // No SMTP configured - log to console
      console.log(`[NOTIFICATION] To: ${to}`);
      console.log(`[NOTIFICATION] Subject: ${subject}`);
      console.log(`[NOTIFICATION] Message: ${message}`);
      console.log(`[NOTIFICATION] Type: ${notificationType}`);
      console.log(`[NOTIFICATION] Details:`, details);

      return res.json({ success: true, message: "Notification logged (SMTP not configured)" });
    }
  } catch (error) {
    console.error("Notification error:", error);
    res.status(500).json({ error: "Failed to process notification" });
  }
};

/**
 * Build HTML email template
 */
function buildEmailTemplate(
  subject: string,
  message: string,
  notificationType: string,
  details: Record<string, unknown>
): string {
  const colors = {
    primary: "#2563EB",
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
  };

  const notificationColors: Record<string, string> = {
    "order-created": colors.success,
    "payment-received": colors.success,
    "status-changed": colors.primary,
    "refund-requested": colors.warning,
    "refund-approved": colors.success,
    "refund-rejected": colors.danger,
    "document-uploaded": colors.primary,
    "renewal-reminder": colors.warning,
    "order-cancelled": colors.danger,
  };

  const accentColor = notificationColors[notificationType] || colors.primary;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .content { background: #f9fafb; padding: 30px; border-left: 4px solid ${accentColor}; }
        .details { background: white; padding: 15px; border-radius: 4px; margin: 20px 0; font-size: 14px; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .detail-label { color: #666; font-weight: 500; }
        .detail-value { color: #333; }
        .button { display: inline-block; background: ${accentColor}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
        .footer a { color: ${accentColor}; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${escapeHtml(subject)}</h1>
        </div>
        <div class="content">
          <p>${escapeHtml(message)}</p>
          ${buildDetailsSection(details)}
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            If you have any questions, please contact our support team at support@sharekte.com
          </p>
        </div>
        <div class="footer">
          <p>© 2024 ShareKTE. All rights reserved.</p>
          <p><a href="https://sharekte.com/dashboard">View in Dashboard</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Build details section from details object
 */
function buildDetailsSection(details: Record<string, unknown>): string {
  if (!details || Object.keys(details).length === 0) return "";

  let html = '<div class="details">';
  for (const [key, value] of Object.entries(details)) {
    if (value === null || value === undefined) continue;

    const label = key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();

    const displayValue =
      typeof value === "object" ? JSON.stringify(value) : String(value);

    html += `
      <div class="detail-row">
        <span class="detail-label">${escapeHtml(label)}:</span>
        <span class="detail-value">${escapeHtml(displayValue)}</span>
      </div>
    `;
  }
  html += "</div>";
  return html;
}

/**
 * Escape HTML to prevent injection
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Get notification history
 */
export const getNotifications: RequestHandler = async (req, res) => {
  try {
    const { orderId, limit = 20 } = req.query;

    // In a real implementation, this would query a database
    // For now, we'll return an empty array
    const notifications: unknown[] = [];

    res.json({
      notifications,
      total: notifications.length,
    });
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};
