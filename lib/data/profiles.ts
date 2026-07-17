import { createClient } from "@/lib/supabase/server";
import { detectSearchType, applySearchPrivacy } from "@/lib/utils/search-privacy";

export interface Profile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  gender: "male" | "female";
  age: number;
  churchBranchId: string;
}

export interface ProfileUpdateData {
  fullName?: string;
  phone?: string;
  gender?: "male" | "female";
  age?: number;
  churchBranchId?: string;
}

export interface ChurchBranch {
  id: string;
  name: string;
}

export interface SearchResult {
  id: string;
  fullName: string;
  phone: string | null;
  gender: "male" | "female";
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    userId: data.id,
    fullName: data.full_name,
    email: "",
    phone: data.phone,
    gender: data.gender,
    age: data.age,
    churchBranchId: data.church_branch_id,
  };
}

export async function updateProfile(
  userId: string,
  data: ProfileUpdateData
): Promise<Profile | null> {
  const supabase = await createClient();

  const updatePayload: Record<string, unknown> = {};
  if (data.fullName !== undefined) updatePayload.full_name = data.fullName;
  if (data.phone !== undefined) updatePayload.phone = data.phone;
  if (data.gender !== undefined) updatePayload.gender = data.gender;
  if (data.age !== undefined) updatePayload.age = data.age;
  if (data.churchBranchId !== undefined)
    updatePayload.church_branch_id = data.churchBranchId;

  const { error } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("id", userId);

  if (error) return null;

  return getProfile(userId);
}

export async function fetchChurchBranches(): Promise<ChurchBranch[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("church_branches")
    .select("id, name")
    .order("name");

  if (error || !data) return [];
  return data;
}

export async function searchRoommates(
  query: string,
  conferenceId: string,
  currentUserId: string
): Promise<SearchResult[]> {
  const supabase = await createClient();
  const searchType = detectSearchType(query);

  const registeredQuery = supabase
    .from("conference_registrations")
    .select("user_id")
    .eq("conference_id", conferenceId);

  const { data: registered } = await registeredQuery;
  const registeredIds = (registered ?? []).map((r) => r.user_id as string);

  if (registeredIds.length === 0) return [];

  const { data: booked } = await supabase
    .from("bookings")
    .select("user_id")
    .eq("conference_id", conferenceId)
    .eq("status", "confirmed");

  const bookedIds = new Set((booked ?? []).map((b) => b.user_id as string));

  const eligibleIds = registeredIds.filter(
    (id) => id !== currentUserId && !bookedIds.has(id)
  );

  if (eligibleIds.length === 0) return [];

  let profileQuery = supabase
    .from("profiles")
    .select("id, full_name, phone, gender")
    .in("id", eligibleIds);

  if (searchType === "name") {
    profileQuery = profileQuery.ilike("full_name", `%${query}%`);
  } else {
    const cleanPhone = query.replace(/[\s\-().+]/g, "");
    profileQuery = profileQuery.ilike("phone", `%${cleanPhone}%`);
  }

  const { data: profiles } = await profileQuery.limit(10);

  if (!profiles) return [];

  return profiles.map((p) =>
    applySearchPrivacy(
      { id: p.id, fullName: p.full_name, phone: p.phone, gender: p.gender },
      searchType
    )
  );
}
