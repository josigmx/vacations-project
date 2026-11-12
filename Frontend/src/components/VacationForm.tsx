import { useEffect, useState } from "react";
import type { ChangeEvent, SubmitEvent } from "react";
import { todayInput } from "../utils/format";
import { validateVacationForm, IMAGE_TYPES } from "../utils/validation";
import type { VacationFormValues } from "../types/Vacation";

interface VacationFormProps {
  mode: "add" | "edit";
  initialValues: VacationFormValues;
  currentImageUrl?: string;                       // edit: the image the vacation has now
  submitting: boolean;
  serverError: string;
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
}

// One form for Add and Edit. The differences:
//   add  → the image is required, dates cannot be in the past
//   edit → the image is optional (the current one is shown), past dates are allowed
export default function VacationForm({ mode, initialValues, currentImageUrl, submitting, serverError, onSubmit, onCancel }: VacationFormProps) {
  const isAdd = mode === "add";

  const [values, setValues] = useState<VacationFormValues>(initialValues);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [error, setError] = useState<string>("");

  // the preview is a temporary URL to the chosen file in memory —
  // release the old one when a new file is chosen or the form closes
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setValues({ ...values, [e.target.name]: e.target.value });
  }

  function handleImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImage(file);
    setPreview(file ? URL.createObjectURL(file) : "");
  }

  function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    const validationError = validateVacationForm(values, image, isAdd);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");

    // multipart form: the text fields + the file, in one request
    const formData = new FormData();
    formData.append("destination", values.destination.trim());
    formData.append("description", values.description.trim());
    formData.append("startDate", values.startDate);
    formData.append("endDate", values.endDate);
    formData.append("price", values.price);
    if (image) formData.append("image", image);

    onSubmit(formData);
  }

  // the date fields themselves block the days that are not allowed
  const minStart = isAdd ? todayInput() : undefined;
  const minEnd = values.startDate || minStart;
  const shownImage = preview || currentImageUrl;

  return (
    <form className="vacation-form" onSubmit={handleSubmit} noValidate>
      <h1>{isAdd ? "Add Vacation" : "Edit Vacation"}</h1>

      <div className="field">
        <label htmlFor="destination">Destination</label>
        <input id="destination" name="destination" value={values.destination} onChange={handleChange} required />
      </div>

      <div className="field">
        <label htmlFor="description">Description</label>
        <textarea id="description" name="description" rows={4} value={values.description} onChange={handleChange} required />
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="startDate">Start date</label>
          <input id="startDate" name="startDate" type="date" min={minStart} value={values.startDate} onChange={handleChange} required />
        </div>

        <div className="field">
          <label htmlFor="endDate">End date</label>
          <input id="endDate" name="endDate" type="date" min={minEnd} value={values.endDate} onChange={handleChange} required />
        </div>
      </div>

      <div className="field">
        <label htmlFor="price">Price</label>
        <div className="price-input">
          <span>$</span>
          <input id="price" name="price" type="number" min={0} max={10000} step="0.01" value={values.price} onChange={handleChange} required />
        </div>
        <small className="hint">Between $0 and $10,000</small>
      </div>

      <div className="field">
        <span className="field-label">Cover image{!isAdd && " (optional)"}</span>
        <label className={shownImage ? "image-picker has-image" : "image-picker"}>
          {shownImage && <img src={shownImage} alt="Vacation cover" />}
          <span className="image-picker-text">{shownImage ? "Change image" : "Select image"}</span>
          <input type="file" accept={IMAGE_TYPES.join(",")} onChange={handleImage} />
        </label>
        {image && <small className="hint">{image.name}</small>}
      </div>

      {(error || serverError) && <p className="form-error">{error || serverError}</p>}

      <button className="btn btn-primary" type="submit" disabled={submitting}>
        {submitting ? "Saving..." : isAdd ? "Add Vacation" : "Update"}
      </button>
      <button className="btn btn-light" type="button" onClick={onCancel} disabled={submitting}>
        Cancel
      </button>
    </form>
  );
}
