/**
 * Transfer Form Notification System
 * Handles email and in-app notifications for form status changes
 */

import { TransferFormData, FormStatus } from "@/lib/transfer-form";
import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

// Get transporter for sending emails
function getEmailTransporter() {
  // Configure based on your email service
  // Example: Using environment variables for SMTP
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "localhost",
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: process.env.EMAIL_SECURE === "true",
    auth: process.env.EMAIL_USER && process.env.EMAIL_PASSWORD ? {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    } : undefined,
  });
}

/**
 * Send form status notification email
 */
export async function sendFormStatusNotification(
  form: TransferFormData,
  newStatus: FormStatus,
  notes?: string,
  reason?: string
): Promise<boolean> {
  try {
    const emailContent = generateStatusEmailHTML(form, newStatus, notes);
    const emailOptions: EmailOptions = {
      to: form.buyerEmail,
      subject: generateEmailSubject(form, newStatus),
      html: emailContent.html,
      text: emailContent.text,
    };

    // Try to send email via SMTP
    try {
      const transporter = getEmailTransporter();
      await transporter.sendMail(emailOptions);
      console.log(`Status notification email sent to ${form.buyerEmail}`);
      return true;
    } catch (emailError) {
      // Fallback: Log to console if email fails
      console.warn(`Email notification failed: ${emailError}. Logging instead.`);
      console.log(`[FORM NOTIFICATION] ${emailOptions.subject}`);
      console.log(`To: ${emailOptions.to}`);
      console.log(`\n${emailOptions.text}`);
      return false;
    }
  } catch (error) {
    console.error("Error sending form status notification:", error);
    return false;
  }
}

/**
 * Generate email subject based on status
 */
function generateEmailSubject(form: TransferFormData, status: FormStatus): string {
  const subjects: Record<FormStatus, string> = {
    "under-review": `Your Transfer Form ${form.formId} is Under Review`,
    "amend-required": `Action Required: Your Transfer Form ${form.formId} Needs Amendments`,
    "confirm-application": `Please Confirm Your Transfer Form ${form.formId}`,
    "transferring": `Transfer in Progress: ${form.companyName}`,
    "complete-transfer": `Transfer Complete: ${form.companyName} ${form.companyNumber}`,
    "canceled": `Transfer Canceled: ${form.companyName}`,
  };

  return subjects[status];
}

/**
 * Generate formatted HTML and text email content
 */
function generateStatusEmailHTML(
  form: TransferFormData,
  newStatus: FormStatus,
  notes?: string
): { html: string; text: string } {
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const statusMessages: Record<FormStatus, string> = {
    "under-review":
      "Your transfer form has been received and is currently being reviewed by our team.",
    "amend-required":
      "We need some additional information or corrections to proceed with your transfer. Please review the comments below and submit the amended form.",
    "confirm-application":
      "Thank you for submitting your transfer form. Please confirm that all information is correct before we proceed with the transfer.",
    "transferring":
      "Your company ownership transfer is now in progress. You should receive your transferred company details within 2-3 business days.",
    "complete-transfer":
      "Congratulations! Your company transfer has been completed successfully. Your new company details are ready.",
    "canceled":
      "Your transfer application has been canceled. If you believe this is in error, please contact our support team.",
  };

  const statusEmojis: Record<FormStatus, string> = {
    "under-review": "👀",
    "amend-required": "🔄",
    "confirm-application": "✅",
    "transferring": "🚚",
    "complete-transfer": "🎉",
    "canceled": "❌",
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Transfer Form Status Update</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', sans-serif;
          line-height: 1.6;
          color: #333;
          background: #f5f5f5;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          padding: 0;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #2563EB 0%, #1e40af 100%);
          color: white;
          padding: 30px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: bold;
        }
        .content {
          padding: 30px 20px;
        }
        .status-section {
          background: #f0f9ff;
          border-left: 4px solid #2563EB;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .status-title {
          font-size: 18px;
          font-weight: 600;
          color: #1e40af;
          margin-bottom: 8px;
        }
        .status-message {
          font-size: 14px;
          color: #1e3a8a;
        }
        .form-details {
          background: #f9fafb;
          padding: 15px;
          border-radius: 4px;
          margin: 20px 0;
          font-size: 13px;
        }
        .form-detail-row {
          margin: 8px 0;
          display: flex;
          justify-content: space-between;
        }
        .form-detail-label {
          font-weight: 600;
          color: #6b7280;
        }
        .form-detail-value {
          color: #1f2937;
        }
        .notes-section {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .notes-title {
          font-weight: 600;
          color: #92400e;
          margin-bottom: 8px;
        }
        .notes-text {
          color: #78350f;
          font-size: 14px;
          white-space: pre-wrap;
        }
        .cta-section {
          text-align: center;
          margin: 30px 0;
        }
        .cta-button {
          display: inline-block;
          background: #2563EB;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 4px;
          font-weight: 600;
        }
        .footer {
          background: #f3f4f6;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
          border-top: 1px solid #e5e7eb;
        }
        .footer-link {
          color: #2563EB;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${statusEmojis[newStatus]} Transfer Form Update</h1>
        </div>
        
        <div class="content">
          <p>Dear ${form.buyerName},</p>
          
          <div class="status-section">
            <div class="status-title">${generateEmailSubject(form, newStatus)}</div>
            <div class="status-message">${statusMessages[newStatus]}</div>
          </div>

          <div class="form-details">
            <div class="form-detail-row">
              <span class="form-detail-label">Form ID:</span>
              <span class="form-detail-value">${form.formId}</span>
            </div>
            <div class="form-detail-row">
              <span class="form-detail-label">Company:</span>
              <span class="form-detail-value">${form.companyName}</span>
            </div>
            <div class="form-detail-row">
              <span class="form-detail-label">Company Number:</span>
              <span class="form-detail-value">${form.companyNumber}</span>
            </div>
            <div class="form-detail-row">
              <span class="form-detail-label">Current Status:</span>
              <span class="form-detail-value">${newStatus.replace(/-/g, " ").toUpperCase()}</span>
            </div>
            <div class="form-detail-row">
              <span class="form-detail-label">Updated:</span>
              <span class="form-detail-value">${formatDate(new Date().toISOString())}</span>
            </div>
          </div>

          ${notes ? `
          <div class="notes-section">
            <div class="notes-title">Additional Information:</div>
            <div class="notes-text">${notes}</div>
          </div>
          ` : ''}

          ${newStatus === "amend-required" ? `
          <div class="cta-section">
            <p>Please log in to your account to view the required amendments and submit your updated form.</p>
            <a href="${process.env.APP_URL || 'https://example.com'}/dashboard/forms/${form.id}" class="cta-button">Review Form</a>
          </div>
          ` : newStatus === "confirm-application" ? `
          <div class="cta-section">
            <p>Please review your form details and confirm that everything is correct.</p>
            <a href="${process.env.APP_URL || 'https://example.com'}/dashboard/forms/${form.id}" class="cta-button">Confirm Form</a>
          </div>
          ` : ''}

          <p>If you have any questions or need further assistance, please don't hesitate to contact our support team.</p>
          
          <p>Best regards,<br>The Transfer Team</p>
        </div>

        <div class="footer">
          <p>This is an automated email. Please do not reply directly.</p>
          <p><a href="${process.env.APP_URL || 'https://example.com'}/support" class="footer-link">Contact Support</a> | <a href="${process.env.APP_URL || 'https://example.com'}/privacy" class="footer-link">Privacy Policy</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Transfer Form Status Update

${generateEmailSubject(form, newStatus)}

Dear ${form.buyerName},

${statusMessages[newStatus]}

Form Details:
- Form ID: ${form.formId}
- Company: ${form.companyName}
- Company Number: ${form.companyNumber}
- Current Status: ${newStatus.replace(/-/g, " ").toUpperCase()}
- Updated: ${formatDate(new Date().toISOString())}

${notes ? `\nAdditional Information:\n${notes}\n` : ''}

If you have any questions, please contact our support team.

Best regards,
The Transfer Team
  `;

  return { html, text };
}

/**
 * Send comment notification to client
 */
export async function sendCommentNotification(
  form: TransferFormData,
  commentText: string,
  isAdminOnly: boolean = false
): Promise<boolean> {
  if (isAdminOnly) {
    // Don't notify client about admin-only comments
    return true;
  }

  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>New Comment on Your Transfer Form</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; }
          .header { background: #2563EB; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .comment-box { background: #f0f9ff; border-left: 4px solid #2563EB; padding: 15px; margin: 20px 0; }
          .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>New Comment on Form ${form.formId}</h1></div>
          <div class="content">
            <p>Hi ${form.buyerName},</p>
            <p>A new comment has been added to your transfer form for ${form.companyName}.</p>
            <div class="comment-box">
              <strong>Comment:</strong><br>
              ${commentText}
            </div>
            <p>Please log in to your account to view all comments and respond if needed.</p>
            <p>Best regards,<br>The Transfer Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply directly.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailOptions: EmailOptions = {
      to: form.buyerEmail,
      subject: `New Comment on Your Transfer Form ${form.formId}`,
      html,
      text: `New comment added to your transfer form ${form.formId}: ${commentText}`,
    };

    try {
      const transporter = getEmailTransporter();
      await transporter.sendMail(emailOptions);
      return true;
    } catch (error) {
      console.warn(`Email notification failed: ${error}`);
      return false;
    }
  } catch (error) {
    console.error("Error sending comment notification:", error);
    return false;
  }
}

/**
 * Send form submission reminder
 */
export async function sendFormReminderEmail(
  buyerEmail: string,
  buyerName: string,
  formId: string,
  formLink?: string
): Promise<boolean> {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Pending Transfer Form</title>
      </head>
      <body>
        <h2>Transfer Form Reminder</h2>
        <p>Hi ${buyerName},</p>
        <p>You have a pending transfer form (${formId}) that requires your attention.</p>
        <p><a href="${formLink || '#'}">Complete Your Form</a></p>
        <p>Please submit your form as soon as possible.</p>
        <p>Best regards,<br>The Transfer Team</p>
      </body>
      </html>
    `;

    const emailOptions: EmailOptions = {
      to: buyerEmail,
      subject: `Reminder: Complete Your Transfer Form ${formId}`,
      html,
      text: `Reminder: You have a pending transfer form ${formId} that requires your attention.`,
    };

    try {
      const transporter = getEmailTransporter();
      await transporter.sendMail(emailOptions);
      return true;
    } catch (error) {
      console.warn(`Email notification failed: ${error}`);
      return false;
    }
  } catch (error) {
    console.error("Error sending reminder email:", error);
    return false;
  }
}
