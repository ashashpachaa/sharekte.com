/**
 * Comprehensive Email Template System
 * Handles all email templates for orders, transfers, sign-ups, renewals, etc.
 * Uses professional HTML templates with consistent branding
 */

import nodemailer from "nodemailer";

export type EmailTemplateType =
  | "order-created"
  | "order-payment-received"
  | "order-completed"
  | "order-status-changed"
  | "order-cancelled"
  | "refund-requested"
  | "refund-approved"
  | "refund-rejected"
  | "renewal-reminder"
  | "renewal-completed"
  | "signup-confirmation"
  | "account-verification"
  | "password-reset"
  | "transfer-form-submitted"
  | "transfer-form-status"
  | "document-uploaded"
  | "support-ticket-created"
  | "invoice-created"
  | "welcome-onboarding";

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface EmailContext {
  [key: string]: string | number | boolean | undefined;
}

const BRAND_COLOR = "#0066CC"; // Updated to match Sharekte logo
const BRAND_COLOR_LIGHT = "#E6F0FF";
const BRAND_COLOR_DARK = "#004699";
const SUCCESS_COLOR = "#10B981";
const WARNING_COLOR = "#F59E0B";
const DANGER_COLOR = "#EF4444";
const APP_URL = process.env.APP_URL || "https://shareket.com";
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@shareket.com";
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "support@shareket.com";
const COMPANY_NAME = "Sharekte";
const LOGO_URL = "https://cdn.builder.io/api/v1/image/assets%2F752b1abf9cc241c993361e9dcaee5153%2Fd9d4a64693d843b1a53386d5a7c2937e?format=webp&width=200";

/**
 * Email transporter singleton
 */
let emailTransporter: nodemailer.Transporter | null = null;

function getEmailTransporter() {
  if (emailTransporter) return emailTransporter;

  const host = process.env.EMAIL_HOST;
  const port = parseInt(process.env.EMAIL_PORT || "587");
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;

  if (!host || !user || !pass) {
    return null;
  }

  emailTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return emailTransporter;
}

/**
 * Base email layout wrapper
 */
function getEmailLayout(
  title: string,
  content: string,
  headerColor: string = BRAND_COLOR,
  footerLinks: { text: string; url: string }[] = []
): string {
  const footerLinksHtml = footerLinks
    .map(
      (link) =>
        `<a href="${link.url}" style="color: ${BRAND_COLOR}; text-decoration: none; margin: 0 15px;">${link.text}</a>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f7fa;
    }
    .wrapper {
      width: 100%;
      padding: 20px;
      background: #f5f7fa;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
    }
    .header {
      background: linear-gradient(135deg, ${headerColor} 0%, ${headerColor}dd 100%);
      color: white;
      padding: 30px 30px 40px 30px;
      text-align: center;
    }
    .logo {
      max-width: 180px;
      height: auto;
      margin: 0 auto 20px auto;
      display: block;
    }
    .header h1 {
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 10px 0;
    }
    .header p {
      font-size: 14px;
      opacity: 0.95;
      margin: 0;
    }
    .content {
      padding: 40px 30px;
    }
    .content p {
      margin: 0 0 15px 0;
      font-size: 15px;
      line-height: 1.7;
    }
    .content p:last-child {
      margin-bottom: 0;
    }
    .section {
      margin: 30px 0;
      padding: 20px;
      background: #f9fafb;
      border-radius: 6px;
      border-left: 4px solid ${BRAND_COLOR};
    }
    .section h2 {
      font-size: 16px;
      font-weight: 600;
      color: ${BRAND_COLOR_DARK};
      margin: 0 0 15px 0;
    }
    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      font-size: 14px;
    }
    .detail-item {
      display: flex;
      flex-direction: column;
    }
    .detail-label {
      color: #666;
      font-weight: 600;
      margin-bottom: 4px;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .detail-value {
      color: #333;
      font-weight: 500;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background: ${BRAND_COLOR};
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 15px;
      margin: 20px 0;
      transition: background 0.2s;
    }
    .button:hover {
      background: ${BRAND_COLOR_DARK};
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .alert {
      padding: 15px;
      border-radius: 6px;
      margin: 20px 0;
      font-size: 14px;
    }
    .alert-success {
      background: #ecfdf5;
      border-left: 4px solid ${SUCCESS_COLOR};
      color: #065f46;
    }
    .alert-warning {
      background: #fffbeb;
      border-left: 4px solid ${WARNING_COLOR};
      color: #78350f;
    }
    .alert-danger {
      background: #fef2f2;
      border-left: 4px solid ${DANGER_COLOR};
      color: #7f1d1d;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin: 5px 0;
    }
    .badge-success {
      background: #d1fae5;
      color: #065f46;
    }
    .badge-warning {
      background: #fef3c7;
      color: #78350f;
    }
    .badge-danger {
      background: #fee2e2;
      color: #7f1d1d;
    }
    .badge-info {
      background: #dbeafe;
      color: #1e40af;
    }
    .divider {
      height: 1px;
      background: #e5e7eb;
      margin: 20px 0;
    }
    .footer {
      background: #f3f4f6;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer-links {
      margin-bottom: 20px;
      font-size: 13px;
    }
    .footer-text {
      font-size: 12px;
      color: #666;
      line-height: 1.6;
    }
    .footer-logo {
      font-size: 16px;
      font-weight: 700;
      color: ${BRAND_COLOR};
      margin-bottom: 10px;
    }
    @media (max-width: 600px) {
      .container {
        border-radius: 0;
      }
      .header {
        padding: 30px 20px;
      }
      .header h1 {
        font-size: 24px;
      }
      .content {
        padding: 20px;
      }
      .detail-grid {
        grid-template-columns: 1fr;
      }
      .footer {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      ${content}
      <div class="footer">
        <div class="footer-logo">${COMPANY_NAME}</div>
        ${
          footerLinks.length > 0
            ? `<div class="footer-links">${footerLinksHtml}</div><div class="divider"></div>`
            : ""
        }
        <div class="footer-text">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>For support, please visit <a href="${SUPPORT_EMAIL}" style="color: ${BRAND_COLOR};">${SUPPORT_EMAIL}</a></p>
          <p style="margin-top: 10px; color: #999;">© ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Order Created Template
 */
function generateOrderCreatedTemplate(context: EmailContext): EmailTemplate {
  const headerHtml = `
    <div class="header">
      <h1>✓ Order Confirmed</h1>
      <p>Thank you for your purchase</p>
    </div>
  `;

  const contentHtml = `
    ${headerHtml}
    <div class="content">
      <p>Dear ${context.customerName},</p>
      <p>We're excited to let you know that your order has been received and confirmed!</p>
      
      <div class="alert alert-success">
        <strong>Order Reference: ${context.orderId}</strong>
        <br>Date: ${context.orderDate}
      </div>

      <div class="section">
        <h2>Order Summary</h2>
        <div class="detail-grid">
          <div class="detail-item">
            <div class="detail-label">Company</div>
            <div class="detail-value">${context.companyName}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Company Number</div>
            <div class="detail-value">${context.companyNumber}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Amount</div>
            <div class="detail-value">${context.currency} ${context.amount}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Status</div>
            <div><span class="badge badge-info">Payment Processing</span></div>
          </div>
        </div>
      </div>

      <p>Your payment is being processed securely. Once confirmed, you'll receive your company documents and full access to your account.</p>

      <div class="button-container">
        <a href="${APP_URL}/dashboard/orders/${context.orderId}" class="button">View Order Details</a>
      </div>

      <p><strong>What happens next?</strong></p>
      <ul style="margin: 15px 0; padding-left: 20px;">
        <li>We'll process your payment and send confirmation</li>
        <li>Company documents will be prepared for transfer</li>
        <li>You'll be notified when everything is ready</li>
      </ul>

      <p>If you have any questions about your order, our support team is here to help.</p>
      <p>Best regards,<br><strong>${COMPANY_NAME} Team</strong></p>
    </div>
  `;

  return {
    subject: `Order Confirmed: ${context.orderId}`,
    html: getEmailLayout("Order Confirmation", contentHtml, SUCCESS_COLOR, [
      { text: "View Order", url: `${APP_URL}/dashboard/orders/${context.orderId}` },
      { text: "Contact Support", url: `${APP_URL}/support` },
    ]),
    text: `Order Confirmed: ${context.orderId}\n\nDear ${context.customerName},\n\nYour order has been received and confirmed.\n\nOrder ID: ${context.orderId}\nCompany: ${context.companyName}\nAmount: ${context.currency} ${context.amount}\n\nBest regards,\n${COMPANY_NAME} Team`,
  };
}

/**
 * Order Payment Received Template
 */
function generateOrderPaymentReceivedTemplate(context: EmailContext): EmailTemplate {
  const headerHtml = `
    <div class="header">
      <h1>💳 Payment Received</h1>
      <p>Your payment has been processed successfully</p>
    </div>
  `;

  const contentHtml = `
    ${headerHtml}
    <div class="content">
      <p>Dear ${context.customerName},</p>
      <p>Great news! We've successfully received and processed your payment.</p>

      <div class="alert alert-success">
        <strong>Payment Confirmed</strong><br>
        Transaction ID: ${context.transactionId}
      </div>

      <div class="section">
        <h2>Payment Details</h2>
        <div class="detail-grid">
          <div class="detail-item">
            <div class="detail-label">Amount</div>
            <div class="detail-value">${context.currency} ${context.amount}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Payment Method</div>
            <div class="detail-value">${context.paymentMethod}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Company</div>
            <div class="detail-value">${context.companyName}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Date</div>
            <div class="detail-value">${context.paymentDate}</div>
          </div>
        </div>
      </div>

      <p>Your company transfer is now in progress. Our team will prepare your documents and guide you through the next steps.</p>

      <div class="button-container">
        <a href="${APP_URL}/dashboard/orders/${context.orderId}" class="button">Track Your Order</a>
      </div>

      <p><strong>Next Steps:</strong></p>
      <ul style="margin: 15px 0; padding-left: 20px;">
        <li>We're preparing your company ownership transfer documents</li>
        <li>You'll receive updates as we progress through each stage</li>
        <li>Company details will be available within 2-3 business days</li>
      </ul>

      <p>Thank you for choosing ${COMPANY_NAME}!</p>
      <p>Best regards,<br><strong>${COMPANY_NAME} Team</strong></p>
    </div>
  `;

  return {
    subject: `Payment Received - Order ${context.orderId}`,
    html: getEmailLayout("Payment Confirmation", contentHtml, SUCCESS_COLOR, [
      { text: "Track Order", url: `${APP_URL}/dashboard/orders/${context.orderId}` },
      { text: "View Invoice", url: `${APP_URL}/dashboard/invoices/${context.invoiceId}` },
    ]),
    text: `Payment Received\n\nDear ${context.customerName},\n\nYour payment has been processed successfully.\n\nAmount: ${context.currency} ${context.amount}\nTransaction ID: ${context.transactionId}\n\nBest regards,\n${COMPANY_NAME} Team`,
  };
}

/**
 * Order Status Changed Template
 */
function generateOrderStatusChangedTemplate(context: EmailContext): EmailTemplate {
  const statusEmojis: { [key: string]: string } = {
    "pending-payment": "⏳",
    "payment-confirmed": "✓",
    completed: "🎉",
    transferred: "✓",
    "transfer-in-progress": "🚚",
    cancelled: "❌",
    refunded: "↩️",
  };

  const statusColors: { [key: string]: string } = {
    completed: SUCCESS_COLOR,
    transferred: SUCCESS_COLOR,
    "transfer-in-progress": BRAND_COLOR,
    cancelled: DANGER_COLOR,
    refunded: WARNING_COLOR,
    "pending-payment": WARNING_COLOR,
  };

  const emoji = statusEmojis[context.status as string] || "📋";
  const color = statusColors[context.status as string] || BRAND_COLOR;

  const headerHtml = `
    <div class="header" style="background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%);">
      <h1>${emoji} Status Update</h1>
      <p>Order status has been updated</p>
    </div>
  `;

  const contentHtml = `
    ${headerHtml}
    <div class="content">
      <p>Dear ${context.customerName},</p>
      <p>Your order status has been updated. Here are the details:</p>

      <div class="section" style="border-left-color: ${color};">
        <h2>New Status</h2>
        <p style="font-size: 18px; font-weight: 600; color: ${color}; margin: 0;">
          ${String(context.status).replace(/-/g, " ").toUpperCase()}
        </p>
        ${
          context.statusNotes
            ? `<p style="margin-top: 10px; color: #666; font-size: 14px;">${context.statusNotes}</p>`
            : ""
        }
      </div>

      <div class="section">
        <h2>Order Information</h2>
        <div class="detail-grid">
          <div class="detail-item">
            <div class="detail-label">Order ID</div>
            <div class="detail-value">${context.orderId}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Company</div>
            <div class="detail-value">${context.companyName}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Amount</div>
            <div class="detail-value">${context.currency} ${context.amount}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Updated</div>
            <div class="detail-value">${context.statusChangedDate}</div>
          </div>
        </div>
      </div>

      <div class="button-container">
        <a href="${APP_URL}/dashboard/orders/${context.orderId}" class="button">View Full Details</a>
      </div>

      <p>If you have any questions about your order status, please don't hesitate to reach out to our support team.</p>
      <p>Best regards,<br><strong>${COMPANY_NAME} Team</strong></p>
    </div>
  `;

  return {
    subject: `Order Status Updated: ${context.orderId}`,
    html: getEmailLayout("Order Status Update", contentHtml, color, [
      { text: "View Order", url: `${APP_URL}/dashboard/orders/${context.orderId}` },
      { text: "Contact Support", url: `${APP_URL}/support` },
    ]),
    text: `Order Status Updated\n\nDear ${context.customerName},\n\nYour order status has been updated to: ${context.status}\n\nOrder ID: ${context.orderId}\n\nBest regards,\n${COMPANY_NAME} Team`,
  };
}

/**
 * Order Completed Template
 */
function generateOrderCompletedTemplate(context: EmailContext): EmailTemplate {
  const headerHtml = `
    <div class="header">
      <h1>🎉 Order Complete</h1>
      <p>Your company is ready</p>
    </div>
  `;

  const contentHtml = `
    ${headerHtml}
    <div class="content">
      <p>Dear ${context.customerName},</p>
      <p>Excellent news! Your company ownership transfer has been completed successfully.</p>

      <div class="alert alert-success">
        <strong>Company Transfer Complete</strong><br>
        Your company is now ready for use.
      </div>

      <div class="section">
        <h2>Company Details</h2>
        <div class="detail-grid">
          <div class="detail-item">
            <div class="detail-label">Company Name</div>
            <div class="detail-value">${context.companyName}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Company Number</div>
            <div class="detail-value">${context.companyNumber}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Country</div>
            <div class="detail-value">${context.country}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Renewal Date</div>
            <div class="detail-value">${context.renewalDate}</div>
          </div>
        </div>
      </div>

      <p><strong>Your company documents include:</strong></p>
      <ul style="margin: 15px 0; padding-left: 20px;">
        <li>Certificate of Incorporation</li>
        <li>Company Ownership Transfer Certificate</li>
        <li>Director & Shareholder Information</li>
        <li>Company Compliance Documents</li>
        <li>Access Credentials</li>
      </ul>

      <div class="button-container">
        <a href="${APP_URL}/dashboard/companies/${context.companyId}" class="button">View Your Company</a>
      </div>

      <p><strong>Important Information:</strong></p>
      <ul style="margin: 15px 0; padding-left: 20px;">
        <li>Keep all company documents in a safe location</li>
        <li>Your company renewal date is ${context.renewalDate}</li>
        <li>You'll receive a renewal reminder 30 days before expiration</li>
        <li>All your company details are available in your dashboard</li>
      </ul>

      <p>Thank you for choosing ${COMPANY_NAME}! If you have any questions, our support team is always available.</p>
      <p>Best regards,<br><strong>${COMPANY_NAME} Team</strong></p>
    </div>
  `;

  return {
    subject: `Company Transfer Complete: ${context.companyName}`,
    html: getEmailLayout("Company Transfer Complete", contentHtml, SUCCESS_COLOR, [
      { text: "View Company", url: `${APP_URL}/dashboard/companies/${context.companyId}` },
      { text: "Download Docs", url: `${APP_URL}/dashboard/documents` },
      { text: "Contact Support", url: `${APP_URL}/support` },
    ]),
    text: `Your company transfer is complete!\n\nDear ${context.customerName},\n\nYour company ${context.companyName} is now ready for use.\n\nCompany Number: ${context.companyNumber}\nRenewal Date: ${context.renewalDate}\n\nBest regards,\n${COMPANY_NAME} Team`,
  };
}

/**
 * Refund Approved Template
 */
function generateRefundApprovedTemplate(context: EmailContext): EmailTemplate {
  const headerHtml = `
    <div class="header" style="background: linear-gradient(135deg, ${SUCCESS_COLOR} 0%, ${SUCCESS_COLOR}dd 100%);">
      <h1>✓ Refund Approved</h1>
      <p>Your refund has been approved</p>
    </div>
  `;

  const contentHtml = `
    ${headerHtml}
    <div class="content">
      <p>Dear ${context.customerName},</p>
      <p>Good news! Your refund request has been approved and processed.</p>

      <div class="alert alert-success">
        <strong>Refund Amount: ${context.currency} ${context.refundAmount}</strong><br>
        Expected delivery: 5-7 business days to your original payment method
      </div>

      <div class="section">
        <h2>Refund Details</h2>
        <div class="detail-grid">
          <div class="detail-item">
            <div class="detail-label">Order ID</div>
            <div class="detail-value">${context.orderId}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Original Amount</div>
            <div class="detail-value">${context.currency} ${context.originalAmount}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Processing Fee</div>
            <div class="detail-value">${context.currency} ${context.processingFee}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Refund Amount</div>
            <div class="detail-value"><strong>${context.currency} ${context.refundAmount}</strong></div>
          </div>
        </div>
      </div>

      <p>The refund will be transferred to your original payment method. Depending on your bank, it may take 5-7 business days to appear in your account.</p>

      <p>If you have any questions about your refund, please contact our support team.</p>

      <p>Thank you for using ${COMPANY_NAME}.</p>
      <p>Best regards,<br><strong>${COMPANY_NAME} Team</strong></p>
    </div>
  `;

  return {
    subject: `Refund Approved: ${context.orderId}`,
    html: getEmailLayout("Refund Approved", contentHtml, SUCCESS_COLOR, [
      { text: "View Details", url: `${APP_URL}/dashboard/orders/${context.orderId}` },
      { text: "Contact Support", url: `${APP_URL}/support` },
    ]),
    text: `Your refund has been approved.\n\nRefund Amount: ${context.currency} ${context.refundAmount}\nExpected: 5-7 business days\n\nBest regards,\n${COMPANY_NAME} Team`,
  };
}

/**
 * Renewal Reminder Template
 */
function generateRenewalReminderTemplate(context: EmailContext): EmailTemplate {
  const daysUntilRenewal = context.daysUntilRenewal || 30;
  const urgency = daysUntilRenewal <= 7 ? "danger" : daysUntilRenewal <= 14 ? "warning" : "info";
  const alertClass = `alert-${urgency}`;

  const headerHtml = `
    <div class="header" style="background: linear-gradient(135deg, ${WARNING_COLOR} 0%, ${WARNING_COLOR}dd 100%);">
      <h1>📅 Renewal Reminder</h1>
      <p>Your company renewal is coming up</p>
    </div>
  `;

  const contentHtml = `
    ${headerHtml}
    <div class="content">
      <p>Dear ${context.customerName},</p>
      <p>This is a friendly reminder that your company renewal is coming up.</p>

      <div class="alert ${alertClass}">
        <strong>Renewal Due: ${context.renewalDate}</strong><br>
        ${daysUntilRenewal} days remaining
      </div>

      <div class="section">
        <h2>Company Information</h2>
        <div class="detail-grid">
          <div class="detail-item">
            <div class="detail-label">Company Name</div>
            <div class="detail-value">${context.companyName}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Company Number</div>
            <div class="detail-value">${context.companyNumber}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Renewal Date</div>
            <div class="detail-value">${context.renewalDate}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Renewal Fee</div>
            <div class="detail-value">${context.currency} ${context.renewalFee}</div>
          </div>
        </div>
      </div>

      <p><strong>Don't let your company expire!</strong> Renewing early ensures uninterrupted business operations.</p>

      <div class="button-container">
        <a href="${APP_URL}/dashboard/companies/${context.companyId}/renew" class="button">Renew Now</a>
      </div>

      <p>If you need any assistance with renewal, our support team is ready to help.</p>
      <p>Best regards,<br><strong>${COMPANY_NAME} Team</strong></p>
    </div>
  `;

  return {
    subject: `Company Renewal Reminder: ${context.companyName}`,
    html: getEmailLayout("Renewal Reminder", contentHtml, WARNING_COLOR, [
      { text: "Renew Company", url: `${APP_URL}/dashboard/companies/${context.companyId}/renew` },
      { text: "View Company", url: `${APP_URL}/dashboard/companies/${context.companyId}` },
    ]),
    text: `Renewal Reminder\n\nDear ${context.customerName},\n\nYour company ${context.companyName} renewal is due on ${context.renewalDate}.\n\nRenewal Fee: ${context.currency} ${context.renewalFee}\n\nPlease renew your company to maintain its active status.\n\nBest regards,\n${COMPANY_NAME} Team`,
  };
}

/**
 * Sign-up Confirmation Template
 */
function generateSignupConfirmationTemplate(context: EmailContext): EmailTemplate {
  const headerHtml = `
    <div class="header">
      <h1>👋 Welcome to ${COMPANY_NAME}</h1>
      <p>Your account has been created</p>
    </div>
  `;

  const contentHtml = `
    ${headerHtml}
    <div class="content">
      <p>Dear ${context.userName},</p>
      <p>Thank you for signing up with ${COMPANY_NAME}! We're thrilled to have you on board.</p>

      <div class="alert alert-success">
        <strong>Your account is ready</strong><br>
        You can now log in and start exploring our services.
      </div>

      <div class="section">
        <h2>Account Details</h2>
        <div class="detail-grid">
          <div class="detail-item">
            <div class="detail-label">Email</div>
            <div class="detail-value">${context.email}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Account Created</div>
            <div class="detail-value">${context.createdDate}</div>
          </div>
        </div>
      </div>

      <p><strong>What can you do now?</strong></p>
      <ul style="margin: 15px 0; padding-left: 20px;">
        <li>Browse our catalog of ready-made companies</li>
        <li>Add companies to your cart</li>
        <li>Complete the checkout process</li>
        <li>Access your dashboard and manage your purchases</li>
        <li>Track your company transfer status in real-time</li>
      </ul>

      <div class="button-container">
        <a href="${APP_URL}/login" class="button">Log In to Your Account</a>
      </div>

      <p><strong>Need help getting started?</strong></p>
      <p>Check out our <a href="${APP_URL}/how-it-works" style="color: ${BRAND_COLOR}; text-decoration: none; font-weight: 600;">how it works guide</a> to learn more about our process.</p>

      <p>If you have any questions, our support team is here to help!</p>
      <p>Best regards,<br><strong>${COMPANY_NAME} Team</strong></p>
    </div>
  `;

  return {
    subject: `Welcome to ${COMPANY_NAME} - Account Created`,
    html: getEmailLayout("Welcome to Sharekte", contentHtml, BRAND_COLOR, [
      { text: "Log In", url: `${APP_URL}/login` },
      { text: "How It Works", url: `${APP_URL}/how-it-works` },
      { text: "Contact Support", url: `${APP_URL}/support` },
    ]),
    text: `Welcome to ${COMPANY_NAME}\n\nDear ${context.userName},\n\nYour account has been created successfully.\n\nEmail: ${context.email}\n\nYou can now log in and start exploring our services.\n\nBest regards,\n${COMPANY_NAME} Team`,
  };
}

/**
 * Transfer Form Status Template
 */
function generateTransferFormStatusTemplate(context: EmailContext): EmailTemplate {
  const statusColors: { [key: string]: string } = {
    "under-review": BRAND_COLOR,
    "amend-required": WARNING_COLOR,
    "confirm-application": BRAND_COLOR,
    "transferring": BRAND_COLOR,
    "complete-transfer": SUCCESS_COLOR,
    "canceled": DANGER_COLOR,
  };

  const color = statusColors[context.status as string] || BRAND_COLOR;

  const headerHtml = `
    <div class="header" style="background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%);">
      <h1>📋 Transfer Form Status Update</h1>
      <p>Your form status has changed</p>
    </div>
  `;

  const contentHtml = `
    ${headerHtml}
    <div class="content">
      <p>Dear ${context.buyerName},</p>
      <p>Your company transfer form has been updated. Please review the information below.</p>

      <div class="section" style="border-left-color: ${color};">
        <h2>Current Status</h2>
        <p style="font-size: 18px; font-weight: 600; color: ${color}; margin: 0;">
          ${String(context.status).replace(/-/g, " ").toUpperCase()}
        </p>
        ${
          context.statusNotes
            ? `<p style="margin-top: 10px; color: #666; font-size: 14px;">${context.statusNotes}</p>`
            : ""
        }
      </div>

      <div class="section">
        <h2>Form Details</h2>
        <div class="detail-grid">
          <div class="detail-item">
            <div class="detail-label">Form ID</div>
            <div class="detail-value">${context.formId}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Company</div>
            <div class="detail-value">${context.companyName}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Company Number</div>
            <div class="detail-value">${context.companyNumber}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Last Updated</div>
            <div class="detail-value">${context.updatedDate}</div>
          </div>
        </div>
      </div>

      ${
        context.status === "amend-required"
          ? `
      <div class="alert alert-warning">
        <strong>Action Required:</strong> We need some additional information or corrections. Please review the comments in your dashboard and submit the amended form.
      </div>
      <div class="button-container">
        <a href="${APP_URL}/dashboard/forms/${context.formId}" class="button">Review & Update Form</a>
      </div>
      `
          : context.status === "confirm-application"
            ? `
      <div class="alert alert-warning">
        <strong>Confirmation Needed:</strong> Please review all information and confirm that everything is correct before we proceed.
      </div>
      <div class="button-container">
        <a href="${APP_URL}/dashboard/forms/${context.formId}" class="button">Confirm Form</a>
      </div>
      `
            : context.status === "complete-transfer"
              ? `
      <div class="alert alert-success">
        <strong>Congratulations!</strong> Your company transfer has been completed successfully. Your new company is now ready to use.
      </div>
      <div class="button-container">
        <a href="${APP_URL}/dashboard/companies/${context.companyId}" class="button">View Your Company</a>
      </div>
      `
              : ""
      }

      <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
      <p>Best regards,<br><strong>${COMPANY_NAME} Team</strong></p>
    </div>
  `;

  return {
    subject: `Transfer Form Status Updated: ${context.formId}`,
    html: getEmailLayout("Form Status Update", contentHtml, color, [
      { text: "View Form", url: `${APP_URL}/dashboard/forms/${context.formId}` },
      { text: "Contact Support", url: `${APP_URL}/support` },
    ]),
    text: `Transfer Form Status Updated\n\nDear ${context.buyerName},\n\nYour form ${context.formId} status is now: ${context.status}\n\nCompany: ${context.companyName}\n\nBest regards,\n${COMPANY_NAME} Team`,
  };
}

/**
 * Get email template by type
 */
export function getEmailTemplate(type: EmailTemplateType, context: EmailContext): EmailTemplate {
  const templates: Record<EmailTemplateType, (ctx: EmailContext) => EmailTemplate> = {
    "order-created": generateOrderCreatedTemplate,
    "order-payment-received": generateOrderPaymentReceivedTemplate,
    "order-completed": generateOrderCompletedTemplate,
    "order-status-changed": generateOrderStatusChangedTemplate,
    "order-cancelled": (ctx) => ({
      ...generateOrderStatusChangedTemplate({ ...ctx, status: "cancelled" }),
      subject: `Order Cancelled: ${ctx.orderId}`,
    }),
    "refund-requested": (ctx) => ({
      ...generateOrderStatusChangedTemplate({ ...ctx, status: "refund-requested" }),
      subject: `Refund Request Received: ${ctx.orderId}`,
    }),
    "refund-approved": generateRefundApprovedTemplate,
    "refund-rejected": (ctx) => ({
      ...generateOrderStatusChangedTemplate({ ...ctx, status: "refund-rejected" }),
      subject: `Refund Request Status: ${ctx.orderId}`,
    }),
    "renewal-reminder": generateRenewalReminderTemplate,
    "renewal-completed": (ctx) => ({
      ...generateOrderCompletedTemplate(ctx),
      subject: `Company Renewal Complete: ${ctx.companyName}`,
    }),
    "signup-confirmation": generateSignupConfirmationTemplate,
    "account-verification": generateSignupConfirmationTemplate,
    "password-reset": (ctx) => ({
      subject: `Reset Your Password - ${COMPANY_NAME}`,
      html: getEmailLayout(
        "Reset Password",
        `
        <div class="header">
          <h1>🔐 Reset Your Password</h1>
        </div>
        <div class="content">
          <p>Dear ${ctx.userName},</p>
          <p>We received a request to reset your password. Click the button below to create a new password.</p>
          <div class="button-container">
            <a href="${ctx.resetLink}" class="button" style="background: ${BRAND_COLOR};">Reset Password</a>
          </div>
          <p><strong>This link expires in 24 hours.</strong></p>
          <p>If you didn't request a password reset, please ignore this email.</p>
          <p>Best regards,<br><strong>${COMPANY_NAME} Team</strong></p>
        </div>
      `,
        BRAND_COLOR
      ),
      text: `Reset Your Password\n\nClick here to reset your password: ${ctx.resetLink}\n\nThis link expires in 24 hours.`,
    }),
    "transfer-form-submitted": (ctx) => ({
      subject: `Transfer Form Submitted - ${ctx.formId}`,
      html: getEmailLayout(
        "Form Submitted",
        `
        <div class="header">
          <h1>✓ Form Submitted</h1>
          <p>Thank you for submitting your transfer form</p>
        </div>
        <div class="content">
          <p>Dear ${ctx.buyerName},</p>
          <p>Your company transfer form has been received and is now under review.</p>
          <div class="alert alert-success">
            <strong>Form ID: ${ctx.formId}</strong><br>
            Status: Under Review
          </div>
          <div class="section">
            <h2>Company Information</h2>
            <div class="detail-grid">
              <div class="detail-item">
                <div class="detail-label">Company</div>
                <div class="detail-value">${ctx.companyName}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Company Number</div>
                <div class="detail-value">${ctx.companyNumber}</div>
              </div>
            </div>
          </div>
          <p>Our team will review your form and contact you if we need any additional information.</p>
          <div class="button-container">
            <a href="${APP_URL}/dashboard/forms/${ctx.formId}" class="button">Track Form Status</a>
          </div>
          <p>Best regards,<br><strong>${COMPANY_NAME} Team</strong></p>
        </div>
      `,
        SUCCESS_COLOR
      ),
      text: `Your transfer form has been submitted.\n\nForm ID: ${ctx.formId}\nCompany: ${ctx.companyName}\n\nBest regards,\n${COMPANY_NAME} Team`,
    }),
    "transfer-form-status": generateTransferFormStatusTemplate,
    "document-uploaded": (ctx) => ({
      subject: `Document Uploaded: ${ctx.documentName}`,
      html: getEmailLayout(
        "Document Uploaded",
        `
        <div class="header">
          <h1>📄 Document Uploaded</h1>
        </div>
        <div class="content">
          <p>Dear ${ctx.userName},</p>
          <p>A new document has been uploaded to your account.</p>
          <div class="alert alert-success">
            <strong>${ctx.documentName}</strong><br>
            Uploaded: ${ctx.uploadDate}
          </div>
          <div class="button-container">
            <a href="${APP_URL}/dashboard/documents" class="button">View Documents</a>
          </div>
          <p>Best regards,<br><strong>${COMPANY_NAME} Team</strong></p>
        </div>
      `,
        SUCCESS_COLOR
      ),
      text: `Document uploaded: ${ctx.documentName}`,
    }),
    "support-ticket-created": (ctx) => ({
      subject: `Support Ticket Created: ${ctx.ticketId}`,
      html: getEmailLayout(
        "Ticket Created",
        `
        <div class="header">
          <h1>🎫 Support Ticket Created</h1>
        </div>
        <div class="content">
          <p>Dear ${ctx.userName},</p>
          <p>Your support ticket has been created and assigned to our team.</p>
          <div class="alert alert-info">
            <strong>Ticket ID: ${ctx.ticketId}</strong><br>
            Category: ${ctx.category}
          </div>
          <p>We'll respond to your inquiry as soon as possible.</p>
          <div class="button-container">
            <a href="${APP_URL}/dashboard/support/${ctx.ticketId}" class="button">View Ticket</a>
          </div>
          <p>Best regards,<br><strong>${COMPANY_NAME} Team</strong></p>
        </div>
      `,
        BRAND_COLOR
      ),
      text: `Your support ticket has been created.\n\nTicket ID: ${ctx.ticketId}`,
    }),
    "invoice-created": (ctx) => ({
      subject: `Invoice Created: ${ctx.invoiceNumber}`,
      html: getEmailLayout(
        "Invoice",
        `
        <div class="header">
          <h1>📧 Invoice</h1>
          <p>Invoice #${ctx.invoiceNumber}</p>
        </div>
        <div class="content">
          <p>Dear ${ctx.clientName},</p>
          <p>Your invoice is ready. Please review the details below.</p>
          <div class="section">
            <h2>Invoice Summary</h2>
            <div class="detail-grid">
              <div class="detail-item">
                <div class="detail-label">Invoice Number</div>
                <div class="detail-value">${ctx.invoiceNumber}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Date</div>
                <div class="detail-value">${ctx.invoiceDate}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Total Amount</div>
                <div class="detail-value"><strong>${ctx.currency} ${ctx.totalAmount}</strong></div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Due Date</div>
                <div class="detail-value">${ctx.dueDate}</div>
              </div>
            </div>
          </div>
          <div class="button-container">
            <a href="${APP_URL}/dashboard/invoices/${ctx.invoiceId}" class="button">View Invoice</a>
          </div>
          <p>Best regards,<br><strong>${COMPANY_NAME} Team</strong></p>
        </div>
      `,
        BRAND_COLOR
      ),
      text: `Invoice #${ctx.invoiceNumber} is ready.`,
    }),
    "welcome-onboarding": (ctx) => ({
      subject: `Getting Started with ${COMPANY_NAME}`,
      html: getEmailLayout(
        "Welcome",
        `
        <div class="header">
          <h1>🚀 Let's Get Started</h1>
          <p>Your quick start guide to ${COMPANY_NAME}</p>
        </div>
        <div class="content">
          <p>Dear ${ctx.userName},</p>
          <p>Welcome! Here's how to make the most of your ${COMPANY_NAME} account.</p>
          <div class="section">
            <h2>Step 1: Explore Companies</h2>
            <p>Browse our catalog of ready-made companies from various jurisdictions.</p>
          </div>
          <div class="section">
            <h2>Step 2: Add to Cart</h2>
            <p>Select the companies you want and add them to your cart.</p>
          </div>
          <div class="section">
            <h2>Step 3: Complete Checkout</h2>
            <p>Proceed to checkout and make your payment securely.</p>
          </div>
          <div class="section">
            <h2>Step 4: Track Transfer</h2>
            <p>Monitor your company transfer progress in real-time through your dashboard.</p>
          </div>
          <div class="button-container">
            <a href="${APP_URL}/companies" class="button">Start Browsing</a>
          </div>
          <p>Questions? Check out our <a href="${APP_URL}/how-it-works" style="color: ${BRAND_COLOR};">how it works</a> page or contact support.</p>
          <p>Best regards,<br><strong>${COMPANY_NAME} Team</strong></p>
        </div>
      `,
        BRAND_COLOR
      ),
      text: `Welcome to ${COMPANY_NAME}! Start exploring our companies catalog.`,
    }),
  };

  const template = templates[type];
  if (!template) {
    throw new Error(`Unknown email template type: ${type}`);
  }

  return template(context);
}

/**
 * Send email with given template
 */
export async function sendEmail(
  to: string,
  type: EmailTemplateType,
  context: EmailContext
): Promise<boolean> {
  try {
    const template = getEmailTemplate(type, context);
    const transporter = getEmailTransporter();

    if (!transporter) {
      // Log to console if SMTP not configured
      console.log(`[EMAIL NOTIFICATION] ${template.subject}`);
      console.log(`To: ${to}`);
      console.log(`Type: ${type}`);
      console.log(`\n${template.text}`);
      return true; // Don't fail if SMTP not configured
    }

    await transporter.sendMail({
      from: FROM_EMAIL,
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    console.log(`[EMAIL SENT] ${type} to ${to} - ${template.subject}`);
    return true;
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send ${type} email:`, error);
    return false;
  }
}

/**
 * Batch send emails
 */
export async function sendBatchEmails(
  recipients: Array<{ email: string; context: EmailContext }>,
  type: EmailTemplateType
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const { email, context } of recipients) {
    const sent = await sendEmail(email, type, context);
    if (sent) success++;
    else failed++;
  }

  console.log(`[BATCH EMAIL] ${type}: ${success} sent, ${failed} failed`);
  return { success, failed };
}
