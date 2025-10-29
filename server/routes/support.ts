import { Request, Response } from "express";
import nodemailer from "nodemailer";

interface SupportFormData {
  fullName: string;
  email: string;
  companyName: string;
  inquiryType: string;
  message: string;
}

// Initialize email transporter
// Using Gmail or your email provider credentials from environment variables
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function handleSupportSubmit(req: Request, res: Response) {
  try {
    const { fullName, email, companyName, inquiryType, message } = req.body as SupportFormData;

    // Validate required fields
    if (!fullName || !email || !message) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: fullName, email, and message are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email address",
      });
    }

    // Create email content
    const emailSubject = `Support Request - ${inquiryType} from ${fullName}`;

    const emailText = `
Support Request Received

From: ${fullName}
Email: ${email}
Company: ${companyName || "Not provided"}
Inquiry Type: ${inquiryType}

Message:
${message}

---
This is an automated support request from the Sharekte Support Center.
`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { border: 1px solid #e5e7eb; border-top: none; padding: 20px; }
    .field { margin: 15px 0; }
    .label { font-weight: bold; color: #1f2937; }
    .message-box { background-color: #f9fafb; padding: 15px; border-left: 4px solid #2563eb; margin-top: 10px; }
    .footer { color: #6b7280; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>New Support Request</h2>
    </div>
    <div class="content">
      <div class="field">
        <span class="label">From:</span> ${fullName}
      </div>
      <div class="field">
        <span class="label">Email:</span> <a href="mailto:${email}">${email}</a>
      </div>
      ${companyName ? `<div class="field">
        <span class="label">Company:</span> ${companyName}
      </div>` : ""}
      <div class="field">
        <span class="label">Inquiry Type:</span> ${inquiryType}
      </div>
      <div class="field">
        <span class="label">Message:</span>
        <div class="message-box">${message.replace(/\n/g, "<br>")}</div>
      </div>
      <div class="footer">
        <p>This is an automated support request from the Sharekte Support Center. Please respond to the customer at the email address provided above.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    // Send email to support team
    const supportEmail = process.env.SUPPORT_EMAIL || "support@sharekte.com";

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: supportEmail,
      subject: emailSubject,
      text: emailText,
      html: htmlContent,
    });

    // Optional: Send confirmation email to customer
    const confirmationHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { border: 1px solid #e5e7eb; border-top: none; padding: 20px; }
    .message-box { background-color: #f0fdf4; padding: 15px; border-left: 4px solid #16a34a; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>We've Received Your Support Request</h2>
    </div>
    <div class="content">
      <p>Hi ${fullName},</p>
      <p>Thank you for reaching out to Sharekte Support. We've received your support request and our team will review it shortly.</p>
      <div class="message-box">
        <p><strong>What happens next?</strong></p>
        <p>We typically respond to support requests within 24 hours during business days. You'll receive a response at the email address you provided (${email}).</p>
      </div>
      <p><strong>Your Inquiry Details:</strong></p>
      <ul>
        <li><strong>Category:</strong> ${inquiryType}</li>
        <li><strong>Submitted:</strong> ${new Date().toLocaleString()}</li>
      </ul>
      <p>If you need immediate assistance, you can also reach us:</p>
      <ul>
        <li><strong>Email:</strong> support@sharekte.com</li>
        <li><strong>WhatsApp:</strong> +971 50 505 1790 (9AM–6PM UAE Time)</li>
      </ul>
      <p>Best regards,<br>Sharekte Support Team</p>
    </div>
  </div>
</body>
</html>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: "We've Received Your Support Request - Sharekte",
      html: confirmationHtml,
    });

    return res.status(200).json({
      success: true,
      message: "Support request submitted successfully",
    });
  } catch (error) {
    console.error("Error handling support request:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to submit support request. Please try again later.",
    });
  }
}
