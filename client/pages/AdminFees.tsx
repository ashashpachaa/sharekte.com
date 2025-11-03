import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  getAllFees,
  addFee,
  updateFee,
  deleteFee,
  toggleFeeEnabled,
  type Fee,
  type FeeType,
} from "@/lib/fees";
import { Plus, Edit2, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export function AdminFees() {
  const { t } = useTranslation();
  const [fees, setFees] = useState<Fee[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingFee, setEditingFee] = useState<Fee | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "fixed" as FeeType,
    amount: "",
    currency: "USD",
    enabled: true,
  });

  useEffect(() => {
    loadFees();
  }, []);

  const loadFees = () => {
    const allFees = getAllFees();
    setFees(allFees);
  };

  const handleOpenDialog = (fee?: Fee) => {
    if (fee) {
      setEditingFee(fee);
      setFormData({
        name: fee.name,
        description: fee.description || "",
        type: fee.type,
        amount: fee.amount.toString(),
        currency: fee.currency || "USD",
        enabled: fee.enabled,
      });
    } else {
      setEditingFee(null);
      setFormData({
        name: "",
        description: "",
        type: "fixed",
        amount: "",
        currency: "USD",
        enabled: true,
      });
    }
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error("Fee name is required");
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("Fee amount must be greater than 0");
      return;
    }

    try {
      const amount = parseFloat(formData.amount);

      if (editingFee) {
        updateFee(editingFee.id, {
          name: formData.name,
          description: formData.description,
          type: formData.type,
          amount,
          currency: formData.currency,
          enabled: formData.enabled,
        });
        toast.success("Fee updated successfully");
      } else {
        addFee({
          name: formData.name,
          description: formData.description,
          type: formData.type,
          amount,
          currency: formData.currency,
          enabled: formData.enabled,
          order: fees.length,
        });
        toast.success("Fee added successfully");
      }

      loadFees();
      setShowDialog(false);
    } catch (error) {
      console.error("Error saving fee:", error);
      toast.error("Failed to save fee");
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this fee?")) {
      if (deleteFee(id)) {
        toast.success("Fee deleted successfully");
        loadFees();
      } else {
        toast.error("Failed to delete fee");
      }
    }
  };

  const handleToggle = (id: string) => {
    const result = toggleFeeEnabled(id);
    if (result) {
      toast.success(
        `Fee ${result.enabled ? "enabled" : "disabled"} successfully`,
      );
      loadFees();
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Fees Management</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage checkout fees (taxes, service fees, etc.)
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Add New Fee
        </Button>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Fees</p>
              <p className="text-2xl font-bold">{fees.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Enabled</p>
              <p className="text-2xl font-bold text-green-600">
                {fees.filter((f) => f.enabled).length}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Disabled</p>
              <p className="text-2xl font-bold text-red-600">
                {fees.filter((f) => !f.enabled).length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fees Table */}
      <Card>
        <CardHeader>
          <CardTitle>Fees List</CardTitle>
        </CardHeader>
        <CardContent>
          {fees.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No fees configured</p>
              <Button onClick={() => handleOpenDialog()} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Create First Fee
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fees.map((fee) => (
                    <TableRow key={fee.id}>
                      <TableCell className="font-semibold">
                        {fee.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant={fee.type === "fixed" ? "secondary" : "outline"}>
                          {fee.type === "fixed" ? "Fixed" : "Percentage"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {fee.type === "fixed"
                          ? `${fee.currency || "USD"} ${fee.amount.toFixed(2)}`
                          : `${fee.amount.toFixed(2)}%`}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={fee.enabled ? "default" : "secondary"}
                          className="cursor-pointer"
                          onClick={() => handleToggle(fee.id)}
                        >
                          {fee.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {fee.description || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(fee)}
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggle(fee.id)}
                            title={fee.enabled ? "Disable" : "Enable"}
                          >
                            {fee.enabled ? (
                              <Eye className="w-4 h-4" />
                            ) : (
                              <EyeOff className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(fee.id)}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Fee Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingFee ? "Edit Fee" : "Add New Fee"}
            </DialogTitle>
            <DialogDescription>
              {editingFee
                ? "Update the fee details"
                : "Create a new fee to be applied at checkout"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Fee Name */}
            <div>
              <Label>Fee Name *</Label>
              <Input
                placeholder="e.g., Tax, Service Fee, Processing Fee"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            {/* Description */}
            <div>
              <Label>Description (Optional)</Label>
              <Textarea
                placeholder="e.g., 10% service charge for processing"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={2}
              />
            </div>

            {/* Fee Type */}
            <div>
              <Label>Fee Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value as FeeType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                  <SelectItem value="percentage">Percentage %</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div>
              <Label>
                {formData.type === "fixed" ? "Amount" : "Percentage"} *
              </Label>
              <Input
                type="number"
                placeholder={
                  formData.type === "fixed"
                    ? "e.g., 100"
                    : "e.g., 10 for 10%"
                }
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                step="0.01"
                min="0"
              />
            </div>

            {/* Currency (for fixed fees) */}
            {formData.type === "fixed" && (
              <div>
                <Label>Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) =>
                    setFormData({ ...formData, currency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="AED">AED (د.إ)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="SAR">SAR (﷼)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Enabled Status */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enabled"
                checked={formData.enabled}
                onChange={(e) =>
                  setFormData({ ...formData, enabled: e.target.checked })
                }
                className="w-4 h-4"
              />
              <Label htmlFor="enabled">Enable this fee immediately</Label>
            </div>
          </div>

          {/* Dialog Actions */}
          <div className="flex gap-2 justify-end mt-6">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingFee ? "Update Fee" : "Add Fee"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
