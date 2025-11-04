import { useState, useEffect } from "react";
import { fetchServiceOrders, type ServiceOrder } from "@/lib/services";
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
import { Eye, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ServiceOrderDetailsModal } from "./ServiceOrderDetailsModal";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export function ServiceOrdersTable() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await fetchServiceOrders();
      setOrders(data);
    } catch (error) {
      console.error("Failed to load service orders:", error);
      toast.error("Failed to load service orders");
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = (order: ServiceOrder) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const handleOrderUpdated = (updatedOrder: ServiceOrder) => {
    setOrders(orders.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
    setSelectedOrder(updatedOrder);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
      }).format(amount);
    } catch {
      return `${currency} ${amount}`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Order ID</TableHead>
              <TableHead>Customer Name</TableHead>
              <TableHead>Service Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <p className="text-muted-foreground">No service orders yet</p>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id} className="hover:bg-muted/50">
                  <TableCell className="font-mono text-sm">
                    {order.id}
                  </TableCell>
                  <TableCell className="font-medium">{order.customerName}</TableCell>
                  <TableCell>{order.serviceName}</TableCell>
                  <TableCell>
                    <Badge className={STATUS_COLORS[order.status] || "bg-gray-100"}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatAmount(order.amount, order.currency)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(order.purchaseDate)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewOrder(order)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedOrder && (
        <ServiceOrderDetailsModal
          order={selectedOrder}
          open={showDetailsModal}
          onOpenChange={setShowDetailsModal}
          onOrderUpdated={handleOrderUpdated}
        />
      )}
    </>
  );
}
