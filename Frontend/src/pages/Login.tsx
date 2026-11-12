import { useState } from "react";
import type { SubmitEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { API_URL, getErrorMessage } from "../utils/api";
import { validateLogin } from "../utils/validation";
import { homePath } from "../utils/homePath";
import type { AuthResponse } from "../types/User";

export default function Login() {
  const { login } = useUser();
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    const credentials = { email: email.trim().toLowerCase(), password };

    const validationError = validateLogin(credentials.email, credentials.password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials)
      });

      if (!response.ok) {
        setError(await getErrorMessage(response, "Login failed"));
        return;
      }

      const data: AuthResponse = await response.json();
      login(data);
      navigate(homePath(data.user));
    } catch {
      setError("Cannot reach the server. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <h1>Login</h1>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        {error && <p className="form-error">{error}</p>}

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="switch-link">
          Don't have an account? <Link to="/register">Register now</Link>
        </p>
      </form>
    </div>
  );
}
