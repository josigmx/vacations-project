import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { API_URL, authHeaders, getErrorMessage } from "../utils/api";
import VacationForm from "../components/VacationForm";
import type { Vacation, VacationFormValues } from "../types/Vacation";

const EMPTY_VACATION: VacationFormValues = {
  destination: "",
  description: "",
  startDate: "",
  endDate: "",
  price: ""
};

export default function AddVacation() {
  const { token, logout } = useUser();
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string>("");

  async function addVacation(formData: FormData) {
    setSubmitting(true);
    setServerError("");
    try {
      // no "Content-Type" header — the browser sets multipart/form-data with its boundary by itself
      const response = await fetch(`${API_URL}/vacations`, {
        method: "POST",
        headers: authHeaders(token),
        body: formData
      });

      if (response.status === 401) {
        logout();
        return;
      }
      if (!response.ok) {
        setServerError(await getErrorMessage(response, "Failed to add the vacation"));
        return;
      }

      const vacation: Vacation = await response.json();
      navigate("/admin", { state: { message: `"${vacation.destination}" was added` } });
    } catch {
      setServerError("Cannot reach the server. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <VacationForm
        mode="add"
        initialValues={EMPTY_VACATION}
        submitting={submitting}
        serverError={serverError}
        onSubmit={addVacation}
        onCancel={() => navigate("/admin")}
      />
    </div>
  );
}
