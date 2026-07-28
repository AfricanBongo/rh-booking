import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const MIN_PAYMENT_AMOUNT = 2500;

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function getSupabaseAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, x-user-id, x-user-email, x-origin",
      },
    });
  }

  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const userId = req.headers.get("x-user-id");
  const userEmail = req.headers.get("x-user-email");

  if (!userId || !userEmail) {
    return Response.json({ error: "Missing user context" }, { status: 401 });
  }

  const origin = req.headers.get("x-origin") || Deno.env.get("APP_URL") || "http://localhost:3000";

  try {
    const body = await req.json();
    const { type } = body;

    if (type === "room_payment") {
      return await handleRoomPayment(body, userId, userEmail, origin);
    }

    if (type === "merch") {
      return await handleMerchPayment(body, userId, userEmail, origin);
    }

    return Response.json({ error: "Invalid payment type" }, { status: 400 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Something went wrong" },
      { status: 500 },
    );
  }
});

async function handleRoomPayment(
  body: { bookingId: string; amount: number },
  userId: string,
  userEmail: string,
  origin: string,
): Promise<Response> {
  const { bookingId, amount } = body;

  if (!bookingId || !amount) {
    return Response.json({ error: "Missing bookingId or amount" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("id, user_id, total_price, amount_paid, conference_id")
    .eq("id", bookingId)
    .single();

  if (error || !booking) {
    return Response.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.user_id !== userId) {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const remainingBalance = booking.total_price - booking.amount_paid;
  const validation = validatePaymentAmount(amount, remainingBalance);

  if (!validation.success) {
    return Response.json({ error: validation.error }, { status: 400 });
  }

  const customer = await getOrCreateStripeCustomer(userId, userEmail, supabase);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customer.id,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: "Room Payment - Conference" },
          unit_amount: validation.data!.amount,
        },
        quantity: 1,
      },
    ],
    success_url: `${origin}/pay?success=true`,
    cancel_url: `${origin}/pay?cancelled=true`,
    metadata: {
      booking_id: bookingId,
      user_id: userId,
      type: "room_payment",
    },
  });

  return Response.json({ url: session.url });
}

async function handleMerchPayment(
  body: { merchItemId: string; pickupLocationId: string; amount: number; merchItemName: string; merchItemSlug?: string },
  userId: string,
  userEmail: string,
  origin: string,
): Promise<Response> {
  const { merchItemId, pickupLocationId, amount, merchItemName, merchItemSlug } = body;

  if (!merchItemId || !pickupLocationId || !amount || !merchItemName) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const customer = await getOrCreateStripeCustomer(userId, userEmail, supabase);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customer.id,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: merchItemName },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    success_url: `${origin}/dashboard/merch/orders?success=true`,
    cancel_url: `${origin}/dashboard/merch/${merchItemSlug || merchItemId}?cancelled=true`,
    metadata: {
      merch_item_id: merchItemId,
      pickup_location_id: pickupLocationId,
      user_id: userId,
      type: "merch",
    },
  });

  return Response.json({ url: session.url });
}

async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  supabase: ReturnType<typeof createClient>,
): Promise<Stripe.Customer> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();

  if (profile?.stripe_customer_id) {
    const existing = await stripe.customers.retrieve(profile.stripe_customer_id);
    if (!existing.deleted) return existing as Stripe.Customer;
  }

  const customer = await stripe.customers.create({ email, metadata: { user_id: userId } });

  await supabase
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", userId);

  return customer;
}

type PaymentValidation =
  | { success: true; data: { amount: number } }
  | { success: false; error: string };

function validatePaymentAmount(amount: number, remainingBalance: number): PaymentValidation {
  if (!Number.isInteger(amount)) {
    return { success: false, error: "Amount must be a whole number (cents)" };
  }
  if (amount < MIN_PAYMENT_AMOUNT) {
    return { success: false, error: `Minimum payment is $${MIN_PAYMENT_AMOUNT / 100}` };
  }
  if (amount > remainingBalance) {
    return { success: false, error: `Amount cannot exceed remaining balance of $${remainingBalance / 100}` };
  }
  return { success: true, data: { amount } };
}
