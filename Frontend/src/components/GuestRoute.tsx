import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { homePath } from "../utils/homePath";

// Register / Login are for guests — a logged-in user is sent to his main page
export default function GuestRoute({ children }: { children: ReactNode }) {
  const { user } = useUser();

  if (user) return <Navigate to={homePath(user)} replace />;

  return children;
}
