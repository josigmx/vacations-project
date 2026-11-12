import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

// Regular users only — a guest goes to Login, the admin goes to his own page
export default function UserRoute({ children }: { children: ReactNode }) {
  const { user } = useUser();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "user") return <Navigate to="/admin" replace />;

  return children;
}
