"use client";

import { useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function usePaymentUpdates(
  userId: string | null,
  onUpdate: (bookingId: string, amountPaid: number, totalPrice: number) => void,
): void {
  useEffect(() => {
    if (!userId) return;

    const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

    const channel = supabase
      .channel(`bookings:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "bookings",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const { id, amount_paid, total_price } = payload.new as {
            id: string;
            amount_paid: number;
            total_price: number;
          };
          onUpdate(id, amount_paid, total_price);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, onUpdate]);
}
