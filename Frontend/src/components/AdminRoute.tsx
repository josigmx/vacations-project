import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

// Admin only — a guest goes to Login, a regular user goes back to the vacations page.
// (The server checks the role again with adminMiddleware — the client check is only for the screen.)
export default function AdminRoute({ children }: { children: ReactNode }) {
  const { user } = useUser();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/vacations" replace />;

  return children;
}
