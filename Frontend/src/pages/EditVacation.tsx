import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { API_URL, authHeaders, getErrorMessage, imageUrl } from "../utils/api";
import { toDateInput } from "../utils/format";
import VacationForm from "../components/VacationForm";
import type { Vacation, VacationFormValues } from "../types/Vacation";

export default function EditVacation() {
  const { id } = useParams();
  const { token, logout } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  // back to the same filter + page of the admin list the Edit button was pressed on
  const backTo = `/admin${(location.state as { from?: string } | null)?.from ?? ""}`;

  const [vacation, setVacation] = useState<Vacation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string>("");

  useEffect(() => {
    let ignore = false;   // stale-response guard

    async function getVacation() {
      try {
        const response = await fetch(`${API_URL}/vacations/${id}`, { headers: authHeaders(token) });

        if (response.status === 401) {
          logout();
          return;
        }
        if (!response.ok) {
          const message = await getErrorMessage(response, "Failed to load the vacation");
          if (!ignore) setLoadError(message);
          return;
        }

        const data: Vacation = await response.json();
        if (!ignore) setVacation(data);
      } catch {
        if (!ignore) setLoadError("Failed to load the vacation");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    getVacation();

    return () => {
      ignore = true;
    };
  }, [id, token, logout]);

  async function updateVacation(formData: FormData) {
    setSubmitting(true);
    setServerError("");
    try {
      const response = await fetch(`${API_URL}/vacations/${id}`, {
        method: "PUT",
        headers: authHeaders(token),
        body: formData
      });

      if (response.status === 401) {
        logout();
        return;
      }
      if (!response.ok) {
        setServerError(await getErrorMessage(response, "Failed to update the vacation"));
        return;
      }

      const updated: Vacation = await response.json();
      navigate(backTo, { state: { message: `"${updated.destination}" was updated` } });
    } catch {
      setServerError("Cannot reach the server. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="page"><p className="status">Loading vacation...</p></div>;
  }

  if (loadError || !vacation) {
    return (
      <div className="page">
        <p className="status error">{loadError || "Vacation not found"}</p>
        <p className="status"><Link to="/admin">Back to the vacations</Link></p>
      </div>
    );
  }

  // the form gets strings: dates as "YYYY-MM-DD", the price as text
  const initialValues: VacationFormValues = {
    destination: vacation.destination,
    description: vacation.description,
    startDate: toDateInput(vacation.startDate),
    endDate: toDateInput(vacation.endDate),
    price: String(vacation.price)
  };

  return (
    <div className="page">
      <VacationForm
        mode="edit"
        initialValues={initialValues}
        currentImageUrl={imageUrl(vacation.imageFileName)}
        submitting={submitting}
        serverError={serverError}
        onSubmit={updateVacation}
        onCancel={() => navigate(backTo)}
      />
    </div>
  );
}
