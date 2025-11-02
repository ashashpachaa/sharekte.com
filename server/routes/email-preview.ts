/**
 * Email Preview Route
 * Displays rendered email templates for visual preview
 * Access: http://localhost:8080/api/email-preview?type=order-created
 */

import { RequestHandler } from "express";
import { getEmailTemplate, EmailTemplateType } from "../utils/email-templates";

// Sample context data for previews
const previewContexts: Record<EmailTemplateType, Record<string, unknown>> = {
  "order-created": {
    customerName: "John Smith",
    orderId: "ORD-2024-001",
    orderDate: "January 15, 2024",
    companyName: "Tech Solutions Ltd",
    companyNumber: "12345678",
    currency: "USD",
    amount: 500,
  },
  "order-payment-received": {
    customerName: "John Smith",
    orderId: "ORD-2024-001",
    currency: "USD",
    amount: 500,
    paymentMethod: "credit_card",
    paymentDate: "January 15, 2024",
    transactionId: "txn_2024_001",
    companyName: "Tech Solutions Ltd",
    invoiceId: "INV-2024-001",
  },
  "order-completed": {
    customerName: "John Smith",
    companyId: "comp_1",
    companyName: "Tech Solutions Ltd",
    companyNumber: "12345678",
    country: "United Kingdom",
    renewalDate: "January 15, 2025",
    currency: "USD",
    amount: 500,
  },
  "order-status-changed": {
    customerName: "John Smith",
    orderId: "ORD-2024-001",
    status: "transfer-in-progress",
    companyName: "Tech Solutions Ltd",
    currency: "USD",
    amount: 500,
    statusChangedDate: "January 15, 2024",
    statusNotes: "Your company is being prepared for transfer",
  },
  "order-cancelled": {
    customerName: "John Smith",
    orderId: "ORD-2024-001",
    status: "cancelled",
    companyName: "Tech Solutions Ltd",
    currency: "USD",
    amount: 500,
    statusChangedDate: "January 15, 2024",
  },
  "refund-requested": {
    customerName: "John Smith",
    orderId: "ORD-2024-001",
    status: "refund-requested",
    companyName: "Tech Solutions Ltd",
    currency: "USD",
    amount: 500,
    statusChangedDate: "January 15, 2024",
  },
  "refund-approved": {
    customerName: "John Smith",
    orderId: "ORD-2024-001",
    currency: "USD",
    originalAmount: 1000,
    processingFee: 30,
    refundAmount: 970,
  },
  "refund-rejected": {
    customerName: "John Smith",
    orderId: "ORD-2024-001",
    status: "refund-rejected",
    companyName: "Tech Solutions Ltd",
    currency: "USD",
    amount: 500,
    statusChangedDate: "January 15, 2024",
  },
  "renewal-reminder": {
    customerName: "John Smith",
    companyId: "comp_1",
    companyName: "Tech Solutions Ltd",
    companyNumber: "12345678",
    renewalDate: "February 14, 2024",
    daysUntilRenewal: 30,
    currency: "USD",
    renewalFee: 50,
  },
  "renewal-completed": {
    customerName: "John Smith",
    companyId: "comp_1",
    companyName: "Tech Solutions Ltd",
    companyNumber: "12345678",
    country: "United Kingdom",
    renewalDate: "February 14, 2025",
    currency: "USD",
    amount: 50,
  },
  "signup-confirmation": {
    userName: "John Smith",
    email: "john@example.com",
    createdDate: "January 15, 2024",
  },
  "account-verification": {
    userName: "John Smith",
    email: "john@example.com",
    createdDate: "January 15, 2024",
  },
  "password-reset": {
    userName: "John Smith",
    resetLink: "https://shareket.com/reset-password?token=abc123xyz",
  },
  "transfer-form-submitted": {
    buyerName: "Ahmed Al-Mansouri",
    formId: "FORM-2024-001",
    companyName: "Dubai Business Ltd",
    companyNumber: "987654321",
  },
  "transfer-form-status": {
    buyerName: "Ahmed Al-Mansouri",
    formId: "FORM-2024-001",
    companyId: "comp_2",
    companyName: "Dubai Business Ltd",
    companyNumber: "987654321",
    status: "amend-required",
    updatedDate: "January 15, 2024",
    statusNotes: "Please update the shareholder information with current details",
  },
  "document-uploaded": {
    userName: "John Smith",
    documentName: "Certificate of Incorporation",
    uploadDate: "January 15, 2024",
  },
  "support-ticket-created": {
    userName: "John Smith",
    ticketId: "TICKET-2024-001",
    category: "Technical Support",
  },
  "invoice-created": {
    clientName: "Tech Solutions Ltd",
    clientEmail: "billing@techsolutions.com",
    invoiceNumber: "INV-2024-001",
    invoiceDate: "January 15, 2024",
    invoiceId: "inv_1",
    totalAmount: 5000,
    currency: "USD",
    dueDate: "February 15, 2024",
  },
  "welcome-onboarding": {
    userName: "John Smith",
  },
};

export const getEmailPreview: RequestHandler = async (req, res) => {
  try {
    const { type } = req.query as { type?: string };

    if (!type) {
      // Return list of available emails
      const types = Object.keys(previewContexts) as EmailTemplateType[];
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Email Template Preview</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              margin: 0;
              padding: 20px;
              background: #f5f7fa;
            }
            .container {
              max-width: 1200px;
              margin: 0 auto;
            }
            h1 {
              color: #0066CC;
              text-align: center;
              margin-bottom: 30px;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 15px;
            }
            .card {
              background: white;
              border-radius: 8px;
              padding: 20px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              transition: transform 0.2s;
            }
            .card:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 8px rgba(0,0,0,0.15);
            }
            .card h3 {
              margin: 0 0 10px 0;
              color: #0066CC;
              font-size: 16px;
            }
            .card p {
              margin: 0 0 15px 0;
              color: #666;
              font-size: 14px;
            }
            .card a {
              display: inline-block;
              padding: 8px 16px;
              background: #0066CC;
              color: white;
              text-decoration: none;
              border-radius: 4px;
              font-size: 14px;
              font-weight: 600;
            }
            .card a:hover {
              background: #004699;
            }
            .category {
              margin-top: 40px;
            }
            .category h2 {
              color: #333;
              font-size: 18px;
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 2px solid #0066CC;
            }
            .badge {
              display: inline-block;
              padding: 4px 8px;
              background: #E6F0FF;
              color: #0066CC;
              border-radius: 4px;
              font-size: 11px;
              font-weight: 600;
              margin-bottom: 10px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>📧 Email Template Preview</h1>
            <p style="text-align: center; color: #666; margin-bottom: 40px;">
              Click on any template to see the full email design
            </p>

            <div class="category">
              <h2>📦 Order Emails</h2>
              <div class="grid">
                <div class="card">
                  <span class="badge">Order</span>
                  <h3>Order Created</h3>
                  <p>Sent when customer completes checkout</p>
                  <a href="?type=order-created">Preview</a>
                </div>
                <div class="card">
                  <span class="badge">Payment</span>
                  <h3>Payment Received</h3>
                  <p>Sent when payment is processed</p>
                  <a href="?type=order-payment-received">Preview</a>
                </div>
                <div class="card">
                  <span class="badge">Order</span>
                  <h3>Order Completed</h3>
                  <p>Sent when company is ready to use</p>
                  <a href="?type=order-completed">Preview</a>
                </div>
                <div class="card">
                  <span class="badge">Status</span>
                  <h3>Order Status Changed</h3>
                  <p>Sent on any status update</p>
                  <a href="?type=order-status-changed">Preview</a>
                </div>
                <div class="card">
                  <span class="badge">Cancelled</span>
                  <h3>Order Cancelled</h3>
                  <p>Sent when order is cancelled</p>
                  <a href="?type=order-cancelled">Preview</a>
                </div>
              </div>
            </div>

            <div class="category">
              <h2>💰 Refund Emails</h2>
              <div class="grid">
                <div class="card">
                  <span class="badge">Refund</span>
                  <h3>Refund Requested</h3>
                  <p>Sent when customer requests refund</p>
                  <a href="?type=refund-requested">Preview</a>
                </div>
                <div class="card">
                  <span class="badge">Approved</span>
                  <h3>Refund Approved</h3>
                  <p>Sent when admin approves refund</p>
                  <a href="?type=refund-approved">Preview</a>
                </div>
                <div class="card">
                  <span class="badge">Rejected</span>
                  <h3>Refund Rejected</h3>
                  <p>Sent when admin rejects refund</p>
                  <a href="?type=refund-rejected">Preview</a>
                </div>
              </div>
            </div>

            <div class="category">
              <h2>📋 Transfer Form Emails</h2>
              <div class="grid">
                <div class="card">
                  <span class="badge">Form</span>
                  <h3>Form Submitted</h3>
                  <p>Sent when form is submitted</p>
                  <a href="?type=transfer-form-submitted">Preview</a>
                </div>
                <div class="card">
                  <span class="badge">Status</span>
                  <h3>Form Status Updated</h3>
                  <p>Sent when form status changes</p>
                  <a href="?type=transfer-form-status">Preview</a>
                </div>
              </div>
            </div>

            <div class="category">
              <h2>📅 Renewal Emails</h2>
              <div class="grid">
                <div class="card">
                  <span class="badge">Reminder</span>
                  <h3>Renewal Reminder</h3>
                  <p>Sent 30 days before expiry</p>
                  <a href="?type=renewal-reminder">Preview</a>
                </div>
                <div class="card">
                  <span class="badge">Completed</span>
                  <h3>Renewal Completed</h3>
                  <p>Sent after renewal processed</p>
                  <a href="?type=renewal-completed">Preview</a>
                </div>
              </div>
            </div>

            <div class="category">
              <h2>👤 Account Emails</h2>
              <div class="grid">
                <div class="card">
                  <span class="badge">Account</span>
                  <h3>Sign-up Confirmation</h3>
                  <p>Sent when new account created</p>
                  <a href="?type=signup-confirmation">Preview</a>
                </div>
                <div class="card">
                  <span class="badge">Account</span>
                  <h3>Account Verification</h3>
                  <p>Sent to verify email address</p>
                  <a href="?type=account-verification">Preview</a>
                </div>
                <div class="card">
                  <span class="badge">Account</span>
                  <h3>Password Reset</h3>
                  <p>Sent when user requests reset</p>
                  <a href="?type=password-reset">Preview</a>
                </div>
              </div>
            </div>

            <div class="category">
              <h2>📊 Admin Emails</h2>
              <div class="grid">
                <div class="card">
                  <span class="badge">Invoice</span>
                  <h3>Invoice Created</h3>
                  <p>Sent when invoice generated</p>
                  <a href="?type=invoice-created">Preview</a>
                </div>
                <div class="card">
                  <span class="badge">Support</span>
                  <h3>Support Ticket</h3>
                  <p>Sent on support request</p>
                  <a href="?type=support-ticket-created">Preview</a>
                </div>
                <div class="card">
                  <span class="badge">Document</span>
                  <h3>Document Uploaded</h3>
                  <p>Sent when file is uploaded</p>
                  <a href="?type=document-uploaded">Preview</a>
                </div>
                <div class="card">
                  <span class="badge">Onboarding</span>
                  <h3>Welcome Guide</h3>
                  <p>Sent on first-time signup</p>
                  <a href="?type=welcome-onboarding">Preview</a>
                </div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `);
    }

    // Validate template type
    if (!previewContexts[type as EmailTemplateType]) {
      return res.status(404).json({ error: `Unknown email type: ${type}` });
    }

    // Get template
    const context = previewContexts[type as EmailTemplateType];
    const template = getEmailTemplate(type as EmailTemplateType, context);

    // Return HTML for preview
    res.send(template.html);
  } catch (error) {
    console.error("Email preview error:", error);
    res.status(500).json({
      error: "Failed to generate preview",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
