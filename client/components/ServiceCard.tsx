import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, Edit2, Trash2 } from "lucide-react";
import { ServiceData, formatServicePrice } from "@/lib/services";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCurrency } from "@/lib/currency-context";

interface ServiceCardProps {
  service: ServiceData;
  onAddToCart?: (service: ServiceData) => void;
  onEdit?: (service: ServiceData) => void;
  onDelete?: (id: string) => void;
  isAdmin?: boolean;
}

export function ServiceCard({
  service,
  onAddToCart,
  onEdit,
  onDelete,
  isAdmin = false,
}: ServiceCardProps) {
  const { convertPrice, formatPrice: formatWithCurrency } = useCurrency();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const convertedPrice =
    service.currency !== "USD"
      ? convertPrice(service.price)
      : service.price;

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(service);
    }
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        {service.imageUrl && (
          <div className="aspect-video overflow-hidden bg-gray-100">
            <img
              src={service.imageUrl}
              alt={service.name}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        )}
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{service.name}</CardTitle>
              <CardDescription className="text-sm mt-1">
                {service.description}
              </CardDescription>
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit?.(service)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 mt-3">
            <Badge variant="outline">{service.category}</Badge>
            {service.turnaroundDays && (
              <span className="flex items-center gap-1 text-xs text-gray-600">
                <Clock className="w-3 h-3" />
                {service.turnaroundDays} days
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Includes Section */}
          {service.includes.length > 0 && (
            <div>
              <p className="font-semibold text-sm mb-2">INCLUDES</p>
              <ul className="space-y-1">
                {service.includes.slice(0, 4).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Price Section */}
          <div className="border-t pt-4">
            <p className="text-2xl font-bold text-blue-600">
              {formatWithCurrency(convertedPrice, "USD")}
            </p>
            <p className="text-xs text-gray-600 mt-1">one-time</p>
          </div>

          {/* Action Button */}
          <Button
            onClick={handleAddToCart}
            className="w-full"
            disabled={service.status !== "active"}
          >
            + Add to Cart
          </Button>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Service</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{service.name}"? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onDelete?.(service.id);
                setShowDeleteDialog(false);
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
