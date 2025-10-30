import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Edit2,
  Trash2,
  RefreshCw,
  Eye,
  MoreHorizontal,
  TrendingUp,
} from "lucide-react";
import {
  CompanyData,
  STATUS_COLORS,
  PAYMENT_STATUS_COLORS,
  formatPrice,
  formatDate,
} from "@/lib/company-management";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface CompanyTableProps {
  companies: CompanyData[];
  onViewDetails?: (company: CompanyData) => void;
  onEdit?: (company: CompanyData) => void;
  onDelete?: (id: string) => void;
  onRenew?: (id: string) => void;
  onStatusChange?: (id: string, status: string) => void;
  isAdmin?: boolean;
}

export function CompanyTable({
  companies = [],
  onViewDetails,
  onEdit,
  onDelete,
  onRenew,
  onStatusChange,
  isAdmin = false,
}: CompanyTableProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    if (onDelete) {
      onDelete(id);
      setShowDeleteDialog(null);
      toast.success("Company deleted successfully");
    }
  };

  const handleRenew = (id: string) => {
    if (onRenew) {
      onRenew(id);
      toast.success("Company renewal processed");
    }
  };

  const safeCompanies = Array.isArray(companies) ? companies : [];

  return (
    <>
      <div className="border rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold">Company Name</TableHead>
              <TableHead className="font-semibold">Company Number</TableHead>
              <TableHead className="font-semibold">Country</TableHead>
              <TableHead className="font-semibold">Incorporate Date</TableHead>
              <TableHead className="font-semibold">Incorporate Year</TableHead>
              <TableHead className="font-semibold">Price</TableHead>
              <TableHead className="text-right font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {safeCompanies.map((company) => (
              <TableRow
                key={company.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <TableCell className="font-medium">
                  <button
                    onClick={() => onViewDetails?.(company)}
                    className="text-blue-600 hover:underline"
                  >
                    {company.companyName}
                  </button>
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {company.companyNumber}
                </TableCell>
                <TableCell className="text-sm">{company.country}</TableCell>
                <TableCell className="text-sm">
                  {formatDate(company.incorporationDate)}
                </TableCell>
                <TableCell className="text-sm">{company.incorporationYear}</TableCell>
                <TableCell className="text-sm font-medium">
                  {formatPrice(company.purchasePrice, company.currency)}
                </TableCell>
                <TableCell className="text-right">
                  {isAdmin ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => onViewDetails?.(company)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit?.(company)}>
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {company.status !== "expired" &&
                          company.status !== "cancelled" && (
                            <DropdownMenuItem
                              onClick={() => handleRenew(company.id)}
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Renew
                            </DropdownMenuItem>
                          )}
                        {(company.status === "refunded" ||
                          company.status === "cancelled") && (
                          <DropdownMenuItem
                            onClick={() =>
                              onStatusChange?.(company.id, "available")
                            }
                          >
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Reactivate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => setShowDeleteDialog(company.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails?.(company)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteDialog !== null}
        onOpenChange={(open) => !open && setShowDeleteDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Company</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this company? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (showDeleteDialog) {
                  handleDelete(showDeleteDialog);
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
