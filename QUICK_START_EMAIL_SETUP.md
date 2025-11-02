# Email Templates - 5 Minute Quick Start

## ✅ You're Done! The System is Created

The email template system has been created with **all templates ready to use**. Here's what you got:

### 📦 Files Created
1. **`server/utils/email-templates.ts`** - Complete email system (1241 lines)
   - 19 different email templates
   - Professional HTML design
   - Nodemailer integration
   - Fallback to console logging

2. **`EMAIL_TEMPLATES_DOCUMENTATION.md`** - Complete reference guide
   - All template types explained
   - Context fields required for each
   - Usage examples
   - Configuration guide

3. **`EMAIL_INTEGRATION_EXAMPLES.md`** - Real code examples
   - Order emails integration
   - Refund emails integration
   - Sign-up email integration
   - Renewal job setup

4. **`EMAIL_TEMPLATES_QUICK_REFERENCE.md`** - Visual reference
   - Email template previews
   - Color scheme details
   - Testing guidelines

---

## 🚀 Get Started in 3 Steps

### Step 1: Configure SMTP (1 minute)

Add to your `.env` file:

```env
# SMTP Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_SECURE=false

# Email Settings
FROM_EMAIL=noreply@shareket.com
SUPPORT_EMAIL=support@shareket.com
APP_URL=https://shareket.com
```

**For Gmail:**
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer"
3. Copy the 16-character password
4. Paste it as `EMAIL_PASSWORD`

### Step 2: Add Email to Your First Route (2 minutes)

**Example: Order Creation Email in `server/routes/orders.ts`**

```typescript
import { sendEmail } from "../utils/email-templates";

export const createOrder: RequestHandler = async (req, res) => {
  try {
    // ... existing order creation code ...
    
    const order: Order = {
      id: `ord-${Date.now()}`,
      ...orderData,
      createdAt: orderData.createdAt || now,
      updatedAt: orderData.updatedAt || now,
    };
    
    inMemoryOrders.push(order);
    
    // ✨ NEW: Send confirmation email
    if (order.customerEmail) {
      sendEmail(order.customerEmail, "order-created", {
        customerName: order.customerName,
        orderId: order.orderId,
        orderDate: new Date(order.createdAt).toLocaleDateString(),
        companyName: order.companyName,
        companyNumber: order.companyNumber,
        currency: order.currency,
        amount: order.amount
      }).catch(err => console.error("Email failed:", err));
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: "Failed to create order" });
  }
};
```

### Step 3: Test It (1 minute)

**Option A: Test without SMTP (console only)**
```bash
# Just run your dev server - emails log to console
npm run dev

# Check console output:
# [EMAIL SENT] order-created to customer@example.com
```

**Option B: Test with real SMTP**
```bash
# 1. Make sure .env has SMTP configured
# 2. Run server
npm run dev

# 3. Make a test order via Checkout
# 4. Check your email inbox for confirmation

# 5. Should appear in 10-30 seconds
```

---

## 📧 All Email Templates Available

Copy any of these patterns to add emails to other routes:

### 1. Order Confirmation (When Order Created)
```typescript
await sendEmail(customer.email, "order-created", {
  customerName: customer.name,
  orderId: order.id,
  orderDate: new Date().toLocaleDateString(),
  companyName: order.companyName,
  companyNumber: order.companyNumber,
  currency: order.currency,
  amount: order.amount
});
```

### 2. Payment Received (When Payment Confirmed)
```typescript
await sendEmail(customer.email, "order-payment-received", {
  customerName: customer.name,
  orderId: order.id,
  currency: order.currency,
  amount: order.amount,
  paymentMethod: "credit_card",
  paymentDate: new Date().toLocaleDateString(),
  transactionId: payment.id,
  companyName: order.companyName
});
```

### 3. Order Completed (When Company Ready)
```typescript
await sendEmail(customer.email, "order-completed", {
  customerName: customer.name,
  companyId: company.id,
  companyName: company.name,
  companyNumber: company.number,
  country: company.country,
  renewalDate: company.renewalDate,
  currency: "USD",
  amount: order.amount
});
```

### 4. Status Changed (Any Time Status Updates)
```typescript
await sendEmail(customer.email, "order-status-changed", {
  customerName: customer.name,
  orderId: order.id,
  status: order.status,
  companyName: order.companyName,
  currency: order.currency,
  amount: order.amount,
  statusChangedDate: new Date().toLocaleDateString(),
  statusNotes: "Your order is being processed"
});
```

### 5. Refund Approved (When Admin Approves Refund)
```typescript
const fee = order.amount * 0.03;
const refundAmount = order.amount - fee;

await sendEmail(customer.email, "refund-approved", {
  customerName: customer.name,
  orderId: order.id,
  currency: order.currency,
  originalAmount: order.amount,
  processingFee: fee,
  refundAmount: refundAmount
});
```

### 6. Sign-up Confirmation (When User Registers)
```typescript
await sendEmail(user.email, "signup-confirmation", {
  userName: user.name,
  email: user.email,
  createdDate: new Date().toLocaleDateString()
});
```

### 7. Renewal Reminder (30 days before expiry)
```typescript
await sendEmail(customer.email, "renewal-reminder", {
  customerName: customer.name,
  companyId: company.id,
  companyName: company.name,
  companyNumber: company.number,
  renewalDate: company.renewalDate,
  daysUntilRenewal: 30,
  currency: "USD",
  renewalFee: 50
});
```

### 8. Transfer Form Status (When Form Status Changes)
```typescript
await sendEmail(form.buyerEmail, "transfer-form-status", {
  buyerName: form.buyerName,
  formId: form.id,
  companyId: form.companyId,
  companyName: form.companyName,
  companyNumber: form.companyNumber,
  status: "amend-required",
  updatedDate: new Date().toLocaleDateString(),
  statusNotes: "Please update the shareholder information"
});
```

---

## 🎯 Implementation Priority

### Priority 1: Critical (Do First)
1. ✅ Order Created - Customer confirmation
2. ✅ Payment Received - Payment confirmation
3. ✅ Order Completed - Company ready announcement

### Priority 2: Important (Do Second)
4. ✅ Sign-up Confirmation - Welcome new users
5. ✅ Transfer Form Status - Form progress updates
6. ✅ Refund Approved - Refund confirmations

### Priority 3: Nice to Have (Do Later)
7. ✅ Renewal Reminder - Automatic reminders
8. ✅ Order Status Changed - Progress updates
9. ✅ Password Reset - Account recovery
10. ✅ Others - As needed

---

## 🔍 How to Find Your Email in Code

### Add to Order Creation (Most Important First)

**File:** `server/routes/orders.ts`

**Find:** The `createOrder` function (around line 310)

**Add this after order is saved:**
```typescript
// Send confirmation email
if (order.customerEmail) {
  sendEmail(order.customerEmail, "order-created", {
    customerName: order.customerName,
    orderId: order.orderId,
    orderDate: new Date(order.createdAt).toLocaleDateString(),
    companyName: order.companyName,
    companyNumber: order.companyNumber,
    currency: order.currency,
    amount: order.amount
  }).catch(err => console.error("Email send failed:", err));
}
```

**Don't forget the import at top:**
```typescript
import { sendEmail } from "../utils/email-templates";
```

---

## 🧪 Test Email System

### Test Without SMTP (No Credentials Needed)
```bash
# Remove or don't set EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD
# Just run the server
npm run dev

# Make a test order through checkout
# Check the terminal - you'll see:
# [EMAIL SENT] order-created to customer@example.com

# The email content logs to console, not sent
```

### Test With Gmail SMTP

1. Get Gmail App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Select Mail + Windows Computer
   - Copy password

2. Add to `.env`:
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-gmail@gmail.com
   EMAIL_PASSWORD=<16-char password from above>
   ```

3. Restart server:
   ```bash
   npm run dev
   ```

4. Test:
   - Go to checkout
   - Create test order
   - Check email in 10-30 seconds
   - Email should arrive!

### Test Endpoint (Optional)

Add this test endpoint to `server/index.ts`:
```typescript
app.post("/api/test-email", async (req, res) => {
  const { sendEmail } = await import("../utils/email-templates");
  const success = await sendEmail("your-email@example.com", "signup-confirmation", {
    userName: "Test User",
    email: "your-email@example.com",
    createdDate: new Date().toLocaleDateString()
  });
  res.json({ success });
});
```

Then test:
```bash
curl -X POST http://localhost:8080/api/test-email
```

---

## 📝 Checklist

### Before You Start
- [ ] Read this file
- [ ] Understand the 3 steps above

### Step 1: Setup
- [ ] Get Gmail app password (if using Gmail)
- [ ] Add SMTP vars to `.env`
- [ ] Restart dev server

### Step 2: Add to Code
- [ ] Import `sendEmail` in `server/routes/orders.ts`
- [ ] Add email call after order creation
- [ ] Save file

### Step 3: Test
- [ ] Test without SMTP (console output)
- [ ] Test with SMTP (check inbox)
- [ ] Verify email looks good
- [ ] Check all links work

### Step 4: Expand (After First Works)
- [ ] Add payment received email
- [ ] Add order completed email
- [ ] Add sign-up email
- [ ] Add other emails as needed

---

## 💡 Pro Tips

### Tip 1: Fire and Forget
```typescript
// Don't await - emails send in background
sendEmail(email, type, context).catch(err => 
  console.error("Email send failed:", err)
);

// User sees response immediately
res.json({ success: true });
```

### Tip 2: Log Important Ones
```typescript
const sent = await sendEmail(email, "order-completed", context);
if (sent) {
  console.log(`✓ Order completed email sent to ${email}`);
} else {
  console.error(`✗ Failed to send order completed email`);
}
```

### Tip 3: Add Retry Logic (Optional)
```typescript
let retries = 0;
const maxRetries = 3;

while (retries < maxRetries) {
  try {
    const sent = await sendEmail(email, type, context);
    if (sent) break;
  } catch (error) {
    retries++;
    if (retries >= maxRetries) throw error;
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s
  }
}
```

### Tip 4: Add to Multiple Routes Gradually
```
Week 1: Orders (creation, payment, completed)
Week 2: Sign-up, Transfer forms
Week 3: Renewals, Refunds
Week 4: Everything else
```

---

## 🚨 Troubleshooting

### "Email not sending?"

1. Check SMTP in `.env`:
   ```bash
   grep EMAIL_ .env
   ```

2. Check that values match Gmail app password (16 chars, no spaces)

3. Check firewall allows SMTP (port 587)

4. Check server logs:
   ```bash
   # Look for [EMAIL SENT] or [EMAIL ERROR]
   npm run dev
   ```

5. Check email spam folder

6. Try enabling "less secure apps" on Gmail account

### "Wrong email format?"

1. Most email clients support HTML (Gmail, Outlook do)
2. If not working, fall back to text version included
3. Check email source code to see HTML is correct

### "No email received in 5 minutes?"

1. Check spam folder first
2. Verify email address is correct
3. Check SMTP credentials
4. Try test endpoint
5. Check if Gmail blocks the app

---

## 📞 Questions?

- **Full docs:** `EMAIL_TEMPLATES_DOCUMENTATION.md`
- **Integration code:** `EMAIL_INTEGRATION_EXAMPLES.md`
- **Visual previews:** `EMAIL_TEMPLATES_QUICK_REFERENCE.md`
- **Source code:** `server/utils/email-templates.ts`

---

## ✨ You're All Set!

The email system is ready to use. Start with order confirmation and expand from there. All templates are pre-built and ready to send!

**Next: Add the import and sendEmail call to your orders route → Test → Done!** 🚀
