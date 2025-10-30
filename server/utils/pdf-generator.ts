/**
 * PDF Generation Utility
 * Generates PDFs from transfer forms with embedded data and attachments
 */

import { TransferFormData } from "../../client/lib/transfer-form";

interface PDFOptions {
  includeAttachments?: boolean;
  includeComments?: boolean;
  includeAdminNotes?: boolean;
  compact?: boolean;
}

/**
 * Generate HTML representation of a transfer form for PDF export
 */
export function generateFormHTML(
  form: TransferFormData,
  options: PDFOptions = {}
): string {
  const {
    includeAttachments = true,
    includeComments = true,
    includeAdminNotes = true,
    compact = false,
  } = options;

  const getStatusBadgeColor = (status: string): string => {
    const colors: Record<string, string> = {
      "under-review": "#3B82F6",
      "amend-required": "#F59E0B",
      "confirm-application": "#A855F7",
      "transferring": "#F97316",
      "complete-transfer": "#22C55E",
      "canceled": "#EF4444",
    };
    return colors[status] || "#6B7280";
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount?: number): string => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: form.currency || "USD",
    }).format(amount);
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Transfer Form - ${form.formId}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          line-height: 1.5;
          color: #1F2937;
          background: white;
          padding: 40px;
        }

        .container {
          max-width: 900px;
          margin: 0 auto;
        }

        header {
          border-bottom: 3px solid #2563EB;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }

        h1 {
          font-size: 28px;
          font-weight: bold;
          color: #1F2937;
          margin-bottom: 5px;
        }

        .form-id {
          font-size: 12px;
          color: #6B7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          color: white;
          margin-top: 10px;
          background-color: ${getStatusBadgeColor(form.status)};
        }

        section {
          margin-bottom: 40px;
          page-break-inside: avoid;
        }

        h2 {
          font-size: 18px;
          font-weight: 600;
          color: #1F2937;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 1px solid #E5E7EB;
        }

        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .grid.full {
          grid-template-columns: 1fr;
        }

        .field {
          margin-bottom: 15px;
        }

        .field-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #6B7280;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .field-value {
          font-size: 14px;
          color: #1F2937;
          word-break: break-word;
        }

        .table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          font-size: 13px;
        }

        .table th {
          background-color: #F3F4F6;
          padding: 10px 12px;
          text-align: left;
          font-weight: 600;
          color: #1F2937;
          border-bottom: 2px solid #E5E7EB;
        }

        .table td {
          padding: 10px 12px;
          border-bottom: 1px solid #E5E7EB;
        }

        .table tr:last-child td {
          border-bottom: none;
        }

        .section-info {
          background-color: #F9FAFB;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 15px;
        }

        .comment {
          background-color: #F3F4F6;
          padding: 12px;
          border-left: 3px solid #2563EB;
          margin-bottom: 10px;
          border-radius: 4px;
        }

        .comment-header {
          font-weight: 600;
          font-size: 12px;
          margin-bottom: 4px;
          color: #1F2937;
        }

        .comment-text {
          font-size: 13px;
          color: #374151;
        }

        .comment-date {
          font-size: 11px;
          color: #9CA3AF;
          margin-top: 4px;
        }

        .attachment-list {
          list-style: none;
        }

        .attachment-item {
          padding: 10px;
          background-color: #F3F4F6;
          border-radius: 4px;
          margin-bottom: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .attachment-name {
          font-weight: 500;
          color: #1F2937;
          font-size: 13px;
        }

        .attachment-size {
          font-size: 11px;
          color: #6B7280;
        }

        .notes-box {
          background-color: #FEF3C7;
          border: 1px solid #FCD34D;
          padding: 15px;
          border-radius: 6px;
          margin-top: 10px;
        }

        .notes-label {
          font-weight: 600;
          color: #92400E;
          margin-bottom: 8px;
          font-size: 12px;
        }

        .notes-text {
          color: #78350F;
          font-size: 13px;
        }

        .page-break {
          page-break-after: always;
          margin-bottom: 40px;
        }

        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #E5E7EB;
          font-size: 11px;
          color: #6B7280;
          text-align: center;
        }

        @media print {
          body {
            padding: 0;
          }
          section {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <header>
          <div class="form-id">Transfer Form</div>
          <h1>${form.companyName}</h1>
          <div class="status-badge">${form.status.replace(/-/g, " ").toUpperCase()}</div>
        </header>

        ${!compact ? `
        <!-- Form Overview -->
        <section>
          <h2>Form Details</h2>
          <div class="grid">
            <div class="field">
              <div class="field-label">Form ID</div>
              <div class="field-value">${form.formId}</div>
            </div>
            <div class="field">
              <div class="field-label">Company Number</div>
              <div class="field-value">${form.companyNumber}</div>
            </div>
            <div class="field">
              <div class="field-label">Created Date</div>
              <div class="field-value">${formatDate(form.createdAt)}</div>
            </div>
            <div class="field">
              <div class="field-label">Last Updated</div>
              <div class="field-value">${formatDate(form.updatedAt)}</div>
            </div>
            ${form.transferDate ? `
            <div class="field">
              <div class="field-label">Transfer Date</div>
              <div class="field-value">${formatDate(form.transferDate)}</div>
            </div>
            ` : ''}
            ${form.salePrice ? `
            <div class="field">
              <div class="field-label">Sale Price</div>
              <div class="field-value">${formatCurrency(form.salePrice)}</div>
            </div>
            ` : ''}
          </div>
        </section>
        ` : ''}

        <!-- Seller Information -->
        <section>
          <h2>Seller Information</h2>
          <div class="grid">
            <div class="field">
              <div class="field-label">Name</div>
              <div class="field-value">${form.sellerName || 'N/A'}</div>
            </div>
            <div class="field">
              <div class="field-label">Email</div>
              <div class="field-value">${form.sellerEmail || 'N/A'}</div>
            </div>
            <div class="field">
              <div class="field-label">Phone</div>
              <div class="field-value">${form.sellerPhone || 'N/A'}</div>
            </div>
            <div class="field">
              <div class="field-label">Country</div>
              <div class="field-value">${form.sellerCountry || 'N/A'}</div>
            </div>
            <div class="field grid full">
              <div class="field-label">Address</div>
              <div class="field-value">${form.sellerAddress || 'N/A'}</div>
            </div>
            <div class="field grid full">
              <div class="field-label">City, State, Postal Code</div>
              <div class="field-value">${[form.sellerCity, form.sellerState, form.sellerPostalCode].filter(Boolean).join(', ') || 'N/A'}</div>
            </div>
          </div>
        </section>

        <!-- Buyer Information -->
        <section>
          <h2>Buyer Information</h2>
          <div class="grid">
            <div class="field">
              <div class="field-label">Name</div>
              <div class="field-value">${form.buyerName || 'N/A'}</div>
            </div>
            <div class="field">
              <div class="field-label">Email</div>
              <div class="field-value">${form.buyerEmail || 'N/A'}</div>
            </div>
            <div class="field">
              <div class="field-label">Phone</div>
              <div class="field-value">${form.buyerPhone || 'N/A'}</div>
            </div>
            <div class="field">
              <div class="field-label">Country</div>
              <div class="field-value">${form.buyerCountry || 'N/A'}</div>
            </div>
            <div class="field grid full">
              <div class="field-label">Address</div>
              <div class="field-value">${form.buyerAddress || 'N/A'}</div>
            </div>
            <div class="field grid full">
              <div class="field-label">City, State, Postal Code</div>
              <div class="field-value">${[form.buyerCity, form.buyerState, form.buyerPostalCode].filter(Boolean).join(', ') || 'N/A'}</div>
            </div>
          </div>
        </section>

        ${form.directors.length > 0 ? `
        <!-- Directors Information -->
        <section>
          <h2>Directors</h2>
          <table class="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Nationality</th>
                <th>Appointment Date</th>
              </tr>
            </thead>
            <tbody>
              ${form.directors.map(director => `
                <tr>
                  <td>${director.name}</td>
                  <td>${director.nationality || 'N/A'}</td>
                  <td>${director.appointmentDate ? formatDate(director.appointmentDate) : 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </section>
        ` : ''}

        ${form.shareholders.length > 0 ? `
        <!-- Shareholders Information -->
        <section>
          <h2>Shareholders</h2>
          <table class="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Ownership %</th>
              </tr>
            </thead>
            <tbody>
              ${form.shareholders.map(shareholder => `
                <tr>
                  <td>${shareholder.name}</td>
                  <td>${shareholder.shareholderType}</td>
                  <td>${shareholder.sharesPercentage}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </section>
        ` : ''}

        ${includeAttachments && form.attachments.length > 0 ? `
        <!-- Attachments -->
        <section>
          <h2>Attachments (${form.attachments.length})</h2>
          <ul class="attachment-list">
            ${form.attachments.map(attachment => `
              <li class="attachment-item">
                <div>
                  <div class="attachment-name">${attachment.name}</div>
                  <div class="attachment-size">${(attachment.size / 1024 / 1024).toFixed(2)} MB • Uploaded ${formatDate(attachment.uploadedDate)}</div>
                </div>
              </li>
            `).join('')}
          </ul>
        </section>
        ` : ''}

        ${includeComments && form.comments.length > 0 ? `
        <!-- Comments -->
        <section class="page-break">
          <h2>Comments & Notes (${form.comments.length})</h2>
          ${form.comments.map(comment => `
            <div class="comment">
              <div class="comment-header">${comment.author}${comment.isAdminOnly ? ' (Admin Only)' : ''}</div>
              <div class="comment-text">${comment.text}</div>
              <div class="comment-date">${formatDate(comment.createdAt)}</div>
            </div>
          `).join('')}
        </section>
        ` : ''}

        ${includeAdminNotes && form.adminNotes ? `
        <!-- Admin Notes -->
        <section>
          <div class="notes-box">
            <div class="notes-label">ADMIN NOTES</div>
            <div class="notes-text">${form.adminNotes}</div>
          </div>
        </section>
        ` : ''}

        <!-- Footer -->
        <div class="footer">
          <p>Transfer Form ID: ${form.formId} | Generated: ${formatDate(new Date().toISOString())}</p>
          <p>This document contains confidential information</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Convert HTML to PDF (requires server-side rendering)
 * This function returns HTML that can be converted to PDF using:
 * - Puppeteer
 * - wkhtmltopdf
 * - node-html-pdf
 * - or similar tools
 */
export function getFormPDFHTML(
  form: TransferFormData,
  options?: PDFOptions
): string {
  return generateFormHTML(form, options);
}

/**
 * Create a summary statistics block for the PDF
 */
export function generateFormSummary(form: TransferFormData): string {
  const stats = {
    status: form.status,
    createdDate: new Date(form.createdAt).toLocaleDateString(),
    attachments: form.attachments.length,
    comments: form.comments.length,
    amendmentsRequired: form.amendmentsRequiredCount,
  };

  return JSON.stringify(stats, null, 2);
}
