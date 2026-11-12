// The server address comes from .env (VITE_API_URL); localhost:3001 when it is not set
export const API_URL: string = import.meta.env.VITE_API_URL || "http://localhost:3001";

// The vacation image address on the server
export function imageUrl(fileName: string): string {
  return `${API_URL}/images/${fileName}`;
}

// The server's error message, or a default one when the body is not JSON
export async function getErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json();
    return data.message || fallback;
  } catch {
    return fallback;
  }
}

// The header every protected request sends: Authorization: Bearer <token>
export function authHeaders(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
