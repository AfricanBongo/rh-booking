'use client';

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

function useIsClient(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

interface LocalizedDateProps {
  iso: string;
  showTime?: boolean;
}

export function LocalizedDate({ iso, showTime = true }: LocalizedDateProps): React.ReactElement {
  const isClient = useIsClient();
  const date = new Date(iso);

  const formatted = isClient
    ? (showTime
        ? date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
        : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }))
    : (showTime
        ? date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC" })
        : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }));

  return <span suppressHydrationWarning>{formatted}</span>;
}

interface LocalizedDateRangeProps {
  startIso: string;
  endIso: string;
}

export function LocalizedDateRange({ startIso, endIso }: LocalizedDateRangeProps): React.ReactElement {
  const isClient = useIsClient();
  const start = new Date(startIso);
  const end = new Date(endIso);
  const opts: Intl.DateTimeFormatOptions = isClient
    ? { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }
    : { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC" };
  const locale = isClient ? undefined : "en-US";
  const startStr = start.toLocaleString(locale, opts);
  const endStr = end.toLocaleString(locale, opts);

  return <span suppressHydrationWarning>{startStr} &ndash; {endStr}</span>;
}
