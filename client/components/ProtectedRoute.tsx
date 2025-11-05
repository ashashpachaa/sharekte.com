import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "@/lib/user-context";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isUser, loading } = useUser();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
