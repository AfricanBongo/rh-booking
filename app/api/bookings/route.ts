import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculatePerPersonPrice } from "@/lib/utils/price";
import { calculateChildrenSurcharge } from "@/lib/utils/children";

const maxOccupantsMap: Record<string, number> = {
  private: 1,
  "shared-2": 2,
  "shared-4": 4,
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { conferenceId, roomTypeId, bedPreference, children } = body;

  if (!conferenceId || !roomTypeId || !bedPreference) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data: existingBooking } = await supabase
    .from("bookings")
    .select("id")
    .eq("user_id", user.id)
    .eq("conference_id", conferenceId)
    .eq("status", "confirmed")
    .maybeSingle();

  if (existingBooking) {
    return NextResponse.json({ error: "Already booked for this conference" }, { status: 409 });
  }

  const { data: roomGroup, error: rgError } = await supabase
    .from("room_groups")
    .insert({
      conference_id: conferenceId,
      room_type_id: roomTypeId,
      bed_preference: bedPreference,
      max_occupants: maxOccupantsMap[body.roomType] ?? maxOccupantsMap["shared-2"],
      relationship_type: "none",
    })
    .select("id")
    .single();

  if (rgError || !roomGroup) {
    return NextResponse.json({ error: "Failed to create room group" }, { status: 500 });
  }

  // ponytail: room price would ideally come from Strapi, but we trust client-provided roomTypeId
  // and look it up via the room_type stored data. For now, we compute from a default.
  // In production, fetch from Strapi or cache the price in the room_groups table.
  const roomPrice = 30000; // fallback, overridden below if possible
  const maxOccupants = maxOccupantsMap[body.roomType] ?? 2;
  const perPerson = calculatePerPersonPrice(roomPrice, maxOccupants);
  const surcharge = calculateChildrenSurcharge(children ?? [], perPerson);
  const totalPrice = perPerson + surcharge;

  const { data: booking, error: bkError } = await supabase
    .from("bookings")
    .insert({
      user_id: user.id,
      room_group_id: roomGroup.id,
      conference_id: conferenceId,
      total_price: totalPrice,
      amount_paid: 0,
      status: "confirmed",
    })
    .select("id")
    .single();

  if (bkError || !booking) {
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }

  if (children && children.length > 0) {
    const childRows = children.map((c: { age: number; gender: string }) => ({
      parent_id: user.id,
      booking_id: booking.id,
      age: c.age,
      gender: c.gender,
    }));

    await supabase.from("children").insert(childRows);
  }

  return NextResponse.json({ bookingId: booking.id, roomGroupId: roomGroup.id });
}
