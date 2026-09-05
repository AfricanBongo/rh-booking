import { createClient } from "@/lib/supabase/server";

export interface RegistrationData {
  userId: string;
  conferenceId: string;
  checkIn: string;
  checkOut: string;
}

export async function registerForConference(data: RegistrationData): Promise<{ id: string }> {
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("conference_registrations")
    .insert({
      user_id: data.userId,
      conference_id: data.conferenceId,
      check_in: data.checkIn,
      check_out: data.checkOut,
    })
    .select("id")
    .single();

  if (error) throw error;
  return { id: row.id as string };
}
