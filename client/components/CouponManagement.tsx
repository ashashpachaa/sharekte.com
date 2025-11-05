import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Coupon,
  fetchCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from "@/lib/coupons";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Check, X } from "lucide-react";

export function CouponManagement() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: 0,
    maxUses: undefined as number | undefined,
    expiryDate: "",
    active: true,
    applicableTo: "all" as "all" | "companies" | "services",
    minOrderValue: undefined as number | undefined,
  });

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const data = await fetchCoupons();
      setCoupons(data);
    } catch (error) {
      toast.error("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (coupon?: Coupon) => {
    if (coupon) {
      setSelectedCoupon(coupon);
      setFormData({
        code: coupon.code,
        description: coupon.description || "",
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maxUses: coupon.maxUses,
        expiryDate: coupon.expiryDate ? coupon.expiryDate.split("T")[0] : "",
        active: coupon.active,
        applicableTo: coupon.applicableTo || "all",
        minOrderValue: coupon.minOrderValue,
      });
    } else {
      setSelectedCoupon(null);
      setFormData({
        code: "",
        description: "",
        discountType: "percentage",
        discountValue: 0,
        maxUses: undefined,
        expiryDate: "",
        active: true,
        applicableTo: "all",
        minOrderValue: undefined,
      });
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.code || formData.discountValue <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const couponData = {
        code: formData.code,
        description: formData.description || undefined,
        discountType: formData.discountType,
        discountValue: formData.discountValue,
        maxUses: formData.maxUses,
        expiryDate: formData.expiryDate || undefined,
        active: formData.active,
        applicableTo: formData.applicableTo,
        minOrderValue: formData.minOrderValue,
      };

      if (selectedCoupon) {
        const updated = await updateCoupon(selectedCoupon.id, couponData);
        if (updated) {
          toast.success("Coupon updated successfully");
          await loadCoupons();
        }
      } else {
        const created = await createCoupon(couponData);
        if (created) {
          toast.success("Coupon created successfully");
          await loadCoupons();
        }
      }

      setShowDialog(false);
    } catch (error) {
      toast.error("Error saving coupon");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;

    try {
      const success = await deleteCoupon(id);
      if (success) {
        toast.success("Coupon deleted successfully");
        await loadCoupons();
      }
    } catch (error) {
      toast.error("Error deleting coupon");
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading coupons...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Coupon Management</h2>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Coupon
        </Button>
      </div>

      {coupons.length === 0 ? (
        <Alert>
          <AlertDescription>No coupons found. Create your first coupon to get started.</AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4">
          {coupons.map((coupon) => (
            <div
              key={coupon.id}
              className="border border-border/40 rounded-lg p-6 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      {coupon.code}
                    </h3>
                    <Badge variant={coupon.active ? "default" : "outline"}>
                      {coupon.active ? "Active" : "Inactive"}
                    </Badge>
                    {coupon.expiryDate && new Date(coupon.expiryDate) < new Date() && (
                      <Badge variant="destructive">Expired</Badge>
                    )}
                  </div>

                  {coupon.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {coupon.description}
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Discount:</span>
                      <span className="ml-2 font-medium text-foreground">
                        {coupon.discountType === "percentage"
                          ? `${coupon.discountValue}%`
                          : `$${coupon.discountValue}`}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted-foreground">Uses:</span>
                      <span className="ml-2 font-medium text-foreground">
                        {coupon.usedCount}
                        {coupon.maxUses ? ` / ${coupon.maxUses}` : ""}
                      </span>
                    </div>

                    {coupon.expiryDate && (
                      <div>
                        <span className="text-muted-foreground">Expires:</span>
                        <span className="ml-2 font-medium text-foreground">
                          {new Date(coupon.expiryDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {coupon.minOrderValue && (
                      <div>
                        <span className="text-muted-foreground">Min Order:</span>
                        <span className="ml-2 font-medium text-foreground">
                          ${coupon.minOrderValue}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDialog(coupon)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(coupon.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCoupon ? "Edit Coupon" : "Create New Coupon"}
            </DialogTitle>
            <DialogDescription>
              {selectedCoupon ? "Update coupon details" : "Add a new discount coupon"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Code */}
            <div>
              <label className="text-sm font-medium">Coupon Code *</label>
              <Input
                value={formData.code}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    code: e.target.value.toUpperCase(),
                  }))
                }
                placeholder="e.g., WELCOME10"
                disabled={!!selectedCoupon}
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="e.g., 10% off for new customers"
              />
            </div>

            {/* Discount Type & Value */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Discount Type</label>
                <Select
                  value={formData.discountType}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      discountType: value as "percentage" | "fixed",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">
                  Discount Value {formData.discountType === "percentage" ? "(%)" : "($)"}
                </label>
                <Input
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      discountValue: parseFloat(e.target.value) || 0,
                    }))
                  }
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            {/* Applicable To */}
            <div>
              <label className="text-sm font-medium">Applicable To</label>
              <Select
                value={formData.applicableTo}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    applicableTo: value as "all" | "companies" | "services",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="companies">Companies Only</SelectItem>
                  <SelectItem value="services">Services Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Min Order Value */}
            <div>
              <label className="text-sm font-medium">Minimum Order Value (Optional)</label>
              <Input
                type="number"
                value={formData.minOrderValue || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    minOrderValue: e.target.value ? parseFloat(e.target.value) : undefined,
                  }))
                }
                placeholder="e.g., 500"
              />
            </div>

            {/* Max Uses */}
            <div>
              <label className="text-sm font-medium">Max Uses (Optional)</label>
              <Input
                type="number"
                value={formData.maxUses || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    maxUses: e.target.value ? parseInt(e.target.value) : undefined,
                  }))
                }
                placeholder="Leave empty for unlimited"
              />
            </div>

            {/* Expiry Date */}
            <div>
              <label className="text-sm font-medium">Expiry Date (Optional)</label>
              <Input
                type="date"
                value={formData.expiryDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    expiryDate: e.target.value,
                  }))
                }
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    active: e.target.checked,
                  }))
                }
              />
              <label htmlFor="active" className="text-sm font-medium">
                Active
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {selectedCoupon ? "Update Coupon" : "Create Coupon"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
