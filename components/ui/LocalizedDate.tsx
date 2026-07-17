'use client';

interface LocalizedDateProps {
  iso: string;
  showTime?: boolean;
}

export function LocalizedDate({ iso, showTime = true }: LocalizedDateProps): React.ReactElement {
  const date = new Date(iso);
  const formatted = showTime
    ? date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

  return <span>{formatted}</span>;
}

interface LocalizedDateRangeProps {
  startIso: string;
  endIso: string;
}

export function LocalizedDateRange({ startIso, endIso }: LocalizedDateRangeProps): React.ReactElement {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const startStr = start.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  const endStr = end.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  return <span>{startStr} – {endStr}</span>;
}
