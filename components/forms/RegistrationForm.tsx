'use client';

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { createBookingSchema, type BookingFormData } from "@/lib/validations/booking";

interface RegistrationFormProps {
  conferenceId: string;
  conferenceStartDate: string;
  conferenceEndDate: string;
}

export function RegistrationForm({
  conferenceId,
  conferenceStartDate,
  conferenceEndDate,
}: RegistrationFormProps): React.ReactElement {
  const [serverError, setServerError] = useState<string | null>(null);

  const schema = createBookingSchema(conferenceStartDate, conferenceEndDate);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: BookingFormData): Promise<void> {
    setServerError(null);
    const res = await fetch("/api/register-conference", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conferenceId,
        checkIn: data.check_in,
        checkOut: data.check_out,
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
        <label htmlFor="check_in" className="block text-sm font-medium text-foreground mb-1.5">
          Check-in Date
        </label>
        <input
          id="check_in"
          type="date"
          min={conferenceStartDate}
          max={conferenceEndDate}
          {...register("check_in")}
          className="w-full rounded-lg border border-border px-4 py-3 text-foreground bg-background focus:ring-2 focus:ring-accent focus:border-accent outline-none"
        />
        {errors.check_in && (
          <p className="mt-1 text-sm text-danger">{errors.check_in.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="check_out" className="block text-sm font-medium text-foreground mb-1.5">
          Check-out Date
        </label>
        <input
          id="check_out"
          type="date"
          min={conferenceStartDate}
          max={conferenceEndDate}
          {...register("check_out")}
          className="w-full rounded-lg border border-border px-4 py-3 text-foreground bg-background focus:ring-2 focus:ring-accent focus:border-accent outline-none"
        />
        {errors.check_out && (
          <p className="mt-1 text-sm text-danger">{errors.check_out.message}</p>
        )}
      </div>

      {serverError && (
        <p className="text-sm text-danger">{serverError}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-accent text-accent-foreground rounded-lg px-6 py-3 font-medium hover:opacity-90 transition-opacity w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Registering..." : "Register & Book Room"}
      </button>
    </form>
  );
}
