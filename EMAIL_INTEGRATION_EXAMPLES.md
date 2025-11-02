# Email Integration Examples

This file shows exactly where and how to integrate email templates into your existing routes.

## 1. Order Creation - Send Order Confirmation

**File:** `server/routes/orders.ts`

**Location:** In the `createOrder` handler, after order is saved

**Before:**
```typescript
export const createOrder: RequestHandler = async (req, res) => {
  try {
    const orderData = req.body;
    const order: Order = {
      id: `ord-${Date.now()}`,
      ...orderData,
      createdAt: orderData.createdAt || now,
      updatedAt: orderData.updatedAt || now,
    };

    inMemoryOrders.push(order);
    console.log("[createOrder] ✓ Stored order in-memory");

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: "Failed to create order" });
  }
};
```

**After:**
```typescript
import { sendEmail } from "../utils/email-templates";

export const createOrder: RequestHandler = async (req, res) => {
  try {
    const orderData = req.body;
    const now = new Date().toISOString();
    const order: Order = {
      id: `ord-${Date.now()}`,
      ...orderData,
      createdAt: orderData.createdAt || now,
      updatedAt: orderData.updatedAt || now,
    };

    inMemoryOrders.push(order);
    console.log("[createOrder] ✓ Stored order in-memory");

    // Send order confirmation email
    if (order.customerEmail) {
      (async () => {
        try {
          await sendEmail(order.customerEmail, "order-created", {
            customerName: order.customerName,
            orderId: order.orderId,
            orderDate: new Date(order.createdAt).toLocaleDateString(),
            companyName: order.companyName,
            companyNumber: order.companyNumber,
            currency: order.currency,
            amount: order.amount
          });
        } catch (emailError) {
          console.error("[createOrder] Email failed:", emailError);
          // Don't fail the order - email is secondary
        }
      })();
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: "Failed to create order" });
  }
};
```

---

## 2. Payment Received - Send Payment Confirmation

**File:** `server/routes/orders.ts`

**Location:** In a new `markPaymentReceived` handler (called from Checkout.tsx)

**Add this handler:**
```typescript
/**
 * Mark payment as received and send confirmation email
 */
export const markPaymentReceived: RequestHandler = async (req, res) => {
  try {
    const { orderId, transactionId, paymentDate } = req.body;
    
    // Find order
    const order = inMemoryOrders.find(o => o.orderId === orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Update order
    order.paymentStatus = "completed";
    order.transactionId = transactionId;
    order.paymentDate = paymentDate || new Date().toISOString().split("T")[0];

    // Send payment confirmation email
    if (order.customerEmail) {
      (async () => {
        try {
          await sendEmail(order.customerEmail, "order-payment-received", {
            customerName: order.customerName,
            orderId: order.orderId,
            currency: order.currency,
            amount: order.amount,
            paymentMethod: order.paymentMethod,
            paymentDate: order.paymentDate,
            transactionId: order.transactionId || transactionId,
            companyName: order.companyName,
            invoiceId: order.id
          });
        } catch (emailError) {
          console.error("[markPaymentReceived] Email failed:", emailError);
        }
      })();
    }

    res.json({ success: true, order });
  } catch (error) {
    console.error("[markPaymentReceived] Error:", error);
    res.status(500).json({ error: "Failed to mark payment" });
  }
};
```

**Register in `server/index.ts`:**
```typescript
app.post("/api/orders/:orderId/mark-payment", markPaymentReceived);
```

**Call from `client/pages/Checkout.tsx`:**
```typescript
// After successful payment processing
await fetch(`/api/orders/${orderId}/mark-payment`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    orderId,
    transactionId: paymentResult.transactionId,
    paymentDate: new Date().toISOString().split("T")[0]
  })
});
```

---

## 3. Order Status Changed - Send Status Update

**File:** `server/routes/orders.ts`

**Location:** In the `updateOrderStatus` handler (probably exists already)

**Find this and update it:**
```typescript
export const updateOrderStatus: RequestHandler = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body;

    const order = inMemoryOrders.find(o => o.orderId === orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const oldStatus = order.status;
    order.status = status;
    order.statusChangedDate = new Date().toISOString().split("T")[0];

    // Add to status history
    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({
      id: `hist_${Date.now()}`,
      fromStatus: oldStatus,
      toStatus: status,
      changedDate: order.statusChangedDate,
      changedBy: "admin",
      notes: notes || ""
    });

    // Send status change email
    if (order.customerEmail) {
      (async () => {
        try {
          await sendEmail(order.customerEmail, "order-status-changed", {
            customerName: order.customerName,
            orderId: order.orderId,
            status: status,
            companyName: order.companyName,
            currency: order.currency,
            amount: order.amount,
            statusChangedDate: order.statusChangedDate,
            statusNotes: notes
          });
        } catch (emailError) {
          console.error("[updateOrderStatus] Email failed:", emailError);
        }
      })();
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ error: "Failed to update order status" });
  }
};
```

---

## 4. Order Completed - Send Completion Email

**File:** `server/routes/orders.ts`

**Location:** In the `updateOrderStatus` handler, when status becomes "completed" or "transferred"

**Update the handler:**
```typescript
export const updateOrderStatus: RequestHandler = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body;

    const order = inMemoryOrders.find(o => o.orderId === orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const oldStatus = order.status;
    order.status = status;
    order.statusChangedDate = new Date().toISOString().split("T")[0];

    // Send appropriate email based on new status
    if (order.customerEmail) {
      (async () => {
        try {
          if (status === "completed" || status === "transferred") {
            // Send completion email with company details
            await sendEmail(order.customerEmail, "order-completed", {
              customerName: order.customerName,
              companyId: order.companyId,
              companyName: order.companyName,
              companyNumber: order.companyNumber,
              country: order.country,
              renewalDate: order.renewalDate,
              currency: order.currency,
              amount: order.amount
            });
          } else {
            // Send general status change email
            await sendEmail(order.customerEmail, "order-status-changed", {
              customerName: order.customerName,
              orderId: order.orderId,
              status: status,
              companyName: order.companyName,
              currency: order.currency,
              amount: order.amount,
              statusChangedDate: order.statusChangedDate,
              statusNotes: notes
            });
          }
        } catch (emailError) {
          console.error("[updateOrderStatus] Email failed:", emailError);
        }
      })();
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ error: "Failed to update order status" });
  }
};
```

---

## 5. Sign-up Confirmation - Send Welcome Email

**File:** `server/routes/auth.ts` (or create if doesn't exist)

**Add this handler:**
```typescript
import { sendEmail } from "../utils/email-templates";

export const signup: RequestHandler = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    // Check if user exists
    // ... (add database check if using database)

    // Create user
    const user = {
      id: `user_${Date.now()}`,
      email,
      firstName,
      lastName,
      createdAt: new Date().toISOString()
    };

    // Hash password and save (add your auth logic)
    // ... (implement password hashing)

    // Send signup confirmation email
    if (email) {
      (async () => {
        try {
          await sendEmail(email, "signup-confirmation", {
            userName: `${firstName} ${lastName}`.trim() || email.split("@")[0],
            email: email,
            createdDate: new Date().toLocaleDateString()
          });
        } catch (emailError) {
          console.error("[signup] Email failed:", emailError);
        }
      })();
    }

    res.json({
      success: true,
      message: "Account created successfully",
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`.trim()
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create account" });
  }
};
```

---

## 6. Refund Approved - Send Refund Confirmation

**File:** `server/routes/orders.ts`

**Location:** In the `approveRefund` handler (probably exists)

**Update it:**
```typescript
import { sendEmail } from "../utils/email-templates";

export const approveRefund: RequestHandler = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { notes } = req.body;

    const order = inMemoryOrders.find(o => o.orderId === orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Calculate refund amount (3% processing fee)
    const originalAmount = order.amount;
    const processingFee = originalAmount * 0.03;
    const refundAmount = originalAmount - processingFee;

    // Update order
    order.refundStatus = "approved";
    order.status = "refunded";

    // Send refund approval email
    if (order.customerEmail) {
      (async () => {
        try {
          await sendEmail(order.customerEmail, "refund-approved", {
            customerName: order.customerName,
            orderId: order.orderId,
            currency: order.currency,
            originalAmount: originalAmount,
            processingFee: parseFloat(processingFee.toFixed(2)),
            refundAmount: parseFloat(refundAmount.toFixed(2))
          });
        } catch (emailError) {
          console.error("[approveRefund] Email failed:", emailError);
        }
      })();
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ error: "Failed to approve refund" });
  }
};
```

---

## 7. Transfer Form Status Changed - Send Form Update

**File:** `server/routes/transfer-forms.ts`

**Location:** Already has email integration! But update to use new system:

**Current code (around line 413):**
```typescript
(async () => {
  try {
    const { sendFormStatusNotification } = await import(
      "../utils/form-notifications"
    );
    await sendFormStatusNotification(
      updated,
      newStatus,
      notes,
      reason,
      adminEmail
    );
  } catch (error) {
    console.error("Error sending notification:", error);
  }
})();
```

**Can be updated to use new system (optional):**
```typescript
import { sendEmail } from "../utils/email-templates";

(async () => {
  try {
    await sendEmail(form.buyerEmail, "transfer-form-status", {
      buyerName: form.buyerName,
      formId: form.formId,
      companyId: form.id,
      companyName: form.companyName,
      companyNumber: form.companyNumber,
      status: newStatus,
      updatedDate: new Date().toLocaleDateString(),
      statusNotes: notes
    });
  } catch (error) {
    console.error("Error sending email:", error);
  }
})();
```

---

## 8. Renewal Reminder - Scheduled Job

**File:** Create `server/jobs/renewal-reminders.ts`

**New file:**
```typescript
/**
 * Scheduled job to send renewal reminders
 * Run daily to check for companies expiring in 30 days
 */

import { sendEmail } from "../utils/email-templates";
import { fetchOrdersFromAirtable } from "../utils/airtable-sync";

export async function sendRenewalReminders() {
  try {
    const orders = await fetchOrdersFromAirtable();
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    let remindersSent = 0;

    for (const order of orders) {
      if (!order.renewalDate || order.status === "cancelled" || order.status === "refunded") {
        continue;
      }

      const renewalDate = new Date(order.renewalDate);
      const daysUntilRenewal = Math.ceil(
        (renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Send reminder if renewal is within 30 days
      if (daysUntilRenewal > 0 && daysUntilRenewal <= 30) {
        const reminderSent = await sendEmail(
          order.customerEmail,
          "renewal-reminder",
          {
            customerName: order.customerName,
            companyId: order.companyId,
            companyName: order.companyName,
            companyNumber: order.companyNumber,
            renewalDate: order.renewalDate,
            daysUntilRenewal: daysUntilRenewal,
            currency: order.currency,
            renewalFee: order.renewalFees || 50
          }
        );

        if (reminderSent) {
          remindersSent++;
        }
      }
    }

    console.log(`[Renewal Reminders] Sent ${remindersSent} reminders`);
    return { sent: remindersSent };
  } catch (error) {
    console.error("[Renewal Reminders] Failed:", error);
    throw error;
  }
}
```

**Call this daily (using cron or your scheduler):**
```typescript
// In server/index.ts
import { sendRenewalReminders } from "./jobs/renewal-reminders";

// Run every day at 9 AM
const schedule = require("node-schedule");
schedule.scheduleJob("0 9 * * *", async () => {
  console.log("[Scheduler] Running renewal reminder job");
  await sendRenewalReminders();
});
```

---

## 9. Invoice Created - Send Invoice

**File:** `server/routes/invoices.ts`

**Location:** In the invoice creation/update handler

**Add email sending:**
```typescript
import { sendEmail } from "../utils/email-templates";

export const createInvoice: RequestHandler = async (req, res) => {
  try {
    const invoiceData = req.body;
    const invoice: Invoice = {
      id: `inv_${Date.now()}`,
      ...invoiceData,
      createdAt: new Date().toISOString()
    };

    // Save invoice
    // ... (add your save logic)

    // Send invoice email
    if (invoice.clientEmail) {
      (async () => {
        try {
          await sendEmail(invoice.clientEmail, "invoice-created", {
            clientName: invoice.clientName,
            clientEmail: invoice.clientEmail,
            invoiceNumber: invoice.invoiceNumber,
            invoiceDate: new Date(invoice.createdAt).toLocaleDateString(),
            invoiceId: invoice.id,
            totalAmount: invoice.totalAmount || 0,
            currency: invoice.currency || "USD",
            dueDate: invoice.dueDate || ""
          });
        } catch (emailError) {
          console.error("[createInvoice] Email failed:", emailError);
        }
      })();
    }

    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: "Failed to create invoice" });
  }
};
```

---

## 10. Test Email Endpoint (Development)

**File:** `server/index.ts` or `server/routes/test.ts`

**Add this endpoint for testing:**
```typescript
import { sendEmail } from "../utils/email-templates";

app.post("/api/test-email", async (req, res) => {
  try {
    const { email, type, context } = req.body;

    const success = await sendEmail(email, type, context);

    res.json({
      success,
      message: success
        ? "Email sent (check console/inbox)"
        : "Email failed (check console)"
    });
  } catch (error) {
    res.status(400).json({
      error: `Invalid email type: ${error}`
    });
  }
});
```

**Test it:**
```bash
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

## Summary of Changes

### Files to Modify:
1. **server/routes/orders.ts** - Add emails to create, payment, status, complete
2. **server/routes/auth.ts** - Add signup confirmation email
3. **server/routes/invoices.ts** - Add invoice email
4. **server/index.ts** - Register new routes, schedule renewal job
5. **server/routes/transfer-forms.ts** - Update to use new email system (optional)

### Files to Create:
1. **server/utils/email-templates.ts** ✅ (already created)
2. **server/jobs/renewal-reminders.ts** - Scheduled renewal job
3. **server/routes/test.ts** - Test endpoint (optional)

### Environment Variables to Set:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
FROM_EMAIL=noreply@shareket.com
SUPPORT_EMAIL=support@shareket.com
APP_URL=https://shareket.com
```

### Testing Checklist:
- [ ] Configure SMTP in .env
- [ ] Test order creation email
- [ ] Test payment confirmation email
- [ ] Test order status change email
- [ ] Test signup email
- [ ] Test refund approval email
- [ ] Test renewal reminder email
- [ ] Verify emails appear in inbox
- [ ] Check HTML formatting looks good
- [ ] Test with different email providers (Gmail, Outlook, etc.)

---

## Next Steps

1. Start with the most critical emails first:
   - Order creation
   - Payment received
   - Order completed
2. Test thoroughly with real SMTP
3. Add remaining emails gradually
4. Set up renewal reminder job
5. Monitor email deliverability
