import { RequestHandler } from "express";
import {
  Invoice,
  InvoiceStatus,
  InvoiceFilter,
  InvoiceLineItem,
} from "../../client/lib/invoices";

const AIRTABLE_API_TOKEN = process.env.AIRTABLE_API_TOKEN;
const AIRTABLE_BASE_ID = "app0PK34gyJDizR3Q";
const AIRTABLE_INVOICES_TABLE = "Invoices";
const AIRTABLE_API_URL = "https://api.airtable.com/v0";

// In-memory invoice storage (replace with database in production)
let invoices: Invoice[] = [];

// Helper to generate invoice ID
function generateInvoiceId(): string {
  return `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Helper to get Airtable headers
function getAirtableHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${AIRTABLE_API_TOKEN}`,
  };
}

// Get all invoices
export const getInvoices: RequestHandler = async (req, res) => {
  try {
    const {
      status,
      paymentMethod,
      dateFrom,
      dateTo,
      clientName,
      companyName,
      invoiceNumber,
    } = req.query;

    let result = invoices;

    if (status) {
      result = result.filter((inv) => inv.status === status);
    }
    if (paymentMethod) {
      result = result.filter((inv) => inv.paymentMethod === paymentMethod);
    }
    if (clientName) {
      const query = (clientName as string).toLowerCase();
      result = result.filter((inv) =>
        inv.clientName.toLowerCase().includes(query)
      );
    }
    if (companyName) {
      const query = (companyName as string).toLowerCase();
      result = result.filter((inv) =>
        inv.companyName.toLowerCase().includes(query)
      );
    }
    if (invoiceNumber) {
      const query = (invoiceNumber as string).toLowerCase();
      result = result.filter((inv) =>
        inv.invoiceNumber.toLowerCase().includes(query)
      );
    }
    if (dateFrom) {
      result = result.filter(
        (inv) => new Date(inv.invoiceDate) >= new Date(dateFrom as string)
      );
    }
    if (dateTo) {
      result = result.filter(
        (inv) => new Date(inv.invoiceDate) <= new Date(dateTo as string)
      );
    }

    return res.json(result);
  } catch (error) {
    console.error("Error getting invoices:", error);
    return res.status(500).json({ error: "Failed to fetch invoices" });
  }
};

// Get single invoice
export const getInvoice: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = invoices.find((inv) => inv.id === id);

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    return res.json(invoice);
  } catch (error) {
    console.error("Error getting invoice:", error);
    return res.status(500).json({ error: "Failed to fetch invoice" });
  }
};

// Create invoice
export const createInvoice: RequestHandler = async (req, res) => {
  try {
    const invoiceData = req.body;

    const newInvoice: Invoice = {
      id: generateInvoiceId(),
      ...invoiceData,
      createdDate: new Date().toISOString(),
      lastUpdateDate: new Date().toISOString(),
      statusHistory: [
        {
          id: `status-${Date.now()}`,
          fromStatus: invoiceData.status || "pending",
          toStatus: invoiceData.status || "pending",
          changedDate: new Date().toISOString(),
          changedBy: "system",
        },
      ],
    };

    invoices.push(newInvoice);

    // Sync to Airtable if configured
    if (AIRTABLE_API_TOKEN) {
      await syncInvoiceToAirtable(newInvoice);
    }

    return res.json(newInvoice);
  } catch (error) {
    console.error("Error creating invoice:", error);
    return res.status(500).json({ error: "Failed to create invoice" });
  }
};

// Update invoice
export const updateInvoice: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const invoiceIndex = invoices.findIndex((inv) => inv.id === id);
    if (invoiceIndex === -1) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const updated = {
      ...invoices[invoiceIndex],
      ...updates,
      lastUpdateDate: new Date().toISOString(),
    };

    invoices[invoiceIndex] = updated;

    // Sync to Airtable if configured
    if (AIRTABLE_API_TOKEN) {
      await syncInvoiceToAirtable(updated);
    }

    return res.json(updated);
  } catch (error) {
    console.error("Error updating invoice:", error);
    return res.status(500).json({ error: "Failed to update invoice" });
  }
};

// Update invoice status
export const updateInvoiceStatus: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const invoice = invoices.find((inv) => inv.id === id);
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const oldStatus = invoice.status;
    const updated: Invoice = {
      ...invoice,
      status,
      statusHistory: [
        ...invoice.statusHistory,
        {
          id: `status-${Date.now()}`,
          fromStatus: oldStatus,
          toStatus: status,
          changedDate: new Date().toISOString(),
          changedBy: "admin",
          reason,
        },
      ],
      lastUpdateDate: new Date().toISOString(),
    };

    const invoiceIndex = invoices.findIndex((inv) => inv.id === id);
    invoices[invoiceIndex] = updated;

    // Send email notification
    if (status === "paid") {
      await sendInvoiceEmail(updated, "paid");
    }

    // Sync to Airtable if configured
    if (AIRTABLE_API_TOKEN) {
      await syncInvoiceStatusToAirtable(updated);
    }

    return res.json(updated);
  } catch (error) {
    console.error("Error updating invoice status:", error);
    return res.status(500).json({ error: "Failed to update invoice status" });
  }
};

// Delete invoice
export const deleteInvoice: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    invoices = invoices.filter((inv) => inv.id !== id);
    return res.json({ success: true });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return res.status(500).json({ error: "Failed to delete invoice" });
  }
};

// Upload attachment
export const uploadAttachment: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = invoices.find((inv) => inv.id === id);

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const attachment = {
      id: `attach-${Date.now()}`,
      name: req.body.name || "document",
      type: req.body.type || "application/octet-stream",
      size: req.body.size || 0,
      uploadedDate: new Date().toISOString(),
      url: req.body.url,
    };

    invoice.attachments.push(attachment);
    return res.json(attachment);
  } catch (error) {
    console.error("Error uploading attachment:", error);
    return res.status(500).json({ error: "Failed to upload attachment" });
  }
};

// Delete attachment
export const deleteAttachment: RequestHandler = async (req, res) => {
  try {
    const { id, attachmentId } = req.params;
    const invoice = invoices.find((inv) => inv.id === id);

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    invoice.attachments = invoice.attachments.filter(
      (att) => att.id !== attachmentId
    );
    return res.json({ success: true });
  } catch (error) {
    console.error("Error deleting attachment:", error);
    return res.status(500).json({ error: "Failed to delete attachment" });
  }
};

// Send invoice email
export const sendInvoiceEmail: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = invoices.find((inv) => inv.id === id);

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const success = await sendInvoiceEmailNotification(invoice);
    if (success) {
      invoice.lastSentDate = new Date().toISOString();
      invoice.sentCount = (invoice.sentCount || 0) + 1;
    }

    return res.json({ success });
  } catch (error) {
    console.error("Error sending email:", error);
    return res.status(500).json({ error: "Failed to send email" });
  }
};

// Generate PDF
export const generatePDF: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = invoices.find((inv) => inv.id === id);

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const htmlContent = generateInvoiceHTML(invoice);
    return res.json({ html: htmlContent });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return res.status(500).json({ error: "Failed to generate PDF" });
  }
};

// Bulk update status
export const bulkUpdateStatus: RequestHandler = async (req, res) => {
  try {
    const { invoiceIds, status } = req.body;

    const updated: Invoice[] = [];
    for (const id of invoiceIds) {
      const invoice = invoices.find((inv) => inv.id === id);
      if (invoice) {
        invoice.status = status;
        invoice.statusHistory.push({
          id: `status-${Date.now()}`,
          fromStatus: invoice.status,
          toStatus: status,
          changedDate: new Date().toISOString(),
          changedBy: "admin",
        });
        invoice.lastUpdateDate = new Date().toISOString();
        updated.push(invoice);
      }
    }

    return res.json({ updated: updated.length });
  } catch (error) {
    console.error("Error bulk updating:", error);
    return res.status(500).json({ error: "Failed to bulk update" });
  }
};

// Bulk send emails
export const bulkSendEmails: RequestHandler = async (req, res) => {
  try {
    const { invoiceIds } = req.body;

    let sent = 0;
    for (const id of invoiceIds) {
      const invoice = invoices.find((inv) => inv.id === id);
      if (invoice) {
        const success = await sendInvoiceEmailNotification(invoice);
        if (success) {
          invoice.lastSentDate = new Date().toISOString();
          invoice.sentCount = (invoice.sentCount || 0) + 1;
          sent++;
        }
      }
    }

    return res.json({ sent });
  } catch (error) {
    console.error("Error sending bulk emails:", error);
    return res.status(500).json({ error: "Failed to send emails" });
  }
};

// Export CSV
export const exportCSV: RequestHandler = async (req, res) => {
  try {
    const csv = generateInvoiceCSV(invoices);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="invoices-${new Date().toISOString().split("T")[0]}.csv"`
    );
    return res.send(csv);
  } catch (error) {
    console.error("Error exporting CSV:", error);
    return res.status(500).json({ error: "Failed to export CSV" });
  }
};

// Analytics summary
export const getAnalyticsSummary: RequestHandler = async (req, res) => {
  try {
    const stats = {
      totalInvoices: invoices.length,
      totalAmount: invoices.reduce((sum, inv) => sum + inv.amount, 0),
      paidAmount: invoices
        .filter((inv) => inv.status === "paid")
        .reduce((sum, inv) => sum + inv.amount, 0),
      pendingAmount: invoices
        .filter((inv) => inv.status === "pending")
        .reduce((sum, inv) => sum + inv.amount, 0),
      overdueAmount: invoices
        .filter((inv) => inv.status === "overdue")
        .reduce((sum, inv) => sum + inv.amount, 0),
      byStatus: {
        pending: invoices.filter((inv) => inv.status === "pending").length,
        paid: invoices.filter((inv) => inv.status === "paid").length,
        overdue: invoices.filter((inv) => inv.status === "overdue").length,
        partial: invoices.filter((inv) => inv.status === "partial").length,
        refunded: invoices.filter((inv) => inv.status === "refunded").length,
      },
      byPaymentMethod: {
        stripe: invoices.filter((inv) => inv.paymentMethod === "stripe").length,
        wise: invoices.filter((inv) => inv.paymentMethod === "wise").length,
        manual: invoices.filter((inv) => inv.paymentMethod === "manual").length,
        bank_transfer: invoices.filter(
          (inv) => inv.paymentMethod === "bank_transfer"
        ).length,
        paypal: invoices.filter((inv) => inv.paymentMethod === "paypal").length,
      },
    };

    return res.json(stats);
  } catch (error) {
    console.error("Error getting analytics:", error);
    return res.status(500).json({ error: "Failed to get analytics" });
  }
};

// Helper functions

async function syncInvoiceToAirtable(invoice: Invoice): Promise<boolean> {
  try {
    if (!AIRTABLE_API_TOKEN) return false;

    const response = await fetch(
      `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${AIRTABLE_INVOICES_TABLE}`,
      {
        method: "POST",
        headers: getAirtableHeaders(),
        body: JSON.stringify({
          fields: {
            "Invoice Number": invoice.invoiceNumber,
            "Client Name": invoice.clientName,
            "Client Email": invoice.clientEmail,
            "Company Name": invoice.companyName,
            "Company Number": invoice.companyNumber,
            "Order ID": invoice.orderId,
            "Invoice Date": invoice.invoiceDate,
            "Due Date": invoice.dueDate,
            Amount: invoice.amount,
            Status: invoice.status,
            "Payment Method": invoice.paymentMethod,
            "Admin Notes": invoice.adminNotes,
            Description: invoice.description,
          },
        }),
      }
    );

    return response.ok;
  } catch (error) {
    console.error("Error syncing to Airtable:", error);
    return false;
  }
}

async function syncInvoiceStatusToAirtable(invoice: Invoice): Promise<boolean> {
  try {
    if (!AIRTABLE_API_TOKEN) return false;

    const response = await fetch(
      `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${AIRTABLE_INVOICES_TABLE}`,
      {
        method: "PATCH",
        headers: getAirtableHeaders(),
        body: JSON.stringify({
          fields: {
            Status: invoice.status,
            "Paid Date": invoice.paidDate,
            "Paid Amount": invoice.paidAmount,
          },
        }),
      }
    );

    return response.ok;
  } catch (error) {
    console.error("Error syncing status to Airtable:", error);
    return false;
  }
}

async function sendInvoiceEmailNotification(
  invoice: Invoice
): Promise<boolean> {
  try {
    const emailContent = generateInvoiceEmailHTML(invoice);

    const emailBody = {
      to: invoice.clientEmail,
      subject: `Invoice ${invoice.invoiceNumber}`,
      html: emailContent,
      attachmentUrl: `/api/invoices/${invoice.id}/pdf`,
    };

    const response = await fetch("/api/notifications/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(emailBody),
    });

    return response.ok;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

function generateInvoiceHTML(invoice: Invoice): string {
  const subtotal = invoice.lineItems.reduce((sum, item) => sum + item.total, 0);
  const taxes = invoice.taxAmount || 0;
  const total = subtotal + taxes + (invoice.customFee || 0) - (invoice.discountAmount || 0);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .invoice { max-width: 900px; margin: 0 auto; padding: 40px; }
        .header { border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { margin: 0; color: #2563eb; }
        .details { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
        .section { margin-bottom: 30px; }
        .section h3 { border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background-color: #f3f4f6; padding: 10px; text-align: left; }
        td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
        .total { font-weight: bold; font-size: 18px; }
        .status { padding: 10px; background-color: #dcfce7; border-radius: 4px; display: inline-block; }
      </style>
    </head>
    <body>
      <div class="invoice">
        <div class="header">
          <h1>INVOICE</h1>
          <p>${invoice.invoiceNumber}</p>
        </div>

        <div class="details">
          <div>
            <h4>Invoice Details</h4>
            <p><strong>Invoice Date:</strong> ${invoice.invoiceDate}</p>
            <p><strong>Due Date:</strong> ${invoice.dueDate}</p>
            <p><strong>Status:</strong> <span class="status">${invoice.status.toUpperCase()}</span></p>
          </div>
          <div>
            <h4>Company Information</h4>
            <p><strong>${invoice.companyName}</strong></p>
            <p>Company Number: ${invoice.companyNumber}</p>
          </div>
        </div>

        <div class="section">
          <h3>Bill To</h3>
          <p><strong>${invoice.clientName}</strong></p>
          <p>${invoice.clientEmail}</p>
          ${invoice.clientPhone ? `<p>${invoice.clientPhone}</p>` : ""}
          ${invoice.billingAddress ? `<p>${invoice.billingAddress}</p>` : ""}
        </div>

        <div class="section">
          <h3>Items</h3>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.lineItems
                .map(
                  (item) =>
                    `<tr>
                <td>${item.description}</td>
                <td>${item.quantity}</td>
                <td>£${item.unitPrice.toFixed(2)}</td>
                <td>£${item.total.toFixed(2)}</td>
              </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>

        <div class="section" style="text-align: right;">
          <p><strong>Subtotal:</strong> £${subtotal.toFixed(2)}</p>
          ${taxes > 0 ? `<p><strong>Taxes:</strong> £${taxes.toFixed(2)}</p>` : ""}
          ${invoice.discountAmount ? `<p><strong>Discount:</strong> -£${invoice.discountAmount.toFixed(2)}</p>` : ""}
          ${invoice.customFee ? `<p><strong>Fee:</strong> £${invoice.customFee.toFixed(2)}</p>` : ""}
          <p class="total"><strong>Total: £${total.toFixed(2)}</strong></p>
        </div>

        ${invoice.adminNotes ? `<div class="section"><p><strong>Notes:</strong> ${invoice.adminNotes}</p></div>` : ""}
      </div>
    </body>
    </html>
  `;
}

function generateInvoiceEmailHTML(invoice: Invoice): string {
  return `
    <html>
    <body style="font-family: Arial, sans-serif; color: #333;">
      <div style="max-width: 600px; margin: 0 auto;">
        <h2>Invoice ${invoice.invoiceNumber}</h2>
        <p>Dear ${invoice.clientName},</p>
        <p>Please find attached your invoice for £${invoice.amount.toFixed(2)}.</p>
        <p><strong>Invoice Details:</strong></p>
        <ul>
          <li>Invoice Date: ${invoice.invoiceDate}</li>
          <li>Due Date: ${invoice.dueDate}</li>
          <li>Company: ${invoice.companyName}</li>
        </ul>
        <p>Thank you for your business.</p>
      </div>
    </body>
    </html>
  `;
}

function generateInvoiceCSV(invoiceList: Invoice[]): string {
  const headers = [
    "Invoice Number",
    "Client Name",
    "Client Email",
    "Company Name",
    "Company Number",
    "Invoice Date",
    "Due Date",
    "Amount",
    "Status",
    "Payment Method",
  ];

  const rows = invoiceList.map((inv) => [
    inv.invoiceNumber,
    inv.clientName,
    inv.clientEmail,
    inv.companyName,
    inv.companyNumber,
    inv.invoiceDate,
    inv.dueDate,
    inv.amount.toString(),
    inv.status,
    inv.paymentMethod || "N/A",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  return csvContent;
}
