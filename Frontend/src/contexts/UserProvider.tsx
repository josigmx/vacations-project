import { useCallback, useState } from "react";
import type { ReactNode } from "react";
import { UserContext } from "./UserContext";
import type { AuthResponse } from "../types/User";

const STORAGE_KEY = "vacations-auth";

// Reads the saved login when the site opens — so a refresh does not log the user out.
// try/catch: a broken value in localStorage must not crash the whole app.
function loadSavedAuth(): AuthResponse | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const auth = JSON.parse(saved) as AuthResponse;
    return auth.token && auth.user ? auth : null;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export default function UserProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthResponse | null>(loadSavedAuth);

  // useCallback = the same function on every render, so pages can use it inside useEffect safely
  const login = useCallback((newAuth: AuthResponse) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newAuth));
    setAuth(newAuth);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setAuth(null);
  }, []);

  return (
    <UserContext.Provider value={{ user: auth?.user ?? null, token: auth?.token ?? null, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}
