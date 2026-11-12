import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useUser } from "./contexts/UserContext";
import { homePath } from "./utils/homePath";
import Navbar from "./components/Navbar";
import GuestRoute from "./components/GuestRoute";
import UserRoute from "./components/UserRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Vacations from "./pages/Vacations";
import AddVacation from "./pages/AddVacation";
import EditVacation from "./pages/EditVacation";
import AiRecommendation from "./pages/AiRecommendation";
import McpAssistant from "./pages/McpAssistant";
import About from "./pages/About";
import NotFound from "./pages/NotFound";

// The chart library is big — the Reports page (admin only) is downloaded only when it is opened
const Reports = lazy(() => import("./pages/Reports"));

function App() {
  const { user } = useUser();

  return (
    <>
      <Navbar />
      <Routes>
        {/* "/" → each user's main page: guest → Login · user → vacations · admin → admin page */}
        <Route path="/" element={<Navigate to={homePath(user)} replace />} />

        {/* guests only */}
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />

        {/* regular users only */}
        <Route path="/vacations" element={<UserRoute><Vacations /></UserRoute>} />

        {/* admin only */}
        <Route path="/admin" element={<AdminRoute><Vacations /></AdminRoute>} />
        <Route path="/admin/add" element={<AdminRoute><AddVacation /></AdminRoute>} />
        <Route path="/admin/edit/:id" element={<AdminRoute><EditVacation /></AdminRoute>} />
        <Route
          path="/admin/reports"
          element={
            <AdminRoute>
              <Suspense fallback={<div className="page"><p className="status">Loading report...</p></div>}>
                <Reports />
              </Suspense>
            </AdminRoute>
          }
        />

        {/* every logged-in user (user or admin) */}
        <Route path="/ai" element={<ProtectedRoute><AiRecommendation /></ProtectedRoute>} />
        <Route path="/mcp" element={<ProtectedRoute><McpAssistant /></ProtectedRoute>} />

        {/* everyone */}
        <Route path="/about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
