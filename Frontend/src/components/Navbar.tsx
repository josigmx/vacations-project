import { NavLink, useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

// The menu depends on who is logged in:
//   guest → Register · Login · About
//   user  → Vacations · AI Advisor · MCP Assistant · About
//   admin → Vacations (the admin page) · Add Vacation · Reports (+ CSV) · AI Advisor · MCP Assistant · About
export default function Navbar() {
  const { user, logout } = useUser();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav className="navbar">
      <span className="logo">🌴 Vacations</span>

      <div className="nav-links">
        {!user && (
          <>
            <NavLink to="/register">Register</NavLink>
            <NavLink to="/login">Login</NavLink>
          </>
        )}

        {user?.role === "user" && <NavLink to="/vacations">Vacations</NavLink>}

        {user?.role === "admin" && (
          <>
            <NavLink to="/admin" end>Vacations</NavLink>
            <NavLink to="/admin/add">Add Vacation</NavLink>
            <NavLink to="/admin/reports">Reports</NavLink>
          </>
        )}

        {user && (
          <>
            <NavLink to="/ai">AI Advisor</NavLink>
            <NavLink to="/mcp">MCP Assistant</NavLink>
          </>
        )}

        <NavLink to="/about">About</NavLink>
      </div>

      {user && (
        <div className="nav-user">
          <span className="user-name">
            👤 {user.firstName} {user.lastName}
            {user.role === "admin" && <span className="role-badge">Admin</span>}
          </span>
          <button className="btn btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      )}
    </nav>
  );
}
