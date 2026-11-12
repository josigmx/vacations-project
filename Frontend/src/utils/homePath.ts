import type { User } from "../types/User";

// Where each user "lives": guest → Login · user → vacations · admin → the admin page
export function homePath(user: User | null): string {
  if (!user) return "/login";
  return user.role === "admin" ? "/admin" : "/vacations";
}
