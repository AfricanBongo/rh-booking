import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, conference_id, total_price, amount_paid")
    .eq("user_id", user.id)
    .eq("status", "confirmed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!booking) {
    return NextResponse.json(null);
  }

  const remaining = booking.total_price - booking.amount_paid;

  return NextResponse.json({
    bookingId: booking.id,
    conferenceId: booking.conference_id,
    totalPrice: booking.total_price,
    amountPaid: booking.amount_paid,
    remainingBalance: remaining,
    isPaidInFull: remaining <= 0,
  });
}
