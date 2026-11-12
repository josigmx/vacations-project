export type Role = "user" | "admin";

// The logged-in user, as the server returns it (never with the password)
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
}

// What the server returns after register / login
export interface AuthResponse {
  token: string;
  user: User;
}
