import { z } from "zod";

export function createBookingSchema(conferenceStartDate: string, conferenceEndDate: string) {
  const startDateOnly = conferenceStartDate.slice(0, 10);
  const endDateOnly = conferenceEndDate.slice(0, 10);

  const minCheckIn = new Date(conferenceStartDate);
  minCheckIn.setDate(minCheckIn.getDate() - 1);
  const minCheckInDate = minCheckIn.toISOString().slice(0, 10);

  return z.object({
    check_in: z.string().date(),
    check_out: z.string().date(),
  }).refine((data) => data.check_in < data.check_out, {
    message: "Check-out must be after check-in",
    path: ["check_out"],
  }).refine((data) => data.check_in >= minCheckInDate, {
    message: "Check-in cannot be more than 1 day before the conference start",
    path: ["check_in"],
  }).refine((data) => data.check_out <= endDateOnly, {
    message: "Check-out cannot be after the conference end date",
    path: ["check_out"],
  });
}

export type BookingFormData = {
  check_in: string;
  check_out: string;
};
