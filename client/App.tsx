import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/lib/cart-context";
import { NotificationsProvider } from "@/lib/notifications-context";
import { CurrencyProvider } from "@/lib/currency-context";
import { AdminProvider } from "@/lib/admin-context";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Support from "./pages/Support";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminSettings from "./pages/AdminSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AdminProvider>
          <CurrencyProvider>
            <NotificationsProvider>
              <CartProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/support" element={<Support />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/admin/settings" element={<AdminSettings />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
              </CartProvider>
            </NotificationsProvider>
          </CurrencyProvider>
        </AdminProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
