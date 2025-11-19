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
import { UserProvider } from "@/lib/user-context";
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
import AdminServices from "./pages/AdminServices";
import AdminCoupons from "./pages/AdminCoupons";
import AdminInvoices from "./pages/AdminInvoices";
import AdminSettings from "./pages/AdminSettings";
import AdminEmailTemplates from "./pages/AdminEmailTemplates";
import AdminRoles from "./pages/AdminRoles";
import { AdminFees } from "./pages/AdminFees";
import AdminSocialMedia from "./pages/AdminSocialMedia";
import AdminWallets from "./pages/AdminWallets";
import AdminWhatsAppSupport from "./pages/AdminWhatsAppSupport";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import NotFound from "./pages/NotFound";
import { ProtectedAdminRoute } from "./components/ProtectedAdminRoute";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { WhatsAppFloatingButton } from "./components/WhatsAppFloatingButton";

const queryClient = new QueryClient();

export default function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AdminProvider>
            <UserProvider>
              <CurrencyProvider>
                <NotificationsProvider>
                  <CartProvider>
                    <Toaster />
                    <Sonner />
                    <BrowserRouter>
                      <WhatsAppFloatingButton />
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route
                          path="/dashboard"
                          element={
                            <ProtectedRoute>
                              <Dashboard />
                            </ProtectedRoute>
                          }
                        />
                        <Route path="/support" element={<Support />} />
                        <Route path="/companies" element={<Companies />} />
                        <Route
                          path="/privacy-policy"
                          element={<PrivacyPolicy />}
                        />
                        <Route
                          path="/terms-and-conditions"
                          element={<TermsAndConditions />}
                        />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/checkout" element={<Checkout />} />
                        {/* Admin Login Routes - Both work */}
                        <Route path="/admin/login" element={<AdminLogin />} />
                        <Route
                          path="/secure-admin-access-7k9m2q"
                          element={<AdminLogin />}
                        />
                        {/* Redirect /admin to /admin/dashboard */}
                        <Route
                          path="/admin"
                          element={
                            <ProtectedAdminRoute>
                              <AdminDashboard />
                            </ProtectedAdminRoute>
                          }
                        />
                        <Route
                          path="/admin/dashboard"
                          element={
                            <ProtectedAdminRoute>
                              <AdminDashboard />
                            </ProtectedAdminRoute>
                          }
                        />
                        <Route
                          path="/admin/users"
                          element={
                            <ProtectedAdminRoute>
                              <AdminUsers />
                            </ProtectedAdminRoute>
                          }
                        />
                        <Route
                          path="/admin/orders"
                          element={
                            <ProtectedAdminRoute>
                              <AdminOrders />
                            </ProtectedAdminRoute>
                          }
                        />
                        <Route
                          path="/admin/services"
                          element={
                            <ProtectedAdminRoute>
                              <AdminServices />
                            </ProtectedAdminRoute>
                          }
                        />
                        <Route
                          path="/admin/coupons"
                          element={
                            <ProtectedAdminRoute>
                              <AdminCoupons />
                            </ProtectedAdminRoute>
                          }
                        />
                        <Route
                          path="/admin/invoices"
                          element={
                            <ProtectedAdminRoute>
                              <AdminInvoices />
                            </ProtectedAdminRoute>
                          }
                        />
                        <Route
                          path="/admin/settings"
                          element={
                            <ProtectedAdminRoute>
                              <AdminSettings />
                            </ProtectedAdminRoute>
                          }
                        />
                        <Route
                          path="/admin/email-templates"
                          element={
                            <ProtectedAdminRoute>
                              <AdminEmailTemplates />
                            </ProtectedAdminRoute>
                          }
                        />
                        <Route
                          path="/admin/roles"
                          element={
                            <ProtectedAdminRoute>
                              <AdminRoles />
                            </ProtectedAdminRoute>
                          }
                        />
                        <Route
                          path="/admin/fees"
                          element={
                            <ProtectedAdminRoute>
                              <AdminFees />
                            </ProtectedAdminRoute>
                          }
                        />
                        <Route
                          path="/admin/social-media"
                          element={
                            <ProtectedAdminRoute>
                              <AdminSocialMedia />
                            </ProtectedAdminRoute>
                          }
                        />
                        <Route
                          path="/admin/wallets"
                          element={
                            <ProtectedAdminRoute>
                              <AdminWallets />
                            </ProtectedAdminRoute>
                          }
                        />
                        <Route
                          path="/admin/whatsapp-support"
                          element={
                            <ProtectedAdminRoute>
                              <AdminWhatsAppSupport />
                            </ProtectedAdminRoute>
                          }
                        />
                        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </BrowserRouter>
                  </CartProvider>
                </NotificationsProvider>
              </CurrencyProvider>
            </UserProvider>
          </AdminProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
}
