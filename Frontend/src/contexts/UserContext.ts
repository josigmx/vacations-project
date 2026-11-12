import { createContext, useContext } from "react";
import type { AuthResponse, User } from "../types/User";

export interface UserContextType {
  user: User | null;
  token: string | null;
  login: (auth: AuthResponse) => void;
  logout: () => void;
}

// The logged-in user, shared with the whole app (the provider is in UserProvider.tsx)
export const UserContext = createContext<UserContextType | null>(null);

// Any component calls useUser() to get the logged-in user and login / logout
export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used inside UserProvider");
  return context;
}
