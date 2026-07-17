'use client';

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { createBookingSchema, type BookingFormData } from "@/lib/validations/booking";
import { PillButton } from "@/components/ui";

const HOUR_OPTIONS = [
  { value: "06", label: "6:00 AM" },
  { value: "07", label: "7:00 AM" },
  { value: "08", label: "8:00 AM" },
  { value: "09", label: "9:00 AM" },
  { value: "10", label: "10:00 AM" },
  { value: "11", label: "11:00 AM" },
  { value: "12", label: "12:00 PM" },
  { value: "13", label: "1:00 PM" },
  { value: "14", label: "2:00 PM" },
  { value: "15", label: "3:00 PM" },
  { value: "16", label: "4:00 PM" },
  { value: "17", label: "5:00 PM" },
  { value: "18", label: "6:00 PM" },
  { value: "19", label: "7:00 PM" },
  { value: "20", label: "8:00 PM" },
  { value: "21", label: "9:00 PM" },
  { value: "22", label: "10:00 PM" },
  { value: "23", label: "11:00 PM" },
];

interface RegistrationFormProps {
  conferenceId: string;
  conferenceStartDate: string;
  conferenceEndDate: string;
}

function getDateOnly(iso: string): string {
  return iso.slice(0, 10);
}

function getMinCheckInDate(conferenceStartDate: string): string {
  const d = new Date(conferenceStartDate);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function RegistrationForm({
  conferenceId,
  conferenceStartDate,
  conferenceEndDate,
}: RegistrationFormProps): React.ReactElement {
  const [serverError, setServerError] = useState<string | null>(null);
  const [checkInHour, setCheckInHour] = useState("14");
  const [checkOutHour, setCheckOutHour] = useState("11");

  const schema = createBookingSchema(conferenceStartDate, conferenceEndDate);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormData>({
    resolver: zodResolver(schema),
  });

  const minCheckIn = getMinCheckInDate(conferenceStartDate);
  const maxCheckIn = getDateOnly(conferenceStartDate);
  const minCheckOut = getDateOnly(conferenceEndDate);
  const maxCheckOut = getDateOnly(conferenceEndDate);

  const inputClasses = "w-full rounded-xl border border-border px-4 py-3 text-foreground bg-background focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all";

  async function onSubmit(data: BookingFormData): Promise<void> {
    setServerError(null);

    const checkInDateTime = new Date(`${data.check_in}T${checkInHour}:00:00`).toISOString();
    const checkOutDateTime = new Date(`${data.check_out}T${checkOutHour}:00:00`).toISOString();

    const res = await fetch("/api/register-conference", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conferenceId,
        checkIn: checkInDateTime,
        checkOut: checkOutDateTime,
      }),
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
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Check-in
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            id="check_in"
            type="date"
            min={minCheckIn}
            max={maxCheckIn}
            {...register("check_in")}
            className={inputClasses}
          />
          <select
            value={checkInHour}
            onChange={(e) => setCheckInHour(e.target.value)}
            className={inputClasses}
            aria-label="Check-in time"
          >
            {HOUR_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        {errors.check_in && (
          <p className="mt-1 text-sm text-danger">{errors.check_in.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Check-out
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            id="check_out"
            type="date"
            min={minCheckOut}
            max={maxCheckOut}
            {...register("check_out")}
            className={inputClasses}
          />
          <select
            value={checkOutHour}
            onChange={(e) => setCheckOutHour(e.target.value)}
            className={inputClasses}
            aria-label="Check-out time"
          >
            {HOUR_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        {errors.check_out && (
          <p className="mt-1 text-sm text-danger">{errors.check_out.message}</p>
        )}
      </div>

      {serverError && (
        <p className="text-sm text-danger">{serverError}</p>
      )}

      <PillButton type="submit" disabled={isSubmitting} fullWidth>
        {isSubmitting ? "Registering..." : "Register & Book Room"}
      </PillButton>
    </form>
  );
}
