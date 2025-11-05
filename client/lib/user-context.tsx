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

      if (token && email) {
        try {
          const response = await fetch("/api/verify", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            setIsUser(true);
            setUserEmail(email);
            setUserName(name);
            setUserToken(token);
          } else {
            // Token is invalid
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

      let data;
      try {
        data = await response.json();
      } catch (e) {
        console.error("Failed to parse response:", e);
        throw new Error("Server returned an invalid response");
      }

      if (!response.ok) {
        throw new Error(data?.error || "Signup failed");
      }

      setIsUser(true);
      setUserEmail(data.email);
      setUserName(data.name);
      setUserToken(data.token);
      localStorage.setItem("userToken", data.token);
      localStorage.setItem("userEmail", data.email);
      localStorage.setItem("userName", data.name);
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

      let data;
      try {
        data = await response.json();
      } catch (e) {
        console.error("Failed to parse response:", e);
        throw new Error("Server returned an invalid response");
      }

      if (!response.ok) {
        throw new Error(data?.error || "Login failed");
      }

      setIsUser(true);
      setUserEmail(data.email);
      setUserName(data.name);
      setUserToken(data.token);
      localStorage.setItem("userToken", data.token);
      localStorage.setItem("userEmail", data.email);
      localStorage.setItem("userName", data.name);
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
