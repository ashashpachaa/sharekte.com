import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Edit2,
  Trash2,
  RefreshCw,
  DollarSign,
  Eye,
  Clock,
  AlertCircle,
  Globe,
  Hash,
  User,
  TrendingUp,
  Archive,
  AlertTriangle,
  History,
} from "lucide-react";
import {
  CompanyData,
  STATUS_COLORS,
  formatPrice,
  formatDate,
  getRenewalCountdown,
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
import { useCurrency, CurrencyRate } from "@/lib/currency-context";
import { getAmendmentComments, FormComment } from "@/lib/transfer-form";

interface CompanyCardProps {
  company: CompanyData;
  onEdit?: (company: CompanyData) => void;
  onDelete?: (id: string) => void;
  onRenew?: (id: string) => void;
  onStatusChange?: (id: string, status: string) => void;
  onViewDetails?: (company: CompanyData) => void;
  isAdmin?: boolean;
}

export function CompanyCard({
  company,
  onEdit,
  onDelete,
  onRenew,
  onStatusChange,
  onViewDetails,
  isAdmin = false,
}: CompanyCardProps) {
  const {
    convertPrice,
    formatPrice: formatWithCurrency,
    formatPriceAlreadyConverted,
    rates,
  } = useCurrency();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAmendmentHistory, setShowAmendmentHistory] = useState(false);
  const [amendmentComments, setAmendmentComments] = useState<FormComment[]>([]);
  const [loadingAmendments, setLoadingAmendments] = useState(false);

  // Load amendment comments when component mounts or company changes
  useEffect(() => {
    if (company.status === "amend-required") {
      setLoadingAmendments(true);
      getAmendmentComments(company.id)
        .then((comments) => {
          setAmendmentComments(comments);
        })
        .catch((error) => {
          console.error("Error loading amendment comments:", error);
        })
        .finally(() => {
          setLoadingAmendments(false);
        });
    }
  }, [company.id, company.status]);

  const renewalCountdown = getRenewalCountdown(company.renewalDaysLeft);
  const isRenewingSoon = company.renewalDaysLeft <= 30;
  const isExpired = company.status === "expired";
  const hasAmendmentRequired = company.status === "amend-required";
  const recentAmendment = amendmentComments.length > 0 ? amendmentComments[0] : null;

  const handleDelete = () => {
    if (onDelete) {
      onDelete(company.id);
      setShowDeleteDialog(false);
      toast.success("Company deleted successfully");
    }
  };

  const handleRenew = () => {
    if (onRenew) {
      onRenew(company.id);
      toast.success("Company renewal processed");
    }
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-all duration-200 flex flex-col h-full">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base truncate">
                {company.companyName}
              </CardTitle>
              <CardDescription className="text-xs truncate">
                {company.companyNumber}
              </CardDescription>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <Badge className={STATUS_COLORS[company.status]}>
                {company.status}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 pb-3 space-y-3">
          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1 text-gray-600">
              <Globe className="w-3 h-3" />
              <span>{company.country || "N/A"}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600">
              <Hash className="w-3 h-3" />
              <span>{company.type || "N/A"}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600">
              <DollarSign className="w-3 h-3" />
              <span>
                {company.purchasePrice
                  ? formatPriceAlreadyConverted(
                      // If company has a different currency, we need to normalize to USD first, then convert to user's currency
                      company.currency &&
                        company.currency !== "USD" &&
                        rates[company.currency as any]
                        ? convertPrice(
                            company.purchasePrice /
                              (rates[company.currency as any]?.rate || 1),
                          )
                        : convertPrice(company.purchasePrice),
                    )
                  : "N/A"}
              </span>
            </div>
            <div className="flex items-center gap-1 text-gray-600">
              <User className="w-3 h-3" />
              <span className="truncate">
                {company.clientName ? company.clientName.split(" ")[0] : "N/A"}
              </span>
            </div>
          </div>

          {/* Renewal Info */}
          <div
            className={`p-2 rounded-md flex items-center gap-2 ${
              isRenewingSoon
                ? "bg-yellow-50 text-yellow-700"
                : isExpired
                  ? "bg-red-50 text-red-700"
                  : "bg-blue-50 text-blue-700"
            }`}
          >
            <Clock className="w-4 h-4 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-xs">{renewalCountdown}</p>
              <p className="text-xs opacity-75">
                {company.renewalDate ? formatDate(company.renewalDate) : "N/A"}
              </p>
            </div>
            {isRenewingSoon && (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
          </div>

          {/* Incorporation Date */}
          <div className="text-xs text-gray-600">
            <span className="font-medium">Incorporated:</span>{" "}
            {company.incorporationDate
              ? formatDate(company.incorporationDate)
              : "N/A"}
          </div>

          {/* Amendment Required Alert */}
          {hasAmendmentRequired && (
            <div className="p-2 rounded-md bg-red-50 border border-red-200">
              <div className="flex gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-red-900 mb-1">
                    Amendments Required
                  </p>
                  {recentAmendment ? (
                    <>
                      <p className="text-xs text-red-800 line-clamp-2">
                        {recentAmendment.text}
                      </p>
                      <p className="text-xs text-red-700 mt-1 opacity-75">
                        {new Date(recentAmendment.createdAt).toLocaleString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                      {amendmentComments.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 px-2 text-xs text-red-600 mt-1"
                          onClick={() => setShowAmendmentHistory(true)}
                        >
                          <History className="w-3 h-3 mr-1" />
                          View {amendmentComments.length} amendments
                        </Button>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-red-700">
                      {loadingAmendments
                        ? "Loading amendments..."
                        : "No amendment details available"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tags */}
          {company.tags && company.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {company.tags.slice(0, 2).map((tag) => (
                <Badge key={tag.id} variant="outline" className="text-xs">
                  {tag.name}
                </Badge>
              ))}
              {company.tags.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{company.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </CardContent>

        {/* Action Buttons */}
        <div className="px-4 pb-4 pt-0 border-t">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={() => onViewDetails?.(company)}
            >
              <Eye className="w-3 h-3 mr-1" />
              View
            </Button>
            {isAdmin && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => onEdit?.(company)}
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                {company.status !== "expired" &&
                  company.status !== "cancelled" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 text-xs"
                      onClick={handleRenew}
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Renew
                    </Button>
                  )}
                {(company.status === "refunded" ||
                  company.status === "cancelled") && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs"
                    onClick={() => onStatusChange?.(company.id, "available")}
                  >
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Reactivate
                  </Button>
                )}
                {company.status !== "cancelled" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs text-red-600 hover:text-red-700"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Company</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {company.companyName}? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Amendment History Modal */}
      <Dialog open={showAmendmentHistory} onOpenChange={setShowAmendmentHistory}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Amendment History</DialogTitle>
            <DialogDescription>
              {company.companyName} - {amendmentComments.length} amendment
              request{amendmentComments.length !== 1 ? "s" : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {amendmentComments.length > 0 ? (
              amendmentComments.map((comment, index) => (
                <div
                  key={comment.id || index}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-red-900">
                        Amendment #{amendmentComments.length - index}
                      </p>
                      <p className="text-xs text-red-700 mt-1">
                        {comment.text}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-xs text-red-600">
                    <Clock className="w-3 h-3" />
                    {new Date(comment.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </div>
                  {comment.author && (
                    <p className="text-xs text-red-600 mt-1">
                      By: {comment.author}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-600 text-center py-4">
                No amendment history available
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAmendmentHistory(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
