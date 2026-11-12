// A vacation date is a calendar day saved as midnight UTC — so it is shown in UTC,
// otherwise a browser in another time zone would show the day before.
export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${date.getUTCFullYear()}`;
}

// The value of an <input type="date"> ("YYYY-MM-DD") for a date from the server
export function toDateInput(isoDate: string): string {
  return isoDate.slice(0, 10);
}

// Today in the same "YYYY-MM-DD" format (the local calendar day — the same day the server uses)
export function todayInput(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

// 1931 → "$1,931.00"
const priceFormat = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function formatPrice(price: number): string {
  return priceFormat.format(price);
}
