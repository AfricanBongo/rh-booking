import { UseSend } from "usesend-js";
import { createClient } from "@supabase/supabase-js";

const usesendKey = Deno.env.get("USESEND_KEY")!;
const fromEmail = Deno.env.get("FROM_EMAIL") || "noreply@royalhousechurch.org";
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SECRET_KEYS = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")!);
const supabaseServiceKey = SUPABASE_SECRET_KEYS["default"];

const usesend = new UseSend(usesendKey);

interface InvoicePaidPayload {
  invoice_id: string;
  booking_id: string;
  amount: number;
  type: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body: InvoicePaidPayload = await req.json();
    const { invoice_id, booking_id, amount, type } = body;

    if (type !== "room_payment") {
      return Response.json({ skipped: true, reason: "not a room payment" });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: booking } = await supabase
      .from("bookings")
      .select("user_id, total_price, amount_paid")
      .eq("id", booking_id)
      .single();

    if (!booking) {
      console.warn("[notify-invoice-paid] Booking not found:", booking_id);
      return Response.json({ error: "Booking not found" }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", booking.user_id)
      .single();

    if (!profile?.email) {
      console.warn("[notify-invoice-paid] No email for user:", booking.user_id);
      return Response.json({ error: "No user email" }, { status: 404 });
    }

    const amountFormatted = `$${(amount / 100).toFixed(2)}`;
    const totalFormatted = `$${(booking.total_price / 100).toFixed(2)}`;
    const newAmountPaid = Math.min(booking.amount_paid + amount, booking.total_price);
    const remainingFormatted = `$${((booking.total_price - newAmountPaid) / 100).toFixed(2)}`;
    const isFullyPaid = newAmountPaid >= booking.total_price;

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f9fa;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <tr><td style="background-color:#1a1a2e;padding:24px 32px;">
          <h1 style="margin:0;color:#ffffff;font-size:18px;font-weight:600;">RoyalHouse Conferences</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:20px;font-weight:600;">Payment Confirmed</h2>
          <p style="margin:0 0 24px;color:#4a5568;font-size:14px;line-height:1.6;">
            Hi ${profile.full_name}, your cash payment of <strong>${amountFormatted}</strong> has been received and confirmed.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f8fa;border-radius:8px;padding:20px;margin-bottom:24px;">
            <tr><td style="padding:8px 20px;">
              <p style="margin:0;color:#718096;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Amount Received</p>
              <p style="margin:4px 0 0;color:#1a1a2e;font-size:20px;font-weight:700;">${amountFormatted}</p>
            </td></tr>
            <tr><td style="padding:8px 20px;">
              <p style="margin:0;color:#718096;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Booking Total</p>
              <p style="margin:4px 0 0;color:#1a1a2e;font-size:14px;font-weight:500;">${totalFormatted}</p>
            </td></tr>
            <tr><td style="padding:8px 20px;">
              <p style="margin:0;color:#718096;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">${isFullyPaid ? "Status" : "Remaining Balance"}</p>
              <p style="margin:4px 0 0;color:${isFullyPaid ? "#38a169" : "#1a1a2e"};font-size:14px;font-weight:500;">${isFullyPaid ? "Paid in Full" : remainingFormatted}</p>
            </td></tr>
          </table>
          ${!isFullyPaid ? '<p style="margin:0;color:#4a5568;font-size:13px;">You can make additional payments at any time from your booking dashboard.</p>' : '<p style="margin:0;color:#4a5568;font-size:13px;">Thank you for completing your payment. See you at the conference!</p>'}
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #e2e8f0;">
          <p style="margin:0;color:#a0aec0;font-size:12px;">RoyalHouse Booking Platform</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const text = `Payment Confirmed\n\nHi ${profile.full_name}, your cash payment of ${amountFormatted} has been received.\n\nBooking Total: ${totalFormatted}\n${isFullyPaid ? "Status: Paid in Full" : `Remaining: ${remainingFormatted}`}\n\nRoyalHouse Booking Platform`;

    await usesend.emails.send({
      to: profile.email,
      from: fromEmail,
      subject: `Payment Confirmed - ${amountFormatted} received`,
      html,
      text,
    });

    console.info("[notify-invoice-paid] Email sent to:", profile.email, "| Invoice:", invoice_id);
    return Response.json({ success: true });
  } catch (error) {
    console.error("[notify-invoice-paid] Error:", error instanceof Error ? error.message : error);
    return Response.json({ error: "Failed to send notification" }, { status: 500 });
  }
});
