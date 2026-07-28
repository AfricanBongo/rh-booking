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
  console.info("[stripe-checkout] Incoming request:", req.method, req.url);

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
    console.error("[stripe-checkout] Method not allowed:", req.method);
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const userId = req.headers.get("x-user-id");
  const userEmail = req.headers.get("x-user-email");

  if (!userId || !userEmail) {
    console.error("[stripe-checkout] Missing user context headers");
    return Response.json({ error: "Missing user context" }, { status: 401 });
  }

  const origin = req.headers.get("x-origin") || Deno.env.get("APP_URL") || "http://localhost:3000";
  console.info("[stripe-checkout] User:", userId, "| Email:", userEmail, "| Origin:", origin);

  try {
    const body = await req.json();
    const { type } = body;
    console.info("[stripe-checkout] Payment type:", type);

    if (type === "room_payment") {
      return await handleRoomPayment(body, userId, userEmail, origin);
    }

    if (type === "merch") {
      return await handleMerchPayment(body, userId, userEmail, origin);
    }

    console.error("[stripe-checkout] Invalid payment type:", type);
    return Response.json({ error: "Invalid payment type" }, { status: 400 });
  } catch (error) {
    console.error("[stripe-checkout] Unhandled error:", error instanceof Error ? error.message : error);
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
  console.info("[stripe-checkout:room] bookingId:", bookingId, "| amount:", amount);

  if (!bookingId || !amount) {
    console.error("[stripe-checkout:room] Missing bookingId or amount");
    return Response.json({ error: "Missing bookingId or amount" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("id, user_id, total_price, amount_paid, conference_id")
    .eq("id", bookingId)
    .single();

  if (error || !booking) {
    console.error("[stripe-checkout:room] Booking not found:", bookingId, error?.message);
    return Response.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.user_id !== userId) {
    console.error("[stripe-checkout:room] User mismatch: booking owner", booking.user_id, "!= requester", userId);
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const remainingBalance = booking.total_price - booking.amount_paid;
  console.info("[stripe-checkout:room] total:", booking.total_price, "| paid:", booking.amount_paid, "| remaining:", remainingBalance);

  const validation = validatePaymentAmount(amount, remainingBalance);

  if (!validation.success) {
    console.error("[stripe-checkout:room] Validation failed:", validation.error);
    return Response.json({ error: validation.error }, { status: 400 });
  }

  const customer = await getOrCreateStripeCustomer(userId, userEmail, supabase);
  console.info("[stripe-checkout:room] Stripe customer:", customer.id);

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

  console.info("[stripe-checkout:room] Session created:", session.id, "| URL:", session.url?.slice(0, 60));
  return Response.json({ url: session.url });
}

async function handleMerchPayment(
  body: { merchItemId: string; pickupLocationId: string; amount: number; merchItemName: string; merchItemSlug?: string },
  userId: string,
  userEmail: string,
  origin: string,
): Promise<Response> {
  const { merchItemId, pickupLocationId, amount, merchItemName, merchItemSlug } = body;
  console.info("[stripe-checkout:merch] item:", merchItemId, "| location:", pickupLocationId, "| amount:", amount, "| name:", merchItemName);

  if (!merchItemId || !pickupLocationId || !amount || !merchItemName) {
    console.error("[stripe-checkout:merch] Missing required fields");
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const customer = await getOrCreateStripeCustomer(userId, userEmail, supabase);
  console.info("[stripe-checkout:merch] Stripe customer:", customer.id);

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

  console.info("[stripe-checkout:merch] Session created:", session.id, "| URL:", session.url?.slice(0, 60));
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
    console.info("[stripe-checkout:customer] Found existing customer ID:", profile.stripe_customer_id);
    const existing = await stripe.customers.retrieve(profile.stripe_customer_id);
    if (!existing.deleted) return existing as Stripe.Customer;
    console.info("[stripe-checkout:customer] Existing customer was deleted, creating new");
  }

  console.info("[stripe-checkout:customer] Creating new Stripe customer for:", email);
  const customer = await stripe.customers.create({ email, metadata: { user_id: userId } });

  await supabase
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", userId);

  console.info("[stripe-checkout:customer] Created and saved:", customer.id);
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
