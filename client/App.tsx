import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import { CartProvider } from "@/lib/cart-context";
import { NotificationsProvider } from "@/lib/notifications-context";
import { CurrencyProvider } from "@/lib/currency-context";
import { AdminProvider } from "@/lib/admin-context";
import i18n from "@/lib/i18n";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Support from "./pages/Support";
import Companies from "./pages/Companies";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminOrders from "./pages/AdminOrders";
import AdminInvoices from "./pages/AdminInvoices";
import AdminSettings from "./pages/AdminSettings";
import AdminEmailTemplates from "./pages/AdminEmailTemplates";
import { AdminFees } from "./pages/AdminFees";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

export default function App() {
  return (
    <I18nextProvider i18n={i18n}>
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
                      <Route path="/login" element={<Login />} />
                      <Route path="/signup" element={<Signup />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/support" element={<Support />} />
                      <Route path="/companies" element={<Companies />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/admin/login" element={<AdminLogin />} />
                      <Route
                        path="/admin/dashboard"
                        element={<AdminDashboard />}
                      />
                      <Route path="/admin/users" element={<AdminUsers />} />
                      <Route path="/admin/orders" element={<AdminOrders />} />
                      <Route
                        path="/admin/invoices"
                        element={<AdminInvoices />}
                      />
                      <Route
                        path="/admin/settings"
                        element={<AdminSettings />}
                      />
                      <Route
                        path="/admin/email-templates"
                        element={<AdminEmailTemplates />}
                      />
                      <Route path="/admin/fees" element={<AdminFees />} />
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
    </I18nextProvider>
  );
}
