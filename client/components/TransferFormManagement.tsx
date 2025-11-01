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

export function TransferFormManagement({ orderId }: TransferFormManagementProps) {
  const [forms, setForms] = useState<TransferFormData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedForm, setSelectedForm] = useState<TransferFormData | null>(null);
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
        const message = newForms.length === 1
          ? `New transfer form: ${newForms[0].formId} from ${newForms[0].buyerName}`
          : `${newForms.length} new transfer forms received`;

        const lastNotificationTime = localStorage.getItem("lastTransferFormNotification");
        const now = Date.now();
        if (!lastNotificationTime || now - parseInt(lastNotificationTime) > 30000) {
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

    const matchesStatus = filterStatus === "all" || form.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async () => {
    if (!selectedForm || !newStatus) return;

    try {
      const success = await updateFormStatus(selectedForm.id, newStatus as FormStatus, statusNotes);
      if (success) {
        toast.success(`Form status updated to ${formatFormStatus(newStatus as FormStatus)}`);
        setShowStatusModal(false);
        setNewStatus("");
        setStatusNotes("");
        loadForms();
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
            <div className="text-2xl font-bold text-blue-600">{stats.underReview}</div>
            <p className="text-xs text-gray-600">Under Review</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.amendRequired}</div>
            <p className="text-xs text-gray-600">Amend Required</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-orange-600">{stats.transferring}</div>
            <p className="text-xs text-gray-600">Transferring</p>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-gray-600">Completed</p>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">{stats.canceled}</div>
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
                <SelectItem value="confirm-application">Confirm Application</SelectItem>
                <SelectItem value="transferring">Transferring</SelectItem>
                <SelectItem value="complete-transfer">Complete Transfer</SelectItem>
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
                      <TableCell className="font-mono text-sm">{form.formId}</TableCell>
                      <TableCell className="font-medium">{form.companyName}</TableCell>
                      <TableCell>{form.buyerName}</TableCell>
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
      <Dialog open={showDetailsModal && !!selectedForm} onOpenChange={setShowDetailsModal}>
        {selectedForm && (
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Transfer Form: {selectedForm.formId}</DialogTitle>
              <DialogDescription>
                Company: {selectedForm.companyName} ({selectedForm.companyNumber})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Current Status */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Current Status</h3>
                <div className="flex items-center gap-2">
                  <Badge className={getFormStatusColor(selectedForm.status)}>
                    {formatFormStatus(selectedForm.status)}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    Updated: {new Date(selectedForm.updatedAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Buyer Information */}
              <div>
                <h3 className="font-semibold mb-3">Buyer Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-600">Name</Label>
                    <p className="font-medium">{selectedForm.buyerName}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Email</Label>
                    <p className="font-medium">{selectedForm.buyerEmail}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Address</Label>
                    <p className="text-sm">{selectedForm.buyerAddress}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Country</Label>
                    <p className="text-sm">{selectedForm.buyerCountry}</p>
                  </div>
                </div>
              </div>

              {/* Seller Information */}
              <div>
                <h3 className="font-semibold mb-3">Seller Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-600">Name</Label>
                    <p className="font-medium">{selectedForm.sellerName}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Email</Label>
                    <p className="font-medium">{selectedForm.sellerEmail}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Address</Label>
                    <p className="text-sm">{selectedForm.sellerAddress}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Country</Label>
                    <p className="text-sm">{selectedForm.sellerCountry}</p>
                  </div>
                </div>
              </div>

              {/* Attachments */}
              {selectedForm.attachments.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Attachments ({selectedForm.attachments.length})</h3>
                  <div className="space-y-2">
                    {selectedForm.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div>
                          <p className="font-medium text-sm">{attachment.name}</p>
                          <p className="text-xs text-gray-500">
                            {(attachment.size / 1024 / 1024).toFixed(2)} MB • {new Date(attachment.uploadedDate).toLocaleDateString()}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments */}
              {selectedForm.comments.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Comments & Notes</h3>
                  <div className="space-y-3">
                    {selectedForm.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className={`p-3 rounded-lg border ${
                          comment.isAdminOnly ? "bg-yellow-50 border-yellow-200" : "bg-gray-50"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-medium text-sm">{comment.author}</p>
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
                  <h3 className="font-semibold mb-2 text-blue-900">Admin Notes</h3>
                  <p className="text-sm text-blue-800">{selectedForm.adminNotes}</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  setShowStatusModal(true);
                  setShowDetailsModal(false);
                }}
              >
                Change Status
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Status Change Modal */}
      <Dialog open={showStatusModal && !!selectedForm} onOpenChange={setShowStatusModal}>
        {selectedForm && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Form Status</DialogTitle>
              <DialogDescription>
                Form: {selectedForm.formId} • Current: {formatFormStatus(selectedForm.status)}
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
                    {getAvailableStatusTransitions(selectedForm.status).map((status) => (
                      <SelectItem key={status} value={status}>
                        {formatFormStatus(status)}
                      </SelectItem>
                    ))}
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
                  ✓ Transfer will be marked as complete and client will be notified
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowStatusModal(false)}>
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
