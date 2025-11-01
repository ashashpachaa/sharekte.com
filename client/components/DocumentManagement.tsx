import { useState } from "react";
import {
  Order,
  uploadOrderDocument,
  deleteOrderDocument,
  type OrderDocument,
} from "@/lib/orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Upload,
  Download,
  Trash2,
  FileIcon,
  Lock,
  Eye,
  Users,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DocumentManagementProps {
  order: Order;
  onDocumentsUpdated: (updatedOrder: Order) => void;
  isAdmin?: boolean;
}

export function DocumentManagement({
  order,
  onDocumentsUpdated,
  isAdmin = false,
}: DocumentManagementProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [visibility, setVisibility] = useState<"admin" | "user" | "both">(
    "both",
  );
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles: File[] = [];
      let hasError = false;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Validate file size (max 5GB per file)
        if (file.size > 5 * 1024 * 1024 * 1024) {
          toast.error(`File "${file.name}" exceeds 5GB limit`);
          hasError = true;
          continue;
        }
        newFiles.push(file);
      }

      setSelectedFiles((prev) => [...prev, ...newFiles]);

      if (newFiles.length > 0) {
        toast.success(`${newFiles.length} file(s) selected`);
      }
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one file");
      return;
    }

    console.log(
      `[DocumentManagement] Starting upload of ${selectedFiles.length} files for order ${order.id}`,
    );
    setUploading(true);
    let successCount = 0;
    let failureCount = 0;
    let finalOrder = order;

    try {
      // Upload files sequentially with small delays to prevent race conditions
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        try {
          console.log(
            `[DocumentManagement] Uploading file ${i + 1}/${selectedFiles.length}: ${file.name} (${file.size} bytes)`,
          );

          // Add small delay between uploads to ensure in-memory state is updated
          if (i > 0) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }

          const updatedOrder = await uploadOrderDocument(
            finalOrder.id,
            file,
            visibility,
          );
          finalOrder = updatedOrder;
          successCount++;
          console.log(
            `[DocumentManagement] ✓ File ${i + 1}/${selectedFiles.length} uploaded: ${file.name}`,
          );

          // Show progress
          toast.success(
            `Uploaded ${successCount}/${selectedFiles.length} files`,
          );
        } catch (error) {
          console.error(
            `[DocumentManagement] Failed to upload ${file.name}:`,
            error,
          );
          toast.error(`Failed to upload ${file.name}: ${String(error)}`);
          failureCount++;
        }
      }

      console.log(
        `[DocumentManagement] All uploads complete. Total: ${successCount} success, ${failureCount} failed, Documents in order: ${finalOrder.documents.length}`,
      );

      // Call callback with final updated order
      onDocumentsUpdated(finalOrder);
      setSelectedFiles([]);
      setVisibility("both");

      if (failureCount === 0) {
        toast.success(
          `✓ All ${successCount} document(s) uploaded successfully!`,
        );
      } else {
        toast.error(`Uploaded ${successCount}, failed ${failureCount}`);
      }
    } catch (error) {
      console.error("[DocumentManagement] Failed to upload documents:", error);
      toast.error(`Failed to upload documents: ${String(error)}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const updatedOrder = await deleteOrderDocument(order.id, documentId);
      onDocumentsUpdated(updatedOrder);
      toast.success("Document deleted successfully");
    } catch (error) {
      console.error("Failed to delete document:", error);
      toast.error("Failed to delete document");
    }
  };

  const handleDownload = (doc: OrderDocument) => {
    try {
      let downloadUrl = doc.url;

      // If we have base64 file data, use that instead
      if (!downloadUrl && doc.fileData) {
        downloadUrl = doc.fileData;
      }

      if (downloadUrl) {
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = doc.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Document downloaded");
      } else {
        toast.error("Document data not available");
      }
    } catch (error) {
      console.error("Failed to download document:", error);
      toast.error("Failed to download document");
    }
  };

  // Filter documents based on visibility and user role
  const visibleDocuments = order.documents.filter((doc) => {
    if (isAdmin) return true; // Admin can see all
    return doc.visibility === "user" || doc.visibility === "both";
  });

  return (
    <div className="space-y-6">
      {/* Upload Section (Admin Only) */}
      {isAdmin && (
        <div className="border-t border-border/40 pt-6">
          <h3 className="font-semibold text-foreground mb-4">
            Upload Documents
          </h3>
          <div className="bg-muted/30 rounded-lg p-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Select Files
              </label>
              <div className="relative">
                <input
                  type="file"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  className="hidden"
                  id="file-input"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip"
                  multiple
                />
                <label
                  htmlFor="file-input"
                  className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border/40 rounded-lg cursor-pointer hover:border-primary transition-colors"
                >
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">
                      Click to select files
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Max 5GB per file
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Selected Files ({selectedFiles.length})
                </p>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-background rounded border border-border/40"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSelectedFile(index)}
                        disabled={uploading}
                        className="flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Visibility
              </label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={visibility === "admin" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setVisibility("admin")}
                  disabled={uploading}
                >
                  <Lock className="w-4 h-4 mr-1" />
                  Admin Only
                </Button>
                <Button
                  variant={visibility === "user" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setVisibility("user")}
                  disabled={uploading}
                >
                  <Users className="w-4 h-4 mr-1" />
                  User Only
                </Button>
                <Button
                  variant={visibility === "both" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setVisibility("both")}
                  disabled={uploading}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Both
                </Button>
              </div>
            </div>

            <Button
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || uploading}
              className="w-full bg-primary hover:bg-primary-600 text-white"
            >
              {uploading
                ? "Uploading..."
                : `Upload ${selectedFiles.length} Document(s)`}
            </Button>
          </div>
        </div>
      )}

      {/* Documents List */}
      <div className="border-t border-border/40 pt-6">
        <h3 className="font-semibold text-foreground mb-4">
          Documents ({visibleDocuments.length})
        </h3>

        {visibleDocuments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No documents available</p>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleDocuments.map((doc) => (
              <DocumentListItem
                key={doc.id}
                doc={doc}
                onDownload={() => handleDownload(doc)}
                onDelete={() => handleDelete(doc.id)}
                canDelete={isAdmin}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bulk Actions (Admin Only) */}
      {isAdmin && visibleDocuments.length > 0 && (
        <div className="border-t border-border/40 pt-4">
          <Button variant="outline" className="w-full" disabled>
            <Download className="w-4 h-4 mr-2" />
            Download All as ZIP (Coming Soon)
          </Button>
        </div>
      )}
    </div>
  );
}

interface DocumentListItemProps {
  doc: OrderDocument;
  onDownload: () => void;
  onDelete: () => void;
  canDelete: boolean;
}

function DocumentListItem({
  doc,
  onDownload,
  onDelete,
  canDelete,
}: DocumentListItemProps) {
  const getFileIcon = (type: string) => {
    if (type.includes("pdf")) return "📄";
    if (type.includes("word")) return "📝";
    if (type.includes("sheet") || type.includes("excel")) return "📊";
    if (type.includes("image")) return "🖼️";
    if (type.includes("zip")) return "📦";
    return "📎";
  };

  return (
    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3 flex-1">
        <span className="text-xl">{getFileIcon(doc.type)}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {doc.name}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-muted-foreground">
              {(doc.size / 1024).toFixed(2)} KB
            </p>
            <span className="text-xs px-2 py-1 bg-background rounded">
              v{doc.version}
            </span>
            <span
              className={`text-xs px-2 py-1 rounded ${
                doc.visibility === "both"
                  ? "bg-blue-100 text-blue-700"
                  : doc.visibility === "admin"
                    ? "bg-orange-100 text-orange-700"
                    : "bg-green-100 text-green-700"
              }`}
            >
              {doc.visibility === "both"
                ? "Public"
                : doc.visibility === "admin"
                  ? "Admin"
                  : "User"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Uploaded {new Date(doc.uploadedDate).toLocaleDateString()} by{" "}
            {doc.uploadedBy}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onDownload}
          title="Download document"
        >
          <Download className="w-4 h-4" />
        </Button>
        {canDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            title="Delete document"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
