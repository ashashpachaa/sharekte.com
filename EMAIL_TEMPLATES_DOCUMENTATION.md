# Email Templates System - Complete Documentation

## Overview

Sharekte has a comprehensive email template system that handles all types of notifications across the platform. The system is located in `server/utils/email-templates.ts` and provides professional, branded HTML and text email templates for:

- **Order Notifications** - Creation, payment, status changes, completion
- **Refund Management** - Requests, approvals, rejections
- **Transfer Forms** - Submission, status updates
- **Account Management** - Sign-ups, password resets
- **Renewals** - Reminders and completion notifications
- **Support** - Tickets and documents
- **Invoices** - Creation and payment

## Email Template Types

### 1. Order Created (`order-created`)
**When:** Immediately after customer completes checkout
**Recipients:** Customer
**Purpose:** Confirms order received and payment is being processed

**Required Context:**
```typescript
{
  customerName: string;      // Customer's name
  orderId: string;           // Unique order ID
  orderDate: string;         // Date order was placed
  companyName: string;       // Company name purchased
  companyNumber: string;     // Company registration number
  currency: string;          // USD, AED, EUR, etc.
  amount: number;            // Purchase amount
}
```

**Example Usage:**
```typescript
await sendEmail(customer.email, "order-created", {
  customerName: "John Smith",
  orderId: "ORD-2024-001",
  orderDate: new Date().toLocaleDateString(),
  companyName: "Tech Solutions Ltd",
  companyNumber: "12345678",
  currency: "USD",
  amount: 500
});
```

---

### 2. Order Payment Received (`order-payment-received`)
**When:** After payment is successfully processed
**Recipients:** Customer
**Purpose:** Confirms payment and initiates transfer process

**Required Context:**
```typescript
{
  customerName: string;
  orderId: string;
  currency: string;
  amount: number;
  paymentMethod: string;     // "credit_card", "bank_transfer", etc.
  paymentDate: string;
  transactionId: string;     // Payment processor transaction ID
  companyName: string;
  invoiceId?: string;        // Optional invoice reference
}
```

---

### 3. Order Completed (`order-completed`)
**When:** Company transfer is fully completed and ready to use
**Recipients:** Customer
**Purpose:** Notifies customer company is ready with all documents

**Required Context:**
```typescript
{
  customerName: string;
  companyId: string;
  companyName: string;
  companyNumber: string;
  country: string;           // Jurisdiction (UK, UAE, etc.)
  renewalDate: string;       // Next renewal date
  currency?: string;
  amount?: number;
}
```

**Important:** This is the most important email - customer finally gets their company!

---

### 4. Order Status Changed (`order-status-changed`)
**When:** Any status change (pending → transferred, etc.)
**Recipients:** Customer
**Purpose:** Updates customer on order progress

**Required Context:**
```typescript
{
  customerName: string;
  orderId: string;
  status: string;            // Current order status
  companyName: string;
  currency: string;
  amount: number;
  statusChangedDate: string;
  statusNotes?: string;      // Admin notes about the change
}
```

**Status Values:**
- `pending-payment` - Waiting for payment
- `payment-confirmed` - Payment received
- `transfer-in-progress` - Transfer underway
- `completed` - Company ready
- `transferred` - Transfer complete
- `cancelled` - Order cancelled
- `refunded` - Refund processed

---

### 5. Refund Approved (`refund-approved`)
**When:** Admin approves a refund request
**Recipients:** Customer
**Purpose:** Confirms refund and provides timeline

**Required Context:**
```typescript
{
  customerName: string;
  orderId: string;
  currency: string;
  originalAmount: number;    // Original purchase price
  processingFee: number;     // Fee deducted (typically 3%)
  refundAmount: number;      // Final refund amount
}
```

**Example Calculation:**
```typescript
const originalAmount = 1000;
const processingFee = originalAmount * 0.03; // 3% fee
const refundAmount = originalAmount - processingFee; // 970
```

---

### 6. Renewal Reminder (`renewal-reminder`)
**When:** 30 days before company expiration (configurable)
**Recipients:** Company owner
**Purpose:** Alerts about upcoming renewal with urgency indicators

**Required Context:**
```typescript
{
  customerName: string;
  companyId: string;
  companyName: string;
  companyNumber: string;
  renewalDate: string;       // Expiration date
  daysUntilRenewal: number;  // Days remaining
  currency: string;
  renewalFee: number;
}
```

**Urgency Levels:**
- ≤ 7 days: Red alert
- ≤ 14 days: Orange warning
- > 14 days: Blue info

---

### 7. Sign-up Confirmation (`signup-confirmation`)
**When:** User creates new account
**Recipients:** New user
**Purpose:** Confirms account creation and provides next steps

**Required Context:**
```typescript
{
  userName: string;          // User's name
  email: string;
  createdDate: string;       // Account creation date
}
```

---

### 8. Transfer Form Submitted (`transfer-form-submitted`)
**When:** Customer submits transfer form
**Recipients:** Customer
**Purpose:** Confirms form received and under review

**Required Context:**
```typescript
{
  buyerName: string;
  formId: string;
  companyName: string;
  companyNumber: string;
}
```

---

### 9. Transfer Form Status (`transfer-form-status`)
**When:** Admin updates form status
**Recipients:** Customer
**Purpose:** Updates on form progress with action items when needed

**Required Context:**
```typescript
{
  buyerName: string;
  formId: string;
  companyId?: string;
  companyName: string;
  companyNumber: string;
  status: string;            // Form status
  updatedDate: string;
  statusNotes?: string;      // Why status changed
}
```

**Status Values:**
- `under-review` - Being reviewed by team
- `amend-required` - Needs corrections (customer action needed)
- `confirm-application` - Awaiting confirmation
- `transferring` - Transfer in progress
- `complete-transfer` - Completed successfully
- `canceled` - Form cancelled

---

### 10. Password Reset (`password-reset`)
**When:** User requests password reset
**Recipients:** User
**Purpose:** Provides secure reset link (24-hour expiration)

**Required Context:**
```typescript
{
  userName: string;
  resetLink: string;         // Full URL to reset form
}
```

---

### 11. Welcome Onboarding (`welcome-onboarding`)
**When:** First-time signup (optional follow-up)
**Recipients:** New user
**Purpose:** Explains platform features and next steps

**Required Context:**
```typescript
{
  userName: string;
}
```

---

### 12. Invoice Created (`invoice-created`)
**When:** Invoice is generated
**Recipients:** Invoice recipient
**Purpose:** Provides invoice details and payment information

**Required Context:**
```typescript
{
  clientName: string;
  clientEmail: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceId: string;
  totalAmount: number;
  currency: string;
  dueDate: string;
}
```

---

### 13. Support Ticket Created (`support-ticket-created`)
**When:** Customer submits support request
**Recipients:** Customer
**Purpose:** Confirms ticket creation with tracking number

**Required Context:**
```typescript
{
  userName: string;
  ticketId: string;
  category: string;          // Support category
}
```

---

## How to Use

### Basic Email Sending

```typescript
import { sendEmail } from "../utils/email-templates";

// Send a single email
const success = await sendEmail(
  "customer@example.com",
  "order-created",
  {
    customerName: "John Smith",
    orderId: "ORD-001",
    // ... other context fields
  }
);

if (success) {
  console.log("Email sent successfully");
} else {
  console.log("Email failed - check server logs");
}
```

### Batch Sending

```typescript
import { sendBatchEmails } from "../utils/email-templates";

const recipients = [
  {
    email: "customer1@example.com",
    context: { customerName: "John", renewalDate: "2024-12-31", /* ... */ }
  },
  {
    email: "customer2@example.com",
    context: { customerName: "Jane", renewalDate: "2024-11-30", /* ... */ }
  }
];

const result = await sendBatchEmails(recipients, "renewal-reminder");
console.log(`Sent: ${result.success}, Failed: ${result.failed}`);
```

### Integration in Routes

```typescript
// In server/routes/orders.ts
import { sendEmail } from "../utils/email-templates";

export const createOrder: RequestHandler = async (req, res) => {
  try {
    const order = req.body;
    
    // Create order in database...
    
    // Send confirmation email
    await sendEmail(order.customerEmail, "order-created", {
      customerName: order.customerName,
      orderId: order.orderId,
      orderDate: new Date().toLocaleDateString(),
      companyName: order.companyName,
      companyNumber: order.companyNumber,
      currency: order.currency,
      amount: order.amount
    });
    
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ error: "Failed to create order" });
  }
};
```

---

## Email Configuration

### Environment Variables Required

```env
# SMTP Configuration
EMAIL_HOST=smtp.gmail.com          # SMTP server hostname
EMAIL_PORT=587                     # SMTP port (587 for TLS, 465 for SSL)
EMAIL_USER=your-email@gmail.com    # Email account username
EMAIL_PASSWORD=your-app-password   # Email account password (or app password)
EMAIL_SECURE=false                 # true for SSL (port 465), false for TLS (port 587)

# Email Settings
FROM_EMAIL=noreply@shareket.com    # From email address
SUPPORT_EMAIL=support@shareket.com # Support email address

# App Settings
APP_URL=https://shareket.com       # Main app URL (used in email links)
```

### SMTP Providers

**Gmail:**
```
Host: smtp.gmail.com
Port: 587
User: your-email@gmail.com
Password: Your App Password (not your Gmail password)
Secure: false
```

**SendGrid:**
```
Host: smtp.sendgrid.net
Port: 587
User: apikey
Password: Your SendGrid API key
Secure: false
```

**Postmark:**
```
Host: smtp.postmarkapp.com
Port: 587
User: Your Postmark API token
Password: Your Postmark API token
Secure: false
```

**Office 365:**
```
Host: smtp.office365.com
Port: 587
User: your-email@company.com
Password: Your Office 365 password
Secure: false
```

---

## Branding & Customization

The email system uses the following brand colors:

```typescript
BRAND_COLOR = "#0066CC";          // Sharekte primary blue (logo color)
BRAND_COLOR_DARK = "#004699";     // Darker blue for hover
BRAND_COLOR_LIGHT = "#E6F0FF";    // Light blue backgrounds
SUCCESS_COLOR = "#10B981";        // Green for positive actions
WARNING_COLOR = "#F59E0B";        // Orange for warnings/reminders
DANGER_COLOR = "#EF4444";         // Red for errors/cancellations
```

All templates automatically use these colors. To change branding:

1. Update colors in `server/utils/email-templates.ts`
2. Change `COMPANY_NAME` constant (currently "Sharekte")
3. Update `APP_URL` in environment variables
4. All emails will automatically update

---

## Fallback Behavior

If SMTP is not configured (EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD not set):

1. Emails are logged to console with `[EMAIL NOTIFICATION]` prefix
2. Function still returns `true` (doesn't fail)
3. Perfect for development/testing without real email
4. Production should always have SMTP configured

Example console output:
```
[EMAIL NOTIFICATION] Order Confirmed: ORD-2024-001
To: customer@example.com
Type: order-created

Order Confirmed: ORD-2024-001

Dear John Smith,

Your order has been received and confirmed...
```

---

## Best Practices

### 1. Always Include Context Validation
```typescript
if (!order.customerEmail || !order.orderId) {
  console.error("Missing required email context");
  return;
}
await sendEmail(order.customerEmail, "order-created", { /* ... */ });
```

### 2. Send Emails Asynchronously
```typescript
// Don't await - fire and forget pattern
sendEmail(email, type, context).catch(err => 
  console.error("Email failed:", err)
);

// Return response to user immediately
res.json({ success: true });
```

### 3. Log Important Emails
```typescript
const success = await sendEmail(email, "order-completed", context);
if (success) {
  await logEmailSent(email, "order-completed", order.id);
}
```

### 4. Handle Rate Limiting
```typescript
// For batch operations, add delays
for (const recipient of recipients) {
  await sendEmail(recipient.email, type, context);
  await delay(100); // Prevent rate limiting
}
```

### 5. Use Proper Date Formatting
```typescript
// ✓ Good
const date = new Date().toLocaleDateString("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric"
});

// ✗ Bad - inconsistent format
const date = new Date().toString();
```

---

## Testing Email Templates

### Test Without SMTP

```bash
# Just set these in .env
NODE_ENV=development
# Don't set EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD

# Emails will log to console - inspect console output
```

### Test With Real SMTP

```bash
# Set all SMTP variables in .env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=test@gmail.com
EMAIL_PASSWORD=your-app-password

# Make a test request
curl -X POST http://localhost:8080/api/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "type": "signup-confirmation",
    "context": {
      "userName": "Test User",
      "email": "your-email@example.com",
      "createdDate": "2024-01-15"
    }
  }'
```

---

## Integration Checklist

- [ ] Email templates file created: `server/utils/email-templates.ts`
- [ ] Environment variables configured in `.env`
- [ ] SMTP credentials verified (test with sending one email)
- [ ] Email imports added to routes that need them
- [ ] `sendEmail()` calls added to order creation route
- [ ] `sendEmail()` calls added to order status change route
- [ ] `sendEmail()` calls added to signup route
- [ ] `sendEmail()` calls added to transfer form submission
- [ ] `sendEmail()` calls added to refund approval route
- [ ] Renewal reminder job scheduled (cron job or Lambda)
- [ ] Test emails received in inbox
- [ ] Production SMTP credentials configured
- [ ] Email logs reviewed in server console

---

## Troubleshooting

### Emails Not Sending

**Problem:** "Email failed - check server logs"

**Solutions:**
1. Check SMTP credentials in `.env`
2. Verify EMAIL_HOST is correct
3. Check EMAIL_PORT matches protocol (587 for TLS, 465 for SSL)
4. Ensure EMAIL_SECURE matches port (false for 587, true for 465)
5. Check email account password is correct
6. Verify firewall allows outbound SMTP connections
7. Check email account spam folder

### Wrong Email Format

**Problem:** Emails show as text/plain instead of HTML

**Solutions:**
1. Email client doesn't support HTML (Gmail, Outlook do)
2. Set `secure` flag correctly in SMTP config
3. Verify email arrives with `text/html` content-type header
4. Try sending to different email provider

### Rate Limiting

**Problem:** "Too many emails in short time"

**Solutions:**
1. Add delay between batch sends: `await delay(100);`
2. Check SMTP provider rate limits
3. Use email queue service for production
4. Implement job queue with rate limiting

### Recipient Doesn't Receive Email

**Problem:** Email shows as sent but recipient never gets it

**Solutions:**
1. Check spam folder
2. Verify email address is correct
3. Check firewall/antivirus blocks
4. Enable less secure app access (Gmail)
5. Verify SPF/DKIM records (for custom domains)

---

## Future Enhancements

- [ ] Email queue system for reliable delivery
- [ ] Template versioning and A/B testing
- [ ] Unsubscribe links and preference management
- [ ] Email tracking (opens, clicks)
- [ ] Attachment support (PDFs, documents)
- [ ] Multi-language templates (RTL for Arabic)
- [ ] Email preview system
- [ ] Scheduled sending
- [ ] Webhook notifications
