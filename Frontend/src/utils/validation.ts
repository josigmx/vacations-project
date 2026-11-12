import { todayInput } from "./format";
import type { VacationFormValues } from "../types/Vacation";

// The same rules the server checks — the client checks them first so the user sees the error at once
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD = 4;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

// Returns an error message, or "" when everything is fine
export function validateLogin(email: string, password: string): string {
  if (!email || !password) return "All fields are required";
  if (!isValidEmail(email)) return "Invalid email address";
  if (password.length < MIN_PASSWORD) return `Password must be at least ${MIN_PASSWORD} characters`;
  return "";
}

export function validateRegister(firstName: string, lastName: string, email: string, password: string): string {
  if (!firstName || !lastName || !email || !password) return "All fields are required";
  return validateLogin(email, password);
}

// ===== Add / edit vacation — the same rules as the server's validateVacation =====
export const MAX_PRICE = 10000;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_MB = 5;

// isAdd: the image is required and the dates cannot be in the past.
// "YYYY-MM-DD" strings compare correctly as text ("2026-11-03" < "2026-11-20").
export function validateVacationForm(values: VacationFormValues, image: File | null, isAdd: boolean): string {
  const { destination, description, startDate, endDate, price } = values;

  if (!destination.trim() || !description.trim() || !startDate || !endDate || price.trim() === "") {
    return "All fields are required";
  }

  const priceNumber = Number(price);
  if (!Number.isFinite(priceNumber)) return "Price must be a number";
  if (priceNumber < 0 || priceNumber > MAX_PRICE) return "Price must be between 0 and 10,000";

  if (endDate < startDate) return "End date cannot be before start date";
  if (isAdd && startDate < todayInput()) return "Dates cannot be in the past";

  if (isAdd && !image) return "Please choose an image";
  if (image && !IMAGE_TYPES.includes(image.type)) return "Only JPG, PNG or WEBP images are allowed";
  if (image && image.size > MAX_IMAGE_MB * 1024 * 1024) return `The image must be up to ${MAX_IMAGE_MB} MB`;

  return "";
}
