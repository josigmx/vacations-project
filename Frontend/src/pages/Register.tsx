import { useState } from "react";
import type { SubmitEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { API_URL, getErrorMessage } from "../utils/api";
import { validateRegister } from "../utils/validation";
import { homePath } from "../utils/homePath";
import type { AuthResponse } from "../types/User";

export default function Register() {
  const { login } = useUser();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    // the values are cleaned once, here, and the same values are checked and sent
    const newUser = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      password
    };

    const validationError = validateRegister(newUser.firstName, newUser.lastName, newUser.email, newUser.password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser)
      });

      if (!response.ok) {
        setError(await getErrorMessage(response, "Registration failed"));
        return;
      }

      const data: AuthResponse = await response.json();
      login(data);                // registered = logged in
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
        <h1>Register</h1>

        <div className="field">
          <label htmlFor="firstName">First name</label>
          <input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </div>

        <div className="field">
          <label htmlFor="lastName">Last name</label>
          <input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </div>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <small className="hint">At least 4 characters</small>
        </div>

        {error && <p className="form-error">{error}</p>}

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>

        <p className="switch-link">
          Already a member? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}
