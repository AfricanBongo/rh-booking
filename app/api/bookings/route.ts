import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
  const {
    conferenceId, roomTypeId, bedPreference, children, roomPrice,
  } = body;

  if (!conferenceId || !roomTypeId || !bedPreference || typeof roomPrice !== "number") {
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

  const perPerson = roomPrice;
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
    const childRows = children.map((c: { age: number }) => ({
      parent_id: user.id,
      booking_id: booking.id,
      age: c.age,
    }));

    await supabase.from("children").insert(childRows);
  }

  return NextResponse.json({ bookingId: booking.id, roomGroupId: roomGroup.id });
}
