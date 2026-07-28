'use client';

import { useState } from "react";
import { PillButton } from "@/components/ui";
import { WarningCircleIcon, CalendarIcon } from "@phosphor-icons/react";

interface RegistrationFormProps {
  conferenceId: string;
  conferenceCheckIn: string;
  conferenceCheckOut: string;
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function RegistrationForm({
  conferenceId,
  conferenceCheckIn,
  conferenceCheckOut,
}: RegistrationFormProps): React.ReactElement {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRegister(): Promise<void> {
    setServerError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/register-conference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conferenceId }),
      });

      if (res.ok) {
        const json = (await res.json()) as { redirectTo: string };
        window.location.href = json.redirectTo;
        return;
      }

      if (res.status === 409) {
        setServerError("You are already registered for this conference.");
        return;
      }

      if (res.status === 401) {
        window.location.href = `/auth/login?returnUrl=/conferences/${conferenceId}`;
        return;
      }

      setServerError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-surface-secondary p-4 space-y-3">
        <div className="flex items-center gap-2.5">
          <CalendarIcon size={16} weight="duotone" className="text-accent shrink-0" />
          <div>
            <p className="text-xs text-muted">Check-in</p>
            <p className="text-sm font-medium">{formatDateTime(conferenceCheckIn)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <CalendarIcon size={16} weight="duotone" className="text-accent shrink-0" />
          <div>
            <p className="text-xs text-muted">Check-out</p>
            <p className="text-sm font-medium">{formatDateTime(conferenceCheckOut)}</p>
          </div>
        </div>
      </div>

      {serverError && (
        <div className="flex items-start gap-2.5 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3" role="alert">
          <WarningCircleIcon size={18} weight="duotone" className="text-danger shrink-0 mt-0.5" />
          <p className="text-sm text-danger">{serverError}</p>
        </div>
      )}

      <PillButton onClick={handleRegister} disabled={isSubmitting} fullWidth>
        {isSubmitting ? "Registering..." : "Register & Book Room"}
      </PillButton>
    </div>
  );
}
