import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export type AdminRole = "super-admin" | "moderator" | "support" | "viewer";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  createdAt: string;
  lastLogin?: string;
}

export interface LoginHistoryEntry {
  id: string;
  userId: string;
  timestamp: string;
  ipAddress: string;
  device: string;
  location?: string;
  userAgent: string;
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  phone?: string;
  company?: string;
  companyLinks: string[];
  accountStatus: "active" | "suspended" | "inactive";
  registrationDate: string;
  lastLoginDate?: string;
  notes?: string;
  invoices: string[];
  orders: string[];
  createdAt: string;
  updatedAt: string;
}

interface AdminContextType {
  currentAdmin: AdminUser | null;
  isAdmin: boolean;
  adminRole: AdminRole | null;
  setCurrentAdmin: (admin: AdminUser | null) => void;
  logout: () => void;
  canManageUsers: () => boolean;
  canSuspendUsers: () => boolean;
  canResetPasswords: () => boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(() => {
    try {
      const saved = localStorage.getItem("admin_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (currentAdmin) {
      localStorage.setItem("admin_user", JSON.stringify(currentAdmin));
    } else {
      localStorage.removeItem("admin_user");
    }
  }, [currentAdmin]);

  const logout = () => {
    setCurrentAdmin(null);
    localStorage.removeItem("admin_user");
  };

  const canManageUsers = () => {
    return currentAdmin?.role === "super-admin" || currentAdmin?.role === "moderator";
  };

  const canSuspendUsers = () => {
    return currentAdmin?.role === "super-admin";
  };

  const canResetPasswords = () => {
    return currentAdmin?.role === "super-admin" || currentAdmin?.role === "support";
  };

  const contextValue: AdminContextType = {
    currentAdmin,
    isAdmin: !!currentAdmin,
    adminRole: currentAdmin?.role || null,
    setCurrentAdmin,
    logout,
    canManageUsers,
    canSuspendUsers,
    canResetPasswords,
  };

  return (
    <AdminContext.Provider value={contextValue}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within AdminProvider");
  }
  return context;
}

export function useRequireAdmin() {
  const admin = useAdmin();
  if (!admin.isAdmin) {
    throw new Error("This page requires admin access");
  }
  return admin;
}
