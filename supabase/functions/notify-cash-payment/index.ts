import { UseSend } from "usesend-js";

const usesendKey = Deno.env.get("USESEND_KEY")!;
const financeEmail = Deno.env.get("FINANCE_ADMIN_EMAIL")!;
const fromEmail = Deno.env.get("FROM_EMAIL") || "noreply@royalhousechurch.org";

const usesend = new UseSend(usesendKey);

interface CashPaymentNotification {
  userName: string;
  userEmail: string;
  amount: number;
  description: string;
  invoiceId: string;
  type: "room_payment" | "merch";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body: CashPaymentNotification = await req.json();
    const { userName, userEmail, amount, description, invoiceId, type } = body;

    const amountFormatted = `$${(amount / 100).toFixed(2)}`;
    const invoiceUrl = `https://dashboard.stripe.com/invoices/${invoiceId}`;
    const paymentType = type === "room_payment" ? "Room Payment" : "Merchandise";

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color: #1a1a2e; padding: 24px 32px;">
              <h1 style="margin: 0; color: #ffffff; font-size: 18px; font-weight: 600;">RoyalHouse Conferences</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px; color: #1a1a2e; font-size: 20px; font-weight: 600;">Cash Payment Request</h2>
              <p style="margin: 0 0 24px; color: #4a5568; font-size: 14px; line-height: 1.6;">
                A member has requested to pay in cash. Please verify receipt of funds and mark the invoice as paid in Stripe.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f7f8fa; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 8px 20px;">
                    <p style="margin: 0; color: #718096; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Member</p>
                    <p style="margin: 4px 0 0; color: #1a1a2e; font-size: 14px; font-weight: 500;">${userName} (${userEmail})</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 20px;">
                    <p style="margin: 0; color: #718096; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Amount</p>
                    <p style="margin: 4px 0 0; color: #1a1a2e; font-size: 20px; font-weight: 700;">${amountFormatted}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 20px;">
                    <p style="margin: 0; color: #718096; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Payment For</p>
                    <p style="margin: 4px 0 0; color: #1a1a2e; font-size: 14px; font-weight: 500;">${description}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 20px;">
                    <p style="margin: 0; color: #718096; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Type</p>
                    <p style="margin: 4px 0 0; color: #1a1a2e; font-size: 14px; font-weight: 500;">${paymentType}</p>
                  </td>
                </tr>
              </table>
              <a href="${invoiceUrl}" style="display: inline-block; background-color: #1a1a2e; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500;">View Invoice in Stripe</a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #a0aec0; font-size: 12px;">This is an automated notification from the RoyalHouse Booking Platform.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const text = `Cash Payment Request\n\nMember: ${userName} (${userEmail})\nAmount: ${amountFormatted}\nPayment For: ${description}\nType: ${paymentType}\n\nView Invoice: ${invoiceUrl}\n\nPlease verify receipt of funds and mark the invoice as paid in Stripe.`;

    await usesend.emails.send({
      to: financeEmail,
      from: fromEmail,
      subject: `Cash Payment Request - ${amountFormatted} from ${userName}`,
      html,
      text,
    });

    console.info("[notify-cash-payment] Email sent to:", financeEmail, "| Invoice:", invoiceId);
    return Response.json({ success: true });
  } catch (error) {
    console.error("[notify-cash-payment] Error:", error instanceof Error ? error.message : error);
    return Response.json({ error: "Failed to send notification" }, { status: 500 });
  }
});
