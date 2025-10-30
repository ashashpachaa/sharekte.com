import { Order } from "./orders";

/**
 * Export orders to CSV format (Excel compatible)
 */
export function exportOrdersToCSV(orders: Order[], filename = "orders.csv"): void {
  const headers = [
    "Order ID",
    "Customer Name",
    "Customer Email",
    "Company Name",
    "Company Number",
    "Amount",
    "Currency",
    "Status",
    "Payment Status",
    "Purchase Date",
    "Country",
    "Payment Method",
    "Refund Status",
  ];

  const rows = orders.map((order) => [
    order.orderId,
    order.customerName,
    order.customerEmail,
    order.companyName,
    order.companyNumber,
    order.amount,
    order.currency,
    order.status,
    order.paymentStatus,
    new Date(order.purchaseDate).toLocaleDateString(),
    order.country,
    order.paymentMethod,
    order.refundStatus,
  ]);

  const csvContent = [
    headers.map((h) => `"${h}"`).join(","),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  downloadFile(csvContent, filename, "text/csv");
}

/**
 * Export orders to JSON format
 */
export function exportOrdersToJSON(orders: Order[], filename = "orders.json"): void {
  const jsonContent = JSON.stringify(orders, null, 2);
  downloadFile(jsonContent, filename, "application/json");
}

/**
 * Export single order to PDF
 */
export async function exportOrderToPDF(order: Order): Promise<void> {
  const pdfContent = generateOrderPDF(order);

  // In a real implementation, you'd use a library like jsPDF or pdfkit
  // For now, we'll create a printable HTML version
  const printWindow = window.open("", "", "width=800,height=600");
  if (printWindow) {
    printWindow.document.write(pdfContent);
    printWindow.document.close();
    printWindow.print();
  }
}

/**
 * Generate PDF content as HTML (for printing)
 */
function generateOrderPDF(order: Order): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Order ${order.orderId}</title>
      <style>
        * { margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
        .header { border-bottom: 3px solid #2563EB; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #2563EB; font-size: 28px; margin-bottom: 5px; }
        .header p { color: #666; font-size: 14px; }
        .section { margin-bottom: 30px; page-break-inside: avoid; }
        .section h2 { color: #2563EB; font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 15px; }
        .row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px; }
        .row.full { grid-template-columns: 1fr; }
        .field { }
        .field label { font-weight: bold; color: #666; font-size: 12px; display: block; margin-bottom: 5px; }
        .field value { color: #333; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        table thead { background: #f3f4f6; }
        table th { padding: 10px; text-align: left; font-weight: bold; border-bottom: 2px solid #e5e7eb; }
        table td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        .badge.success { background: #d1fae5; color: #065f46; }
        .badge.warning { background: #fef3c7; color: #92400e; }
        .badge.danger { background: #fee2e2; color: #991b1b; }
        .badge.primary { background: #dbeafe; color: #1e40af; }
        .footer { border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 40px; color: #666; font-size: 12px; }
        .amount { font-size: 24px; font-weight: bold; color: #2563EB; }
        @media print {
          body { padding: 0; }
          .container { padding: 0; }
          .no-print { display: none; }
          .section { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <h1>Order #${order.orderId}</h1>
          <p>Issued on ${new Date(order.purchaseDate).toLocaleDateString()}</p>
        </div>

        <!-- Customer Info -->
        <div class="section">
          <h2>Customer Information</h2>
          <div class="row">
            <div class="field">
              <label>Name</label>
              <value>${escapeHtml(order.customerName)}</value>
            </div>
            <div class="field">
              <label>Email</label>
              <value>${escapeHtml(order.customerEmail)}</value>
            </div>
          </div>
          <div class="row">
            <div class="field">
              <label>Phone</label>
              <value>${order.customerPhone || "—"}</value>
            </div>
            <div class="field">
              <label>Country</label>
              <value>${order.country}</value>
            </div>
          </div>
        </div>

        <!-- Company Info -->
        <div class="section">
          <h2>Company Details</h2>
          <div class="row">
            <div class="field">
              <label>Company Name</label>
              <value>${escapeHtml(order.companyName)}</value>
            </div>
            <div class="field">
              <label>Company Number</label>
              <value>${order.companyNumber}</value>
            </div>
          </div>
        </div>

        <!-- Order Details -->
        <div class="section">
          <h2>Order Details</h2>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${escapeHtml(order.companyName)}</td>
                <td style="text-align: right;">${order.currency} ${order.amount.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Payment Info -->
        <div class="section">
          <h2>Payment Information</h2>
          <div class="row">
            <div class="field">
              <label>Payment Method</label>
              <value>${order.paymentMethod.replace(/_/g, " ")}</value>
            </div>
            <div class="field">
              <label>Payment Status</label>
              <value><span class="badge ${getStatusClass(order.paymentStatus)}">${order.paymentStatus}</span></value>
            </div>
          </div>
          <div class="row">
            <div class="field">
              <label>Transaction ID</label>
              <value>${order.transactionId || "—"}</value>
            </div>
            <div class="field">
              <label>Currency</label>
              <value>${order.currency}</value>
            </div>
          </div>
        </div>

        <!-- Order Status -->
        <div class="section">
          <h2>Order Status</h2>
          <div class="row">
            <div class="field">
              <label>Current Status</label>
              <value><span class="badge ${getStatusClass(order.status)}">${order.status.replace(/-/g, " ")}</span></value>
            </div>
            <div class="field">
              <label>Last Updated</label>
              <value>${new Date(order.lastUpdateDate).toLocaleDateString()}</value>
            </div>
          </div>
        </div>

        <!-- Renewal Info -->
        ${order.renewalFees ? `
        <div class="section">
          <h2>Renewal Information</h2>
          <div class="row">
            <div class="field">
              <label>Renewal Date</label>
              <value>${new Date(order.renewalDate).toLocaleDateString()}</value>
            </div>
            <div class="field">
              <label>Renewal Fees</label>
              <value class="amount">${order.currency} ${order.renewalFees.toLocaleString()}</value>
            </div>
          </div>
        </div>
        ` : ""}

        <!-- Footer -->
        <div class="footer">
          <p><strong>ShareKTE</strong></p>
          <p>This order confirmation is valid and binding. For any inquiries, please contact our support team at support@sharekte.com</p>
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Download file helper
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const element = document.createElement("a");
  element.setAttribute("href", `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`);
  element.setAttribute("download", filename);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

/**
 * Get CSS class for status badge
 */
function getStatusClass(status: string): string {
  const statusMap: Record<string, string> = {
    "completed": "success",
    "paid": "success",
    "pending": "warning",
    "under-review": "warning",
    "refunded": "primary",
    "cancelled": "danger",
    "rejected": "danger",
  };

  return statusMap[status] || "primary";
}

/**
 * Escape HTML to prevent injection
 */
function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Generate bulk export report
 */
export function generateOrdersReport(orders: Order[]): {
  totalOrders: number;
  totalRevenue: number;
  byStatus: Record<string, number>;
  byPaymentStatus: Record<string, number>;
  byCountry: Record<string, number>;
} {
  return {
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, o) => sum + o.amount, 0),
    byStatus: orders.reduce(
      (acc, o) => {
        acc[o.status] = (acc[o.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
    byPaymentStatus: orders.reduce(
      (acc, o) => {
        acc[o.paymentStatus] = (acc[o.paymentStatus] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
    byCountry: orders.reduce(
      (acc, o) => {
        acc[o.country] = (acc[o.country] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
  };
}
