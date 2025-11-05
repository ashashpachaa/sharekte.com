import {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";

interface UserContextType {
  isUser: boolean;
  userEmail: string | null;
  userName: string | null;
  userToken: string | null;
  signup: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  verifySession: () => Promise<boolean>;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [isUser, setIsUser] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem("userToken");
      const email = localStorage.getItem("userEmail");
      const name = localStorage.getItem("userName");

      console.log("[checkSession] Checking for existing session...");
      console.log("[checkSession] Found token:", token ? "✓" : "✗");
      console.log("[checkSession] Found email:", email ? "✓" : "✗");
      console.log("[checkSession] Found name:", name ? "✓" : "✗");

      if (token && email) {
        try {
          console.log("[checkSession] Verifying token with /api/verify...");
          const response = await fetch("/api/verify", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          console.log("[checkSession] /api/verify response status:", response.status);
          if (response.ok) {
            console.log("[checkSession] ✓ Session verified, setting user state");
            setIsUser(true);
            setUserEmail(email);
            setUserName(name);
            setUserToken(token);
          } else {
            // Token is invalid
            console.log("[checkSession] ✗ Token verification failed, clearing session");
            localStorage.removeItem("userToken");
            localStorage.removeItem("userEmail");
            localStorage.removeItem("userName");
          }
        } catch (err) {
          console.error("Session verification error:", err);
          localStorage.removeItem("userToken");
          localStorage.removeItem("userEmail");
          localStorage.removeItem("userName");
        }
      }

      setLoading(false);
    };

    checkSession();
  }, []);

  const signup = async (email: string, password: string, name: string) => {
    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      let data: any = {};

      // Read response body once
      try {
        const responseText = await response.text();
        if (responseText) {
          data = JSON.parse(responseText);
        }
      } catch (e) {
        console.warn("Could not parse response body:", e);
      }

      if (!response.ok) {
        throw new Error(data?.error || `Signup failed`);
      }

      setIsUser(true);
      setUserEmail(data.email || email);
      setUserName(data.name || name);
      setUserToken(data.token || "");
      localStorage.setItem("userToken", data.token || "");
      localStorage.setItem("userEmail", data.email || email);
      localStorage.setItem("userName", data.name || name);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("An unexpected error occurred during signup");
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      let data: any = {};

      // Read response body once
      try {
        const responseText = await response.text();
        if (responseText) {
          data = JSON.parse(responseText);
        }
      } catch (e) {
        console.warn("Could not parse response body:", e);
      }

      if (!response.ok) {
        let errorMessage = data?.error || `Login failed`;
        // Include error code if available
        if (data?.code) {
          errorMessage += ` [${data.code}]`;
        }
        throw new Error(errorMessage);
      }

      console.log("[login] ✓ Login successful, saving to localStorage");
      console.log("[login] Response data:", { email: data.email, name: data.name, token: data.token ? "***" : "missing" });

      setIsUser(true);
      setUserEmail(data.email);
      setUserName(data.name);
      setUserToken(data.token || "");

      localStorage.setItem("userToken", data.token || "");
      localStorage.setItem("userEmail", data.email);
      localStorage.setItem("userName", data.name);

      console.log("[login] ✓ Stored in localStorage:");
      console.log("[login] userToken:", localStorage.getItem("userToken") ? "✓ set" : "✗ missing");
      console.log("[login] userEmail:", localStorage.getItem("userEmail"));
      console.log("[login] userName:", localStorage.getItem("userName"));
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("An unexpected error occurred during login");
    }
  };

  const logout = async () => {
    try {
      if (userToken) {
        await fetch("/api/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setIsUser(false);
      setUserEmail(null);
      setUserName(null);
      setUserToken(null);
      localStorage.removeItem("userToken");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userName");
    }
  };

  const verifySession = async (): Promise<boolean> => {
    const token = localStorage.getItem("userToken");

    if (!token) {
      return false;
    }

    try {
      const response = await fetch("/api/verify", {
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
    <UserContext.Provider
      value={{
        isUser,
        userEmail,
        userName,
        userToken,
        signup,
        login,
        logout,
        verifySession,
        loading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
}
