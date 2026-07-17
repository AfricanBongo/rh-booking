import { createClient } from "@/lib/supabase/server";

export interface Payment {
  id: string;
  amount: number;
  status: "succeeded" | "pending" | "failed";
  createdAt: string;
}

export interface BookingPaymentSummary {
  bookingId: string;
  conferenceId: string;
  totalPrice: number;
  amountPaid: number;
  remainingBalance: number;
  isPaidInFull: boolean;
}

export async function getBookingPaymentSummary(userId: string): Promise<BookingPaymentSummary | null> {
  const supabase = await createClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, conference_id, total_price, amount_paid")
    .eq("user_id", userId)
    .eq("status", "confirmed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!booking) return null;

  const remaining = booking.total_price - booking.amount_paid;

  return {
    bookingId: booking.id,
    conferenceId: booking.conference_id,
    totalPrice: booking.total_price,
    amountPaid: booking.amount_paid,
    remainingBalance: remaining,
    isPaidInFull: remaining <= 0,
  };
}

export async function getPaymentHistory(bookingId: string): Promise<Payment[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("payments")
    .select("id, amount, status, created_at")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: false });

  if (!data) return [];

  return data.map((p) => ({
    id: p.id,
    amount: p.amount,
    status: p.status,
    createdAt: p.created_at,
  }));
}
