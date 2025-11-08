import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  fetchTransferForms,
  updateFormStatus,
  getFormStatusColor,
  formatFormStatus,
  getAvailableStatusTransitions,
  getActivityLabel,
  getAPIBaseURL,
  type TransferFormData,
  type FormStatus,
} from "@/lib/transfer-form";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Search,
  Filter,
  Eye,
  Download,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Clock,
  Mail,
} from "lucide-react";
import { toast } from "sonner";

interface TransferFormManagementProps {
  orderId?: string;
}

export function TransferFormManagement({
  orderId,
}: TransferFormManagementProps) {
  const [forms, setForms] = useState<TransferFormData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedForm, setSelectedForm] = useState<TransferFormData | null>(
    null,
  );
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<FormStatus | "">("");
  const [statusNotes, setStatusNotes] = useState("");

  useEffect(() => {
    loadForms();
    // Auto-refresh transfer forms every 10 seconds
    const refreshInterval = setInterval(() => {
      loadForms();
    }, 10000);
    return () => clearInterval(refreshInterval);
  }, [orderId]);

  const loadForms = async () => {
    try {
      setLoading(true);
      const data = await fetchTransferForms(orderId);
      const sortedData = data.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setForms(sortedData);

      // Check for new forms and show notification
      const newForms = sortedData.filter((f) => {
        if (!f.createdAt) return false;
        const formDate = new Date(f.createdAt);
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        return formDate > fiveMinutesAgo;
      });

      if (newForms.length > 0) {
        const message =
          newForms.length === 1
            ? `New transfer form: ${newForms[0].formId} for ${newForms[0].companyName}`
            : `${newForms.length} new transfer forms received`;

        const lastNotificationTime = localStorage.getItem(
          "lastTransferFormNotification",
        );
        const now = Date.now();
        if (
          !lastNotificationTime ||
          now - parseInt(lastNotificationTime) > 30000
        ) {
          toast.success(message);
          localStorage.setItem("lastTransferFormNotification", now.toString());
        }
      }
    } catch (error) {
      console.error("Failed to load forms:", error);
      if (!loading) {
        toast.error("Failed to load transfer forms");
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredForms = forms.filter((form) => {
    const matchesSearch =
      form.formId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      form.companyName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || form.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async () => {
    if (!selectedForm || !newStatus) return;

    try {
      const success = await updateFormStatus(
        selectedForm.id,
        newStatus as FormStatus,
        statusNotes,
      );
      if (success) {
        toast.success(
          `Form status updated to ${formatFormStatus(newStatus as FormStatus)}`,
        );
        // Update selectedForm immediately to reflect new status
        const updatedForm = {
          ...selectedForm,
          status: newStatus as FormStatus,
          updatedAt: new Date().toISOString(),
        };
        setSelectedForm(updatedForm);
        // Update form in list
        setForms((prevForms) =>
          prevForms.map((f) => (f.id === selectedForm.id ? updatedForm : f)),
        );

        // If status changed to "amend-required", update company with comment
        if (newStatus === "amend-required" && statusNotes) {
          try {
            // Update localStorage for purchased companies
            const purchasedCompaniesStr =
              localStorage.getItem("purchasedCompanies");
            if (purchasedCompaniesStr) {
              const purchasedCompanies = JSON.parse(purchasedCompaniesStr);
              const updatedCompanies = purchasedCompanies.map(
                (company: any) => {
                  // Match by company number (most reliable), then by name as fallback
                  if (
                    company.number === selectedForm.companyNumber ||
                    company.name === selectedForm.companyName
                  ) {
                    return {
                      ...company,
                      adminComments: statusNotes,
                      status: "amend-required",
                      statusHistory: [
                        ...(company.statusHistory || []),
                        {
                          id: `hist-${Date.now()}`,
                          fromStatus: company.status || "under-review",
                          toStatus: "amend-required",
                          changedDate: new Date().toISOString(),
                          changedBy: "admin",
                          reason: "Amendments required",
                          notes: statusNotes,
                        },
                      ],
                    };
                  }
                  return company;
                },
              );
              localStorage.setItem(
                "purchasedCompanies",
                JSON.stringify(updatedCompanies),
              );
              console.log(
                "[TransferFormManagement] Updated purchasedCompanies in localStorage",
              );

              // Dispatch custom event to notify Dashboard to refresh
              window.dispatchEvent(
                new CustomEvent("purchasedCompaniesUpdated", {
                  detail: { updatedCompanies },
                }),
              );
            }
          } catch (error) {
            console.error("Error updating company with comments:", error);
          }
        }

        setShowStatusModal(false);
        setNewStatus("");
        setStatusNotes("");
        // Reload forms to sync with server/Airtable
        setTimeout(() => loadForms(), 500);
      } else {
        toast.error("Failed to update form status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Error updating form status");
    }
  };

  const stats = {
    total: forms.length,
    underReview: forms.filter((f) => f.status === "under-review").length,
    amendRequired: forms.filter((f) => f.status === "amend-required").length,
    transferring: forms.filter((f) => f.status === "transferring").length,
    completed: forms.filter((f) => f.status === "complete-transfer").length,
    canceled: forms.filter((f) => f.status === "canceled").length,
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-gray-600">Total Forms</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">
              {stats.underReview}
            </div>
            <p className="text-xs text-gray-600">Under Review</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">
              {stats.amendRequired}
            </div>
            <p className="text-xs text-gray-600">Amend Required</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-orange-600">
              {stats.transferring}
            </div>
            <p className="text-xs text-gray-600">Transferring</p>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">
              {stats.completed}
            </div>
            <p className="text-xs text-gray-600">Completed</p>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">
              {stats.canceled}
            </div>
            <p className="text-xs text-gray-600">Canceled</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by form ID, company name, or buyer name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="under-review">Under Review</SelectItem>
                <SelectItem value="amend-required">Amend Required</SelectItem>
                <SelectItem value="confirm-application">
                  Confirm Application
                </SelectItem>
                <SelectItem value="transferring">Transferring</SelectItem>
                <SelectItem value="complete-transfer">
                  Complete Transfer
                </SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Forms Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transfer Forms</CardTitle>
          <CardDescription>
            Showing {filteredForms.length} of {forms.length} forms
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredForms.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No transfer forms found
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Form ID</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Buyer Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredForms.map((form) => (
                    <TableRow key={form.id} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-sm">
                        {form.formId}
                      </TableCell>
                      <TableCell className="font-medium">
                        {form.companyName}
                      </TableCell>
                      <TableCell>{form.country}</TableCell>
                      <TableCell>
                        <Badge className={getFormStatusColor(form.status)}>
                          {formatFormStatus(form.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(form.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(form.updatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedForm(form);
                              setShowDetailsModal(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedForm(form);
                              setShowStatusModal(true);
                            }}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedForm(form);
                              // Download PDF functionality
                            }}
                          >
                            <Download className="w-4 h-4" />
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

      {/* Form Details Modal */}
      <Dialog
        open={showDetailsModal && !!selectedForm}
        onOpenChange={setShowDetailsModal}
      >
        {selectedForm && (
          <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Transfer Form Application</DialogTitle>
              <DialogDescription>
                Form ID: {selectedForm.formId} • Order ID:{" "}
                {selectedForm.orderId}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Form Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div>
                  <p className="text-xs text-gray-600">Form ID</p>
                  <p className="font-semibold text-sm">{selectedForm.formId}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Status</p>
                  <div className="mt-1">
                    <Badge className={getFormStatusColor(selectedForm.status)}>
                      {formatFormStatus(selectedForm.status)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Submitted</p>
                  <p className="font-semibold text-sm">
                    {selectedForm.submittedAt
                      ? new Date(selectedForm.submittedAt).toLocaleDateString()
                      : new Date(selectedForm.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Last Updated</p>
                  <p className="font-semibold text-sm">
                    {new Date(selectedForm.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Company Information */}
              <div>
                <h3 className="font-semibold mb-3">Company Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs text-gray-600">
                      Company Name
                    </Label>
                    <p className="font-medium">{selectedForm.companyName}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">
                      Company Number
                    </Label>
                    <p className="font-medium">{selectedForm.companyNumber}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Country</Label>
                    <p className="text-sm">{selectedForm.country}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">
                      Incorporation Year
                    </Label>
                    <p className="text-sm">{selectedForm.incorporationYear}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">
                      Incorporation Date
                    </Label>
                    <p className="text-sm">
                      {selectedForm.incorporationDate
                        ? new Date(
                            selectedForm.incorporationDate,
                          ).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Attached Files - Prominent Display */}
              <div className="border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                <div className="mb-3">
                  <h3 className="font-bold text-lg">
                    📎 Attached Files ({selectedForm.attachments.length})
                  </h3>
                </div>
                {selectedForm.attachments.length > 0 ? (
                  <div className="space-y-2">
                    {selectedForm.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-3 bg-white border-l-4 border-blue-500 rounded hover:shadow-md transition-shadow"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-blue-900 truncate">
                            📄 {attachment.name}
                          </p>
                          <div className="flex gap-3 text-xs text-gray-600 mt-1">
                            <span>
                              {(attachment.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                            <span>•</span>
                            <span>
                              {new Date(
                                attachment.uploadedDate,
                              ).toLocaleDateString()}
                            </span>
                            <span>•</span>
                            <span>By {attachment.uploadedBy}</span>
                            {attachment.type && (
                              <>
                                <span>•</span>
                                <span>{attachment.type}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-2 text-blue-600 hover:text-blue-900"
                          title="Download attachment"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-white rounded text-center">
                    <p className="text-sm text-gray-500">
                      📭 No attachments uploaded yet
                    </p>
                  </div>
                )}
              </div>

              {/* Share Information */}
              {selectedForm.totalShares > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Share Details</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <Label className="text-xs text-gray-600">
                        Total Shares
                      </Label>
                      <p className="font-medium text-lg">
                        {selectedForm.totalShares}
                      </p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <Label className="text-xs text-gray-600">
                        Share Capital
                      </Label>
                      <p className="font-medium text-lg">
                        {selectedForm.totalShareCapital}
                      </p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <Label className="text-xs text-gray-600">
                        Price Per Share
                      </Label>
                      <p className="font-medium text-lg">
                        {selectedForm.pricePerShare}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Shareholders Information */}
              <div>
                <h3 className="font-semibold mb-3">
                  Shareholders ({selectedForm.numberOfShareholders})
                </h3>
                {selectedForm.shareholders &&
                selectedForm.shareholders.length > 0 ? (
                  <div className="space-y-3">
                    {selectedForm.shareholders.map((shareholder, idx) => (
                      <div
                        key={idx}
                        className="border-l-2 border-blue-200 pl-3 py-2 p-3 bg-gray-50 rounded"
                      >
                        <p className="font-medium text-sm">
                          {shareholder.name}
                        </p>
                        <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                          <div>
                            <span className="text-gray-600">Nationality:</span>{" "}
                            {shareholder.nationality}
                          </div>
                          <div>
                            <span className="text-gray-600">Shares:</span>{" "}
                            {shareholder.shareholderPercentage}%
                          </div>
                          <div>
                            <span className="text-gray-600">Amount:</span>{" "}
                            {shareholder.amount}
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {shareholder.address}, {shareholder.city},{" "}
                          {shareholder.country}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No shareholders information available
                  </p>
                )}
              </div>

              {/* PSC Information */}
              {selectedForm.pscList && selectedForm.pscList.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">
                    Persons of Significant Control ({selectedForm.numberOfPSCs})
                  </h3>
                  <div className="space-y-3">
                    {selectedForm.pscList.map((psc, idx) => (
                      <div
                        key={idx}
                        className="border-l-2 border-green-200 pl-3 p-3 bg-green-50 rounded"
                      >
                        <p className="font-medium text-sm">
                          {psc.shareholderName}
                        </p>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                          <div>
                            <span className="text-gray-600">Nationality:</span>{" "}
                            {psc.nationality}
                          </div>
                          <div>
                            <span className="text-gray-600">
                              Level of Control:
                            </span>{" "}
                            {psc.levelOfControl.join(", ")}
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {psc.address}, {psc.city}, {psc.country}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Company Change Requests */}
              <div>
                <h3 className="font-semibold mb-3">Company Changes</h3>
                {selectedForm.changeCompanyName && (
                  <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="font-medium text-sm mb-1">
                      🏷️ Company Name Change
                    </p>
                    {selectedForm.suggestedNames &&
                    selectedForm.suggestedNames.length > 0 ? (
                      <p className="text-sm">
                        Suggested names:{" "}
                        {selectedForm.suggestedNames.join(", ")}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-600">
                        Name change requested
                      </p>
                    )}
                  </div>
                )}
                {selectedForm.changeCompanyActivities && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="font-medium text-sm mb-1">
                      🏢 Activities Change
                    </p>
                    {selectedForm.companyActivities &&
                    selectedForm.companyActivities.length > 0 ? (
                      <div className="text-sm">
                        {selectedForm.companyActivities.map((activity, idx) => {
                          const label = getActivityLabel(activity);
                          return (
                            <p key={idx} className="text-gray-700">
                              • {label}
                            </p>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">
                        Activities change requested
                      </p>
                    )}
                  </div>
                )}
                {!selectedForm.changeCompanyName &&
                  !selectedForm.changeCompanyActivities && (
                    <p className="text-sm text-gray-500">
                      No company changes requested
                    </p>
                  )}
              </div>

              {/* Admin Tracking */}
              {(selectedForm.assignedTo || selectedForm.reviewedBy) && (
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h3 className="font-semibold mb-2 text-purple-900">
                    Admin Assignment
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedForm.assignedTo && (
                      <div>
                        <span className="text-gray-600">Assigned to:</span>
                        <p className="font-medium">{selectedForm.assignedTo}</p>
                        <p className="text-xs text-gray-600">
                          {selectedForm.assignedDate
                            ? new Date(
                                selectedForm.assignedDate,
                              ).toLocaleDateString()
                            : ""}
                        </p>
                      </div>
                    )}
                    {selectedForm.reviewedBy && (
                      <div>
                        <span className="text-gray-600">Reviewed by:</span>
                        <p className="font-medium">{selectedForm.reviewedBy}</p>
                        <p className="text-xs text-gray-600">
                          {selectedForm.reviewedDate
                            ? new Date(
                                selectedForm.reviewedDate,
                              ).toLocaleDateString()
                            : ""}
                        </p>
                      </div>
                    )}
                  </div>
                  {selectedForm.amendmentsRequiredCount > 0 && (
                    <div className="mt-2 text-sm">
                      <span className="text-orange-700">
                        Amendments required:
                      </span>{" "}
                      {selectedForm.amendmentsRequiredCount}
                      {selectedForm.lastAmendmentDate && (
                        <p className="text-xs text-gray-600">
                          Last amendment:{" "}
                          {new Date(
                            selectedForm.lastAmendmentDate,
                          ).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Status History */}
              {selectedForm.statusHistory &&
                selectedForm.statusHistory.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">
                      Status Change History
                    </h3>
                    <div className="space-y-2">
                      {selectedForm.statusHistory.map((change, idx) => (
                        <div
                          key={idx}
                          className="flex gap-3 p-3 bg-gray-50 rounded-lg text-sm"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {formatFormStatus(
                                  change.fromStatus as FormStatus,
                                )}
                              </Badge>
                              <span className="text-gray-600">→</span>
                              <Badge className="text-xs">
                                {formatFormStatus(
                                  change.toStatus as FormStatus,
                                )}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              Changed by {change.changedBy} on{" "}
                              {new Date(
                                change.changedDate,
                              ).toLocaleDateString()}
                            </p>
                            {change.notes && (
                              <p className="text-xs text-gray-700 mt-1 italic">
                                {change.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Attachments */}
              <div>
                <h3 className="font-semibold mb-3">
                  📎 Attached Files ({selectedForm.attachments.length})
                </h3>
                {selectedForm.attachments.length > 0 ? (
                  <div className="space-y-2">
                    {selectedForm.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm text-blue-900">
                            📄 {attachment.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(attachment.size / 1024 / 1024).toFixed(2)} MB •
                            Uploaded{" "}
                            {new Date(
                              attachment.uploadedDate,
                            ).toLocaleDateString()}{" "}
                            by {attachment.uploadedBy}
                          </p>
                          {attachment.type && (
                            <p className="text-xs text-gray-500 mt-1">
                              Type: {attachment.type}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-2"
                          onClick={async () => {
                            try {
                              const link = document.createElement("a");

                              if (attachment.url) {
                                // If URL exists, use it directly
                                link.href = attachment.url;
                                link.download = attachment.name;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              } else if (attachment.data) {
                                // If base64 data exists, create blob download
                                try {
                                  // Clean and validate base64 data
                                  let base64String = attachment.data.trim();

                                  // Remove any data URL prefix if present (data:application/pdf;base64,)
                                  if (base64String.includes(",")) {
                                    base64String = base64String.split(",")[1];
                                  }

                                  // Replace URL-safe characters with standard base64 characters if needed
                                  // This handles some edge cases in base64 encoding
                                  try {
                                    const byteCharacters = atob(base64String);
                                    const byteNumbers = new Array(
                                      byteCharacters.length,
                                    );
                                    for (
                                      let i = 0;
                                      i < byteCharacters.length;
                                      i++
                                    ) {
                                      byteNumbers[i] =
                                        byteCharacters.charCodeAt(i);
                                    }
                                    const byteArray = new Uint8Array(
                                      byteNumbers,
                                    );
                                    const blob = new Blob([byteArray], {
                                      type:
                                        attachment.type ||
                                        "application/octet-stream",
                                    });
                                    link.href = URL.createObjectURL(blob);
                                    link.download = attachment.name;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);

                                    // Clean up object URL
                                    setTimeout(() => {
                                      URL.revokeObjectURL(link.href);
                                    }, 100);
                                  } catch (decodeError) {
                                    console.error(
                                      "Base64 decode error:",
                                      decodeError,
                                    );
                                    console.error(
                                      "Base64 data length:",
                                      base64String.length,
                                    );
                                    console.error(
                                      "First 100 chars of data:",
                                      base64String.substring(0, 100),
                                    );
                                    toast.error(
                                      "File format error - cannot decode attachment. The file data may be corrupted. Please re-upload the file.",
                                    );
                                  }
                                } catch (outerError) {
                                  console.error(
                                    "Attachment processing error:",
                                    outerError,
                                  );
                                  toast.error(
                                    "Error processing attachment - please try again",
                                  );
                                }
                              } else {
                                // Fallback: Try to fetch attachment data from server if available
                                console.warn(
                                  "Attachment data missing, attempting to fetch from server:",
                                  {
                                    name: attachment.name,
                                    formId: selectedForm.formId,
                                    attachmentId: attachment.id,
                                  },
                                );

                                try {
                                  // Try to fetch the full form with fresh attachment data
                                  const apiBaseURL = getAPIBaseURL();
                                  const response = await fetch(
                                    `${apiBaseURL}/api/transfer-forms/${selectedForm.formId}`,
                                  );
                                  if (response.ok) {
                                    const freshForm = await response.json();
                                    const freshAttachment =
                                      freshForm.attachments?.find(
                                        (a: any) => a.id === attachment.id,
                                      );

                                    if (freshAttachment?.data) {
                                      // Successfully fetched fresh data, use it
                                      const byteCharacters = atob(
                                        freshAttachment.data,
                                      );
                                      const byteNumbers = new Array(
                                        byteCharacters.length,
                                      );
                                      for (
                                        let i = 0;
                                        i < byteCharacters.length;
                                        i++
                                      ) {
                                        byteNumbers[i] =
                                          byteCharacters.charCodeAt(i);
                                      }
                                      const byteArray = new Uint8Array(
                                        byteNumbers,
                                      );
                                      const blob = new Blob([byteArray], {
                                        type:
                                          freshAttachment.type ||
                                          "application/octet-stream",
                                      });
                                      link.href = URL.createObjectURL(blob);
                                      link.download = attachment.name;
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);

                                      setTimeout(() => {
                                        URL.revokeObjectURL(link.href);
                                      }, 100);

                                      toast.success(
                                        `Downloading ${attachment.name}...`,
                                      );
                                      return;
                                    }
                                  }
                                } catch (fetchError) {
                                  console.error(
                                    "Failed to fetch attachment from server:",
                                    fetchError,
                                  );
                                }

                                toast.error(
                                  `Cannot download ${attachment.name} - file data not available. Please try uploading the file again.`,
                                );
                                return;
                              }

                              toast.success(
                                `Downloading ${attachment.name}...`,
                              );
                            } catch (error) {
                              console.error("Download error:", error);
                              toast.error("Failed to download file");
                            }
                          }}
                          title={`Download ${attachment.name}`}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <p className="text-sm text-gray-500">
                      No attachments uploaded yet
                    </p>
                  </div>
                )}
              </div>

              {/* Comments */}
              {selectedForm.comments.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Comments & Notes</h3>
                  <div className="space-y-3">
                    {selectedForm.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className={`p-3 rounded-lg border ${
                          comment.isAdminOnly
                            ? "bg-yellow-50 border-yellow-200"
                            : "bg-gray-50"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-medium text-sm">
                            {comment.author}
                          </p>
                          {comment.isAdminOnly && (
                            <Badge variant="outline" className="text-xs">
                              Admin Only
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-700">{comment.text}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(comment.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              {selectedForm.adminNotes && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold mb-2 text-blue-900">
                    Admin Notes
                  </h3>
                  <p className="text-sm text-blue-800">
                    {selectedForm.adminNotes}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="flex gap-2 flex-wrap justify-between">
              <Button
                variant="outline"
                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const apiBaseURL = getAPIBaseURL();
                      const pdfUrl = `${apiBaseURL}/api/transfer-forms/${selectedForm.formId}/pdf`;

                      console.log(
                        "[Transfer Form Download] Generating PDF for form:",
                        selectedForm.formId,
                      );

                      // Send complete form data to server for PDF generation
                      // This ensures PDF can be generated even if form isn't in server memory
                      const formDataSize = JSON.stringify(selectedForm).length;
                      console.log(
                        "[Transfer Form Download] Sending form data to server:",
                        {
                          url: pdfUrl,
                          formId: selectedForm.formId,
                          companyName: selectedForm.companyName,
                          dataSize: formDataSize,
                          hasAllRequiredFields: !!(
                            selectedForm.formId && selectedForm.companyName
                          ),
                        },
                      );

                      const response = await fetch(pdfUrl, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify(selectedForm),
                      });

                      console.log(
                        "[Transfer Form Download] Response status:",
                        response.status,
                      );
                      console.log(
                        "[Transfer Form Download] Response headers:",
                        {
                          contentType: response.headers.get("content-type"),
                          contentLength: response.headers.get("content-length"),
                        },
                      );

                      if (!response.ok) {
                        let errorDetail = `HTTP ${response.status}`;
                        let friendlyMessage = "Failed to download form";

                        try {
                          const errorBody = await response.json();
                          errorDetail = `${response.status}: ${errorBody.error || "Unknown error"}`;
                          if (errorBody.detail) {
                            errorDetail += ` - ${errorBody.detail}`;
                          }
                          if (errorBody.hint) {
                            friendlyMessage = `${errorBody.error}. ${errorBody.hint}`;
                          } else if (response.status === 404) {
                            friendlyMessage =
                              "Form data could not be found. Please refresh the page and try downloading again.";
                          }
                        } catch {
                          // Could not parse error response
                          if (response.status === 404) {
                            friendlyMessage =
                              "Form not found. Please refresh the page and try downloading again.";
                          }
                        }
                        console.error(
                          "[Transfer Form Download] Server error:",
                          errorDetail,
                        );
                        console.error(
                          "[Transfer Form Download] Sent form details:",
                          {
                            formId: selectedForm?.formId,
                            companyName: selectedForm?.companyName,
                            dataSize: formDataSize,
                          },
                        );
                        throw new Error(friendlyMessage);
                      }

                      // Get blob from response (only read body once)
                      const blob = await response.blob();

                      if (!blob || blob.size === 0) {
                        throw new Error("Server returned empty file");
                      }

                      console.log(
                        "[Transfer Form Download] Success, blob size:",
                        blob.size,
                        "bytes",
                      );

                      // Create download link and trigger download
                      const downloadUrl = window.URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.href = downloadUrl;
                      link.download = `transfer-form-${selectedForm.formId}.pdf`;

                      // Append, click, and remove
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);

                      // Revoke URL after a short delay
                      setTimeout(() => {
                        window.URL.revokeObjectURL(downloadUrl);
                      }, 200);

                      toast.success(
                        "Transfer form downloaded successfully as PDF with all application data and fields.",
                      );
                    } catch (error) {
                      console.error("[Transfer Form Download] Error:", error);
                      toast.error(
                        error instanceof Error
                          ? `Download failed: ${error.message}`
                          : "Failed to download form",
                      );
                    }
                  }}
                  className="gap-2"
                  title="Download transfer form as PDF with all application fields and data"
                >
                  <Download className="w-4 h-4" />
                  Download Form
                </Button>
                <Button
                  onClick={() => {
                    setShowStatusModal(true);
                    setShowDetailsModal(false);
                  }}
                >
                  Change Status
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Status Change Modal */}
      <Dialog
        open={showStatusModal && !!selectedForm}
        onOpenChange={setShowStatusModal}
      >
        {selectedForm && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Form Status</DialogTitle>
              <DialogDescription>
                Form: {selectedForm.formId} • Current:{" "}
                {formatFormStatus(selectedForm.status)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="new-status">New Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger id="new-status">
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableStatusTransitions(selectedForm.status).map(
                      (status) => (
                        <SelectItem key={status} value={status}>
                          {formatFormStatus(status)}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add notes about this status change..."
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  rows={4}
                />
              </div>

              {newStatus === "amend-required" && (
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-sm text-yellow-800">
                  ℹ️ Client will be notified to amend the form
                </div>
              )}

              {newStatus === "complete-transfer" && (
                <div className="bg-green-50 p-3 rounded-lg border border-green-200 text-sm text-green-800">
                  ✓ Transfer will be marked as complete and client will be
                  notified
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowStatusModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleStatusChange} disabled={!newStatus}>
                Update Status
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
