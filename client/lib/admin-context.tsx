import {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";

interface AdminContextType {
  isAdmin: boolean;
  adminEmail: string | null;
  adminToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  verifySession: () => Promise<boolean>;
  loading: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem("adminToken");
      const email = localStorage.getItem("adminEmail");

      if (token && email) {
        try {
          const response = await fetch("/api/admin/verify", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            setIsAdmin(true);
            setAdminEmail(email);
            setAdminToken(token);
          } else {
            // Token is invalid
            localStorage.removeItem("adminToken");
            localStorage.removeItem("adminEmail");
          }
        } catch (err) {
          console.error("Session verification error:", err);
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminEmail");
        }
      }

      setLoading(false);
    };

    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Login failed");
    }

    setIsAdmin(true);
    setAdminEmail(data.email);
    setAdminToken(data.token);
    localStorage.setItem("adminToken", data.token);
    localStorage.setItem("adminEmail", data.email);
  };

  const logout = async () => {
    try {
      if (adminToken) {
        await fetch("/api/admin/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setIsAdmin(false);
      setAdminEmail(null);
      setAdminToken(null);
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminEmail");
    }
  };

  const verifySession = async (): Promise<boolean> => {
    const token = localStorage.getItem("adminToken");

    if (!token) {
      return false;
    }

    try {
      const response = await fetch("/api/admin/verify", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  };

  return (
    <AdminContext.Provider
      value={{
        isAdmin,
        adminEmail,
        adminToken,
        login,
        logout,
        verifySession,
        loading,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within AdminProvider");
  }
  return context;
}
