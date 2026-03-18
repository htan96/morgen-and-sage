/**
 * Display timezone for the application (Pacific).
 * Use when formatting dates/times shown to users.
 */
export const DISPLAY_TIMEZONE = "America/Los_Angeles";

const pacificOptions: Intl.DateTimeFormatOptions = {
  timeZone: DISPLAY_TIMEZONE,
};

export function formatDateTimePacific(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
  }
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", { ...pacificOptions, ...options });
}

export function formatDatePacific(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    ...pacificOptions,
    dateStyle: "medium",
  });
}

export function formatTimePacific(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-US", {
    ...pacificOptions,
    hour: "2-digit",
    minute: "2-digit",
  });
}
