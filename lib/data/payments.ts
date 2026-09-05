import { createClient } from "@/lib/supabase/server";

export interface Payment {
  id: string;
  amount: number;
  method: "card" | "cash";
  status: "paid";
  paidAt: string;
  receiptUrl: string | null;
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

  const { data, error } = await supabase.rpc("get_booking_payment_history", {
    p_booking_id: bookingId,
  });

  if (error || !data) return [];

  return (data as Array<{
    id: string;
    amount: number;
    method: string;
    status: string;
    paid_at: string;
    receipt_url: string | null;
  }>).map((row) => ({
    id: row.id,
    amount: row.amount,
    method: row.method as "card" | "cash",
    status: "paid" as const,
    paidAt: row.paid_at,
    receiptUrl: row.receipt_url,
  }));
}
