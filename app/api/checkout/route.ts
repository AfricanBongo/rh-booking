import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { validatePaymentAmount } from "@/lib/validations/payment";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type } = body;
    const origin = getOrigin(request);

    if (type === "room_payment") {
      return await handleRoomPayment(body, user, supabase, origin);
    }

    if (type === "merch") {
      return await handleMerchPayment(body, user, supabase, origin);
    }

    return NextResponse.json({ error: "Invalid payment type" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}

function getOrigin(request: NextRequest): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  const host = request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "https";
  if (host) return `${proto}://${host}`;
  return new URL(request.url).origin;
}

async function handleRoomPayment(
  body: { bookingId: string; amount: number },
  user: { id: string; email?: string },
  supabase: Awaited<ReturnType<typeof createClient>>,
  origin: string,
): Promise<NextResponse> {
  const { bookingId, amount } = body;

  if (!bookingId || !amount) {
    return NextResponse.json({ error: "Missing bookingId or amount" }, { status: 400 });
  }

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("id, user_id, total_price, amount_paid, conference_id")
    .eq("id", bookingId)
    .single();

  if (error || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.user_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const remainingBalance = booking.total_price - booking.amount_paid;
  const validation = validatePaymentAmount(amount, remainingBalance);

  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const customer = await getOrCreateStripeCustomer(user.id, user.email!, supabase);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customer.id,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: "Room Payment - Conference" },
          unit_amount: validation.data.amount,
        },
        quantity: 1,
      },
    ],
    success_url: `${origin}/pay?success=true`,
    cancel_url: `${origin}/pay?cancelled=true`,
    metadata: {
      booking_id: bookingId,
      user_id: user.id,
      type: "room_payment",
    },
  });

  return NextResponse.json({ url: session.url });
}

async function handleMerchPayment(
  body: { merchItemId: string; pickupLocationId: string; amount: number; merchItemName: string; merchItemSlug?: string },
  user: { id: string; email?: string },
  supabase: Awaited<ReturnType<typeof createClient>>,
  origin: string,
): Promise<NextResponse> {
  const { merchItemId, pickupLocationId, amount, merchItemName, merchItemSlug } = body;

  if (!merchItemId || !pickupLocationId || !amount || !merchItemName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const customer = await getOrCreateStripeCustomer(user.id, user.email!, supabase);

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
      user_id: user.id,
      type: "merch",
    },
  });

  return NextResponse.json({ url: session.url });
}

async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
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
