import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createBookingSchema } from "@/lib/validations/booking";

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    conferenceId: unknown;
    checkIn: unknown;
    checkOut: unknown;
  };

  const { conferenceId, checkIn, checkOut } = body;

  if (
    typeof conferenceId !== "string" ||
    typeof checkIn !== "string" ||
    typeof checkOut !== "string"
  ) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const schema = createBookingSchema(checkIn, checkOut);
  const parsed = schema.safeParse({ check_in: checkIn, check_out: checkOut });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid dates" }, { status: 400 });
  }

  const { error } = await supabase.from("conference_registrations").insert({
    user_id: user.id,
    conference_id: conferenceId,
    check_in: checkIn,
    check_out: checkOut,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Already registered" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to register" }, { status: 500 });
  }

  return NextResponse.json({ success: true, redirectTo: `/book/${conferenceId}` });
}
