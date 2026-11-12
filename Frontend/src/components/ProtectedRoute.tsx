import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

// Every logged-in user (user or admin) — a guest is sent to the Login page
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useUser();

  if (!user) return <Navigate to="/login" replace />;

  return children;
}
