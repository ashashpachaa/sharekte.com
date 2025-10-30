import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X } from "lucide-react";
import {
  Invoice,
  InvoiceLineItem,
  PAYMENT_METHOD_LABELS,
  validateInvoice,
} from "@/lib/invoices";

interface InvoiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (invoice: Omit<Invoice, "id" | "createdDate" | "lastUpdateDate" | "statusHistory">) => void;
  initialData?: Invoice;
  isLoading?: boolean;
}

export function InvoiceForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading = false,
}: InvoiceFormProps) {
  const [formData, setFormData] = useState({
    invoiceNumber: initialData?.invoiceNumber || "",
    clientName: initialData?.clientName || "",
    clientEmail: initialData?.clientEmail || "",
    clientPhone: initialData?.clientPhone || "",
    billingAddress: initialData?.billingAddress || "",
    clientCountry: initialData?.clientCountry || "",
    companyId: initialData?.companyId || "",
    companyName: initialData?.companyName || "",
    companyNumber: initialData?.companyNumber || "",
    orderId: initialData?.orderId || "",
    invoiceDate: initialData?.invoiceDate || new Date().toISOString().split("T")[0],
    dueDate: initialData?.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    description: initialData?.description || "",
    currency: initialData?.currency || "GBP",
    paymentMethod: initialData?.paymentMethod || "stripe",
    taxRate: initialData?.taxRate || 0,
    discountAmount: initialData?.discountAmount || 0,
    customFee: initialData?.customFee || 0,
    customFeeDescription: initialData?.customFeeDescription || "",
    adminNotes: initialData?.adminNotes || "",
    lineItems: initialData?.lineItems || [{ id: "1", description: "", quantity: 1, unitPrice: 0, total: 0 }],
  });

  const [errors, setErrors] = useState<string[]>([]);

  const handleLineItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.lineItems];
    const item = newItems[index];

    if (field === "quantity" || field === "unitPrice") {
      const updated = { ...item, [field]: parseFloat(value) || 0 };
      updated.total = updated.quantity * updated.unitPrice;
      newItems[index] = updated;
    } else {
      newItems[index] = { ...item, [field]: value };
    }

    setFormData({ ...formData, lineItems: newItems });
  };

  const addLineItem = () => {
    const newItem: InvoiceLineItem = {
      id: `item-${Date.now()}`,
      description: "",
      quantity: 1,
      unitPrice: 0,
      total: 0,
    };
    setFormData({
      ...formData,
      lineItems: [...formData.lineItems, newItem],
    });
  };

  const removeLineItem = (index: number) => {
    setFormData({
      ...formData,
      lineItems: formData.lineItems.filter((_, i) => i !== index),
    });
  };

  const calculateTotal = () => {
    const subtotal = formData.lineItems.reduce((sum, item) => sum + item.total, 0);
    const taxes = subtotal * ((formData.taxRate || 0) / 100);
    const total = subtotal + taxes + (formData.customFee || 0) - (formData.discountAmount || 0);
    return { subtotal, taxes, total };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const invoiceData: Omit<Invoice, "id" | "createdDate" | "lastUpdateDate" | "statusHistory"> = {
      ...formData,
      amount: calculateTotal().total,
      lineItems: formData.lineItems.map(item => ({
        ...item,
        quantity: parseFloat(item.quantity as any) || 0,
        unitPrice: parseFloat(item.unitPrice as any) || 0,
      })),
      status: initialData?.status || "pending",
      attachments: initialData?.attachments || [],
      taxRate: formData.taxRate || 0,
      discountAmount: formData.discountAmount || 0,
      customFee: formData.customFee || 0,
    };

    const validation = validateInvoice(invoiceData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    onSubmit(invoiceData);
    onOpenChange(false);
  };

  const { subtotal, taxes, total } = calculateTotal();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Invoice" : "Create New Invoice"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-red-800 mb-2">Errors:</p>
              <ul className="space-y-1">
                {errors.map((error, i) => (
                  <li key={i} className="text-sm text-red-700">
                    • {error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Invoice Header */}
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Invoice Number *</Label>
                <Input
                  value={formData.invoiceNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, invoiceNumber: e.target.value })
                  }
                  placeholder="INV-2024-001"
                />
              </div>
              <div>
                <Label>Order ID</Label>
                <Input
                  value={formData.orderId}
                  onChange={(e) =>
                    setFormData({ ...formData, orderId: e.target.value })
                  }
                  placeholder="ORD-123456"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Invoice Date *</Label>
                <Input
                  type="date"
                  value={formData.invoiceDate}
                  onChange={(e) =>
                    setFormData({ ...formData, invoiceDate: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Due Date *</Label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Client Information */}
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
            <h3 className="font-semibold text-foreground">Client Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Client Name *</Label>
                <Input
                  value={formData.clientName}
                  onChange={(e) =>
                    setFormData({ ...formData, clientName: e.target.value })
                  }
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label>Client Email *</Label>
                <Input
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, clientEmail: e.target.value })
                  }
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phone</Label>
                <Input
                  value={formData.clientPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, clientPhone: e.target.value })
                  }
                  placeholder="+44 123 456 7890"
                />
              </div>
              <div>
                <Label>Country</Label>
                <Input
                  value={formData.clientCountry}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      clientCountry: e.target.value,
                    })
                  }
                  placeholder="United Kingdom"
                />
              </div>
            </div>

            <div>
              <Label>Billing Address</Label>
              <Textarea
                value={formData.billingAddress}
                onChange={(e) =>
                  setFormData({ ...formData, billingAddress: e.target.value })
                }
                placeholder="123 Main Street, London, UK"
              />
            </div>
          </div>

          {/* Company Information */}
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
            <h3 className="font-semibold text-foreground">Company Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Company Name *</Label>
                <Input
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                  placeholder="Company Ltd"
                />
              </div>
              <div>
                <Label>Company Number *</Label>
                <Input
                  value={formData.companyNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      companyNumber: e.target.value,
                    })
                  }
                  placeholder="12345678"
                />
              </div>
            </div>

            <div>
              <Label>Company ID</Label>
              <Input
                value={formData.companyId}
                onChange={(e) =>
                  setFormData({ ...formData, companyId: e.target.value })
                }
                placeholder="COMP-123"
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Invoice Items</h3>
            <div className="space-y-3">
              {formData.lineItems.map((item, index) => (
                <div key={item.id} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Label className="text-xs">Description</Label>
                    <Input
                      value={item.description}
                      onChange={(e) =>
                        handleLineItemChange(index, "description", e.target.value)
                      }
                      placeholder="Item description"
                    />
                  </div>
                  <div className="w-20">
                    <Label className="text-xs">Qty</Label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={item.quantity}
                      onChange={(e) =>
                        handleLineItemChange(index, "quantity", e.target.value)
                      }
                    />
                  </div>
                  <div className="w-28">
                    <Label className="text-xs">Unit Price</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) =>
                        handleLineItemChange(index, "unitPrice", e.target.value)
                      }
                    />
                  </div>
                  <div className="w-28">
                    <Label className="text-xs">Total</Label>
                    <Input
                      type="number"
                      disabled
                      value={item.total.toFixed(2)}
                      className="bg-muted"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLineItem(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLineItem}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Line Item
            </Button>
          </div>

          {/* Fees & Taxes */}
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
            <h3 className="font-semibold text-foreground">Fees & Taxes</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Tax Rate (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.taxRate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      taxRate: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label>Discount Amount (£)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.discountAmount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discountAmount: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label>Custom Fee (£)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.customFee}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      customFee: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            {formData.customFeeDescription && (
              <div>
                <Label>Fee Description</Label>
                <Input
                  value={formData.customFeeDescription}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      customFeeDescription: e.target.value,
                    })
                  }
                  placeholder="e.g., Processing fee"
                />
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="space-y-2 p-4 bg-blue-50 rounded-lg">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>£{subtotal.toFixed(2)}</span>
            </div>
            {taxes > 0 && (
              <div className="flex justify-between text-sm">
                <span>Taxes ({formData.taxRate}%):</span>
                <span>£{taxes.toFixed(2)}</span>
              </div>
            )}
            {formData.discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span>Discount:</span>
                <span>-£{formData.discountAmount.toFixed(2)}</span>
              </div>
            )}
            {formData.customFee > 0 && (
              <div className="flex justify-between text-sm">
                <span>Custom Fee:</span>
                <span>+£{formData.customFee.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Total:</span>
              <span>£{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment & Notes */}
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
            <div>
              <Label>Payment Method</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) =>
                  setFormData({ ...formData, paymentMethod: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Invoice description or notes"
              />
            </div>

            <div>
              <Label>Admin Notes</Label>
              <Textarea
                value={formData.adminNotes}
                onChange={(e) =>
                  setFormData({ ...formData, adminNotes: e.target.value })
                }
                placeholder="Internal notes for admin"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Invoice"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
