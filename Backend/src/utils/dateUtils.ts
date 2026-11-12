// A vacation date is a calendar day (no hour). We save every day as midnight UTC —
// the same value the browser's date field gives: new Date("2026-11-20") = 2026-11-20T00:00:00Z

// Today as a calendar day, in the same format
export function today(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

// A day relative to today (-3 = three days ago, 10 = in ten days)
export function daysFromToday(days: number): Date {
    const date = today();
    date.setUTCDate(date.getUTCDate() + days);
    return date;
}
