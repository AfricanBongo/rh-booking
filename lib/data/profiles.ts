import { createClient } from "@/lib/supabase/server";

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
