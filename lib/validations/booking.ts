import { z } from "zod";

export function createBookingSchema(conferenceStartDate: string, conferenceEndDate: string) {
  return z.object({
    check_in: z.string().date(),
    check_out: z.string().date(),
  }).refine((data) => data.check_in < data.check_out, {
    message: "Check-out must be after check-in",
    path: ["check_out"],
  }).refine((data) => data.check_in >= conferenceStartDate, {
    message: "Check-in cannot be before the conference start date",
    path: ["check_in"],
  }).refine((data) => data.check_out <= conferenceEndDate, {
    message: "Check-out cannot be after the conference end date",
    path: ["check_out"],
  });
}

export type BookingFormData = {
  check_in: string;
  check_out: string;
};
