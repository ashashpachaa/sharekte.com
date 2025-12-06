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
import { lazy, Suspense } from "react";
import Index from "./pages/Index";
import { ProtectedAdminRoute } from "./components/ProtectedAdminRoute";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { WhatsAppFloatingButton } from "./components/WhatsAppFloatingButton";

// Lazy load pages to reduce initial bundle size
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Support = lazy(() => import("./pages/Support"));
const Companies = lazy(() => import("./pages/Companies"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminOrders = lazy(() => import("./pages/AdminOrders"));
const AdminServices = lazy(() => import("./pages/AdminServices"));
const AdminCoupons = lazy(() => import("./pages/AdminCoupons"));
const AdminInvoices = lazy(() => import("./pages/AdminInvoices"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const AdminEmailTemplates = lazy(() => import("./pages/AdminEmailTemplates"));
const AdminRoles = lazy(() => import("./pages/AdminRoles"));
const AdminFees = lazy(() => import("./pages/AdminFees"));
const AdminSocialMedia = lazy(() => import("./pages/AdminSocialMedia"));
const AdminWallets = lazy(() => import("./pages/AdminWallets"));
const AdminWhatsAppSupport = lazy(() => import("./pages/AdminWhatsAppSupport"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const About = lazy(() => import("./pages/About"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

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
                      <Suspense fallback={<LoadingFallback />}>
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
                          <Route path="/about" element={<About />} />
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
                      </Suspense>
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
