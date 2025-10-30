import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CompanyData,
  formatPrice,
  formatDate,
  STATUS_COLORS,
  PAYMENT_STATUS_COLORS,
  CompanyStatus,
  PaymentStatus,
} from "@/lib/company-management";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Calendar,
  FileText,
  Users,
  History,
  Tag,
  AlertCircle,
  Save,
  X,
  Download,
  Upload,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

interface CompanyDetailsModalProps {
  company: CompanyData;
  isAdmin?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSave?: (company: CompanyData) => void;
  children?: React.ReactNode;
}

export function CompanyDetailsModal({
  company: initialCompany,
  isAdmin = false,
  open: controlledOpen,
  onOpenChange,
  onSave,
  children,
}: CompanyDetailsModalProps) {
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [company, setCompany] = useState(initialCompany);

  const actualOpen = controlledOpen !== undefined ? controlledOpen : open;
  const setActualOpen = (newOpen: boolean) => {
    if (controlledOpen !== undefined) {
      onOpenChange?.(newOpen);
    } else {
      setOpen(newOpen);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setCompany(initialCompany);
    setIsEditing(false);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(company);
    }
    setIsEditing(false);
    toast.success("Company details updated successfully");
  };

  const handleStatusChange = (newStatus: CompanyStatus) => {
    setCompany({ ...company, status: newStatus });
  };

  const handlePaymentStatusChange = (newStatus: PaymentStatus) => {
    setCompany({ ...company, paymentStatus: newStatus });
  };

  return (
    <Dialog open={actualOpen} onOpenChange={setActualOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}

      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{company.companyName}</DialogTitle>
          <DialogDescription>
            <div className="flex gap-2 mt-2">
              <Badge className={STATUS_COLORS[company.status]}>
                {company.status}
              </Badge>
              <Badge className={PAYMENT_STATUS_COLORS[company.paymentStatus]}>
                {company.paymentStatus}
              </Badge>
            </div>
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Company Info */}
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-gray-600">Company Name</Label>
                  <p className="font-semibold">{company.companyName}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Company Number</Label>
                  <p className="font-semibold">{company.companyNumber}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Type</Label>
                  <p className="font-semibold">{company.type}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Country</Label>
                  <p className="font-semibold">{company.country}</p>
                </div>
              </div>

              {/* Client Info */}
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-gray-600 flex items-center gap-1">
                    <Users className="w-3 h-3" /> Client Name
                  </Label>
                  <p className="font-semibold">{company.clientName}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> Client Email
                  </Label>
                  <p className="font-semibold text-blue-600">{company.clientEmail}</p>
                </div>
                {company.clientPhone && (
                  <div>
                    <Label className="text-xs text-gray-600 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> Client Phone
                    </Label>
                    <p className="font-semibold">{company.clientPhone}</p>
                  </div>
                )}
                <div>
                  <Label className="text-xs text-gray-600 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Industry
                  </Label>
                  <p className="font-semibold">{company.industry || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Key Dates & Pricing */}
            <div className="border-t pt-4 grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-gray-600 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Incorporation Date
                  </Label>
                  <p className="font-semibold">{formatDate(company.incorporationDate)}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Renewal Date
                  </Label>
                  <p className="font-semibold">{formatDate(company.renewalDate)}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Expiry Date
                  </Label>
                  <p className="font-semibold">{formatDate(company.expiryDate)}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-gray-600 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" /> Purchase Price
                  </Label>
                  <p className="font-semibold">
                    {formatPrice(company.purchasePrice, company.currency)}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" /> Annual Renewal Fee
                  </Label>
                  <p className="font-semibold">
                    {formatPrice(company.renewalFee, company.currency)}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Days Until Renewal</Label>
                  <p className={`font-semibold ${
                    company.renewalDaysLeft <= 30
                      ? "text-orange-600"
                      : "text-green-600"
                  }`}>
                    {company.renewalDaysLeft} days
                  </p>
                </div>
              </div>
            </div>

            {/* Tags */}
            {company.tags && company.tags.length > 0 && (
              <div className="border-t pt-4">
                <Label className="text-xs text-gray-600 flex items-center gap-1 mb-2">
                  <Tag className="w-3 h-3" /> Tags
                </Label>
                <div className="flex flex-wrap gap-2">
                  {company.tags.map((tag) => (
                    <Badge key={tag.id} variant="outline">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Notes */}
            {company.adminNotes && (
              <div className="border-t pt-4 bg-blue-50 p-3 rounded">
                <Label className="text-xs text-gray-600 font-semibold">Admin Notes</Label>
                <p className="text-sm text-gray-700 mt-1">{company.adminNotes}</p>
              </div>
            )}
          </TabsContent>

          {/* Details Tab (Editable for Admin) */}
          <TabsContent value="details" className="space-y-4 mt-4">
            {isEditing && isAdmin ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={company.status}
                      onValueChange={handleStatusChange}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                        <SelectItem value="available">Available</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="paymentStatus">Payment Status</Label>
                    <Select
                      value={company.paymentStatus}
                      onValueChange={handlePaymentStatusChange}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="adminNotes">Admin Notes</Label>
                  <Textarea
                    id="adminNotes"
                    value={company.adminNotes || ""}
                    onChange={(e) =>
                      setCompany({ ...company, adminNotes: e.target.value })
                    }
                    placeholder="Internal notes for admin use only..."
                    className="h-24"
                  />
                </div>

                <div>
                  <Label htmlFor="internalNotes">Internal Notes</Label>
                  <Textarea
                    id="internalNotes"
                    value={company.internalNotes || ""}
                    onChange={(e) =>
                      setCompany({ ...company, internalNotes: e.target.value })
                    }
                    placeholder="Internal system notes..."
                    className="h-24"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-600">Status</Label>
                    <Badge className={STATUS_COLORS[company.status]}>
                      {company.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Payment Status</Label>
                    <Badge className={PAYMENT_STATUS_COLORS[company.paymentStatus]}>
                      {company.paymentStatus}
                    </Badge>
                  </div>
                </div>

                {company.adminNotes && (
                  <div className="bg-blue-50 p-3 rounded">
                    <Label className="text-xs text-gray-600">Admin Notes</Label>
                    <p className="text-sm text-gray-700 mt-1">
                      {company.adminNotes}
                    </p>
                  </div>
                )}

                {company.internalNotes && (
                  <div className="bg-gray-50 p-3 rounded">
                    <Label className="text-xs text-gray-600">Internal Notes</Label>
                    <p className="text-sm text-gray-700 mt-1">
                      {company.internalNotes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4 mt-4">
            {company.documents && company.documents.length > 0 ? (
              <div className="space-y-2">
                {company.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(doc.uploadedDate)} by {doc.uploadedBy}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">No documents yet</p>
              </div>
            )}

            {isAdmin && (
              <Button variant="outline" className="w-full gap-2">
                <Upload className="w-4 h-4" />
                Upload Document
              </Button>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4 mt-4">
            {company.activityLog && company.activityLog.length > 0 ? (
              <div className="space-y-3">
                {company.activityLog.map((entry, index) => (
                  <div
                    key={entry.id}
                    className="flex gap-3 pb-3 border-b last:border-b-0"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-600" />
                      {index < company.activityLog.length - 1 && (
                        <div className="w-0.5 h-8 bg-gray-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">{entry.action}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {formatDate(entry.timestamp)} by {entry.performedBy}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {entry.details}
                      </p>
                      {entry.previousStatus && entry.newStatus && (
                        <div className="mt-2 flex gap-2 text-xs">
                          <Badge variant="outline">{entry.previousStatus}</Badge>
                          <span className="text-gray-400">→</span>
                          <Badge className={STATUS_COLORS[entry.newStatus]}>
                            {entry.newStatus}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <History className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">No activity history yet</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          {isEditing && isAdmin ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </>
          ) : isAdmin ? (
            <Button onClick={handleEdit}>
              Edit Details
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
