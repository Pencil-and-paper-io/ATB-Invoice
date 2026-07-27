/** Shared date-range presets for invoice/quote directories. */

export type DateRangePreset =
  | "this_month"
  | "past_30"
  | "past_60"
  | "past_90"
  | "past_6_months"
  | "custom";

export type DateRangeValue = {
  preset: DateRangePreset;
  /** Inclusive start (local midnight). Used when preset is custom. */
  customStart: string | null;
  /** Inclusive end (local midnight). Used when preset is custom. */
  customEnd: string | null;
};

export const DEFAULT_DATE_RANGE: DateRangeValue = {
  preset: "this_month",
  customStart: null,
  customEnd: null,
};

export const DATE_RANGE_PRESETS: {
  id: DateRangePreset;
  label: string;
}[] = [
  { id: "this_month", label: "This Month" },
  { id: "past_30", label: "Past 30 Days" },
  { id: "past_60", label: "Past 60 Days" },
  { id: "past_90", label: "Past 90 Days" },
  { id: "past_6_months", label: "Past 6 Months" },
  { id: "custom", label: "Custom" },
];

/** Demo “today” so directory defaults match dashboard sample data. */
export const DIRECTORY_REFERENCE_NOW = new Date(2026, 6, 23);

export function parseDemoDate(value: string): Date | null {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );
}

export function resolveDateRangeBounds(
  range: DateRangeValue,
  now: Date = DIRECTORY_REFERENCE_NOW,
): { start: Date; end: Date } | null {
  const today = startOfDay(now);

  if (range.preset === "custom") {
    if (!range.customStart || !range.customEnd) return null;
    const start = startOfDay(new Date(`${range.customStart}T00:00:00`));
    const end = endOfDay(new Date(`${range.customEnd}T00:00:00`));
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
    return start <= end ? { start, end } : { start: end, end: start };
  }

  if (range.preset === "this_month") {
    return {
      start: new Date(today.getFullYear(), today.getMonth(), 1),
      end: endOfDay(today),
    };
  }

  const days =
    range.preset === "past_30"
      ? 30
      : range.preset === "past_60"
        ? 60
        : range.preset === "past_90"
          ? 90
          : 182; // ~6 months

  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));
  return { start: startOfDay(start), end: endOfDay(today) };
}

export function dateInRange(
  dateValue: string,
  range: DateRangeValue,
  now: Date = DIRECTORY_REFERENCE_NOW,
) {
  const bounds = resolveDateRangeBounds(range, now);
  if (!bounds) return true; // custom incomplete → don’t hide rows yet
  const date = parseDemoDate(dateValue);
  if (!date) return true;
  const time = date.getTime();
  return time >= bounds.start.getTime() && time <= bounds.end.getTime();
}

export function dateRangeLabel(range: DateRangeValue) {
  if (range.preset === "custom") {
    if (range.customStart && range.customEnd) {
      return `${range.customStart} – ${range.customEnd}`;
    }
    return "Custom";
  }
  return (
    DATE_RANGE_PRESETS.find((entry) => entry.id === range.preset)?.label ??
    "This Month"
  );
}
