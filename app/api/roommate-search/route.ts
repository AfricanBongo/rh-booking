import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchRoommates } from "@/lib/data/profiles";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const query = searchParams.get("q");
  const conferenceId = searchParams.get("conferenceId");

  if (!query || !conferenceId) {
    return NextResponse.json({ error: "Missing query or conferenceId" }, { status: 400 });
  }

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const results = await searchRoommates(query, conferenceId, user.id);
  return NextResponse.json({ results });
}
