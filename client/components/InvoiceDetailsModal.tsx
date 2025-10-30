import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Invoice,
  InvoiceStatus,
  INVOICE_STATUS_COLORS,
  INVOICE_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  formatInvoiceDate,
  formatInvoiceAmount,
  getInvoiceSummary,
  getInvoiceDisplayStatus,
} from "@/lib/invoices";
import {
  Download,
  Mail,
  Edit2,
  Trash2,
  FileText,
  Check,
  AlertCircle,
  Clock,
} from "lucide-react";

interface InvoiceDetailsModalProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
  onStatusChange?: (status: InvoiceStatus, reason?: string) => void;
  onSendEmail?: () => void;
  onDelete?: () => void;
  onDownloadPDF?: () => void;
  isLoading?: boolean;
}

export function InvoiceDetailsModal({
  invoice,
  open,
  onOpenChange,
  onEdit,
  onStatusChange,
  onSendEmail,
  onDelete,
  onDownloadPDF,
  isLoading = false,
}: InvoiceDetailsModalProps) {
  const [statusChangeReason, setStatusChangeReason] = useState("");
  const [newStatus, setNewStatus] = useState<InvoiceStatus | "">(
    invoice?.status || ""
  );

  if (!invoice) return null;

  const displayStatus = getInvoiceDisplayStatus(invoice);
  const summary = getInvoiceSummary(invoice);

  const availableStatusTransitions: InvoiceStatus[] = {
    pending: ["paid", "partial", "refunded"],
    paid: ["partial", "refunded"],
    overdue: ["paid", "partial", "refunded"],
    partial: ["paid", "refunded"],
    refunded: [],
  }[invoice.status] || [];

  const handleStatusChange = () => {
    if (newStatus && onStatusChange) {
      onStatusChange(newStatus, statusChangeReason);
      setNewStatus("");
      setStatusChangeReason("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-start justify-between space-y-0 pb-4 border-b">
          <div>
            <DialogTitle className="text-2xl">
              Invoice {invoice.invoiceNumber}
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Created: {formatInvoiceDate(invoice.createdDate)}
            </p>
          </div>
          <Badge className={INVOICE_STATUS_COLORS[displayStatus]}>
            {INVOICE_STATUS_LABELS[displayStatus]}
          </Badge>
        </DialogHeader>

        <Tabs defaultValue="details" className="space-y-4">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6">
            {/* Invoice Summary */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                <h3 className="font-semibold text-foreground">Invoice Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invoice Date:</span>
                    <span>{formatInvoiceDate(invoice.invoiceDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Due Date:</span>
                    <span>{formatInvoiceDate(invoice.dueDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order ID:</span>
                    <span className="font-mono">{invoice.orderId || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Method:</span>
                    <span>
                      {PAYMENT_METHOD_LABELS[invoice.paymentMethod || "stripe"]}
                    </span>
                  </div>
                  {invoice.transactionId && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Transaction ID:</span>
                      <span className="font-mono text-xs">{invoice.transactionId}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-foreground">Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>{formatInvoiceAmount(summary.subtotal, invoice.currency)}</span>
                  </div>
                  {summary.taxes > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taxes:</span>
                      <span>{formatInvoiceAmount(summary.taxes, invoice.currency)}</span>
                    </div>
                  )}
                  {summary.discount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span className="text-muted-foreground">Discount:</span>
                      <span>-{formatInvoiceAmount(summary.discount, invoice.currency)}</span>
                    </div>
                  )}
                  {summary.fees > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fees:</span>
                      <span>{formatInvoiceAmount(summary.fees, invoice.currency)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                    <span>Total:</span>
                    <span>{formatInvoiceAmount(summary.total, invoice.currency)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Client Information */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                <h3 className="font-semibold text-foreground">Client Information</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Name</p>
                    <p className="font-medium">{invoice.clientName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Email</p>
                    <p className="font-medium">{invoice.clientEmail}</p>
                  </div>
                  {invoice.clientPhone && (
                    <div>
                      <p className="text-muted-foreground text-xs">Phone</p>
                      <p className="font-medium">{invoice.clientPhone}</p>
                    </div>
                  )}
                  {invoice.clientCountry && (
                    <div>
                      <p className="text-muted-foreground text-xs">Country</p>
                      <p className="font-medium">{invoice.clientCountry}</p>
                    </div>
                  )}
                  {invoice.billingAddress && (
                    <div>
                      <p className="text-muted-foreground text-xs">Address</p>
                      <p className="font-medium text-xs line-clamp-2">
                        {invoice.billingAddress}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                <h3 className="font-semibold text-foreground">Company Information</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Company Name</p>
                    <p className="font-medium">{invoice.companyName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Company Number</p>
                    <p className="font-mono">{invoice.companyNumber}</p>
                  </div>
                  {invoice.companyId && (
                    <div>
                      <p className="text-muted-foreground text-xs">Company ID</p>
                      <p className="font-mono text-xs">{invoice.companyId}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.adminNotes && (
              <div className="space-y-2 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm font-semibold text-amber-900">Admin Notes</p>
                <p className="text-sm text-amber-800 whitespace-pre-wrap">
                  {invoice.adminNotes}
                </p>
              </div>
            )}
          </TabsContent>

          {/* Items Tab */}
          <TabsContent value="items" className="space-y-4">
            {invoice.description && (
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="text-foreground">{invoice.description}</p>
              </div>
            )}

            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b">
                  <tr>
                    <th className="p-3 text-left font-semibold">Description</th>
                    <th className="p-3 text-center font-semibold">Qty</th>
                    <th className="p-3 text-right font-semibold">Unit Price</th>
                    <th className="p-3 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lineItems.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-muted/20">
                      <td className="p-3">{item.description}</td>
                      <td className="p-3 text-center">{item.quantity}</td>
                      <td className="p-3 text-right">
                        {formatInvoiceAmount(item.unitPrice, invoice.currency)}
                      </td>
                      <td className="p-3 text-right font-medium">
                        {formatInvoiceAmount(item.total, invoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Attachments */}
            {invoice.attachments.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Attachments</h3>
                <div className="space-y-2">
                  {invoice.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                    >
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{attachment.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(attachment.size / 1024).toFixed(2)} KB •{" "}
                          {formatInvoiceDate(attachment.uploadedDate)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            {invoice.statusHistory.length > 0 ? (
              <div className="space-y-3">
                {invoice.statusHistory.map((change) => (
                  <div key={change.id} className="flex gap-4 p-4 bg-muted/30 rounded-lg">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Check className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">
                        {INVOICE_STATUS_LABELS[change.fromStatus]} →{" "}
                        {INVOICE_STATUS_LABELS[change.toStatus]}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatInvoiceDate(change.changedDate)}
                      </p>
                      {change.reason && (
                        <p className="text-xs text-foreground mt-2 p-2 bg-muted rounded">
                          {change.reason}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No status history available
              </div>
            )}
          </TabsContent>

          {/* Actions Tab */}
          <TabsContent value="actions" className="space-y-4">
            {/* Status Change */}
            {availableStatusTransitions.length > 0 && (
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                <h3 className="font-semibold text-foreground">Change Status</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">New Status</label>
                    <Select
                      value={newStatus}
                      onValueChange={(value) =>
                        setNewStatus(value as InvoiceStatus)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select new status" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStatusTransitions.map((status) => (
                          <SelectItem key={status} value={status}>
                            {INVOICE_STATUS_LABELS[status]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {newStatus && (
                    <div>
                      <label className="text-sm font-medium">Reason</label>
                      <Textarea
                        value={statusChangeReason}
                        onChange={(e) => setStatusChangeReason(e.target.value)}
                        placeholder="Optional reason for status change"
                      />
                    </div>
                  )}

                  <Button
                    onClick={handleStatusChange}
                    disabled={!newStatus || isLoading}
                    className="w-full"
                  >
                    Update Status
                  </Button>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={onDownloadPDF}
                disabled={isLoading}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </Button>

              <Button
                variant="outline"
                onClick={onSendEmail}
                disabled={isLoading}
                className="gap-2"
              >
                <Mail className="w-4 h-4" />
                Send Email
              </Button>

              <Button
                variant="outline"
                onClick={onEdit}
                disabled={isLoading}
                className="gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </Button>

              <Button
                variant="destructive"
                onClick={onDelete}
                disabled={isLoading}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </div>

            {/* Payment Info */}
            {invoice.paidDate && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-green-900">Paid</p>
                    <p className="text-green-800">
                      {formatInvoiceAmount(invoice.paidAmount || invoice.amount, invoice.currency)} on{" "}
                      {formatInvoiceDate(invoice.paidDate)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Email Tracking */}
            {invoice.lastSentDate && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-blue-900">Email Sent</p>
                    <p className="text-blue-800">
                      Sent {invoice.sentCount || 1} time(s) • Last sent{" "}
                      {formatInvoiceDate(invoice.lastSentDate)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
