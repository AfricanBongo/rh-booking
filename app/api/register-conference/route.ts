import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getConference } from "@/lib/data/conferences";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { conferenceId: unknown };
    const { conferenceId } = body;

    if (typeof conferenceId !== "string") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const conference = await getConference(conferenceId);

    const { error } = await supabase.from("conference_registrations").insert({
      user_id: user.id,
      conference_id: conferenceId,
      check_in: conference.checkIn,
      check_out: conference.checkOut,
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
