import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getConference } from "@/lib/data/conferences";
import { getPaymentHistory } from "@/lib/data/payments";
import { PillButton } from "@/components/ui";
import { CurrencyDollarIcon, MegaphoneIcon } from "@phosphor-icons/react/dist/ssr";
import { PaymentCard } from "./PaymentCard";

interface BookingRow {
  id: string;
  conference_id: string;
  total_price: number;
  amount_paid: number;
  status: string;
}

export default async function PayPage(): Promise<React.ReactElement> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, conference_id, total_price, amount_paid, status")
    .eq("user_id", user.id)
    .eq("status", "confirmed")
    .order("created_at", { ascending: false });

  const rows = (bookings ?? []) as BookingRow[];

  const bookingsWithNames = await Promise.all(
    rows.map(async (booking) => {
      let conferenceName = "Conference";
      try {
        const conf = await getConference(booking.conference_id);
        conferenceName = conf.name;
      } catch { /* noop */ }
      const payments = await getPaymentHistory(booking.id);
      return { ...booking, conferenceName, payments };
    })
  );

  if (bookingsWithNames.length === 0) {
    return (
      <main className="px-6 md:px-8 py-8 animate-fade-up">
        <h1 className="font-heading text-2xl font-semibold mb-1">Payments</h1>
        <p className="text-muted text-sm mb-8">Manage payments for your conference bookings</p>
        <div className="border border-border bg-surface rounded-2xl p-12 text-center">
          <CurrencyDollarIcon size={48} weight="thin" className="mx-auto text-border mb-4" />
          <h2 className="font-heading text-xl font-semibold mb-2">No active bookings</h2>
          <p className="text-muted mb-6">Once you book a room, you can manage payments here.</p>
          <PillButton href="/dashboard/conferences">Browse Conferences</PillButton>
        </div>
      </main>
    );
  }

  return (
    <main className="px-6 md:px-8 py-8 animate-fade-up">
      <div className="flex items-center gap-3 mb-1">
        <CurrencyDollarIcon size={28} weight="duotone" className="text-accent" />
        <h1 className="font-heading text-2xl font-semibold">Payments</h1>
      </div>
      <p className="text-muted text-sm mb-8">Manage payments for your conference bookings</p>

      <div className="space-y-6 max-w-2xl">
        {bookingsWithNames.map((booking) => (
          <PaymentCard
            key={booking.id}
            bookingId={booking.id}
            conferenceName={booking.conferenceName}
            totalPrice={booking.total_price}
            amountPaid={booking.amount_paid}
            userId={user.id}
            payments={booking.payments}
          />
        ))}
      </div>
    </main>
  );
}
