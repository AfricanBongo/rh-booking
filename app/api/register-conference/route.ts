import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request): Promise<NextResponse> {
  try {
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

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }

    if (checkInDate >= checkOutDate) {
      return NextResponse.json({ error: "Check-out must be after check-in" }, { status: 400 });
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
      return NextResponse.json({ error: `Failed to register: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, redirectTo: `/book/${conferenceId}` });
  } catch (error) {
    console.error("[register-conference]", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Something went wrong" },
      { status: 500 },
    );
  }
}
