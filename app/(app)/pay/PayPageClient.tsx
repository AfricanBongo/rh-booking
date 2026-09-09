"use client";

import { useState, useCallback } from "react";
import { usePaymentUpdates } from "@/lib/hooks/usePaymentUpdates";
import { PaymentCard } from "./PaymentCard";
import type { Payment } from "@/lib/data/payments";

interface Booking {
  id: string;
  conferenceName: string;
  totalPrice: number;
  amountPaid: number;
  payments: Payment[];
}

interface PayPageClientProps {
  userId: string;
  bookings: Booking[];
}

export function PayPageClient({ userId, bookings }: PayPageClientProps): React.ReactElement {
  const [overrides, setOverrides] = useState<Map<string, { amountPaid: number; totalPrice: number }>>(new Map());

  const handleRealtimeUpdate = useCallback((bookingId: string, amountPaid: number, totalPrice: number) => {
    setOverrides((prev) => new Map(prev).set(bookingId, { amountPaid, totalPrice }));
  }, []);

  usePaymentUpdates(userId, handleRealtimeUpdate);

  return (
    <div className="space-y-6 max-w-2xl">
      {bookings.map((booking) => {
        const override = overrides.get(booking.id);
        return (
          <PaymentCard
            key={booking.id}
            bookingId={booking.id}
            conferenceName={booking.conferenceName}
            totalPrice={override?.totalPrice ?? booking.totalPrice}
            amountPaid={override?.amountPaid ?? booking.amountPaid}
            payments={booking.payments}
          />
        );
      })}
    </div>
  );
}
