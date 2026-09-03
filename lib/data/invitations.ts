import { createClient } from "@/lib/supabase/server";

export interface Invitation {
  id: string;
  roomGroupId: string;
  inviterId: string;
  inviteeId: string;
  status: "pending" | "accepted" | "declined" | "expired";
  createdAt: string;
  inviterName?: string;
  inviteeName?: string;
  inviterGender?: "male" | "female";
  inviteeGender?: "male" | "female";
}

export interface CreateInvitationData {
  roomGroupId: string;
  inviterId: string;
  inviteeId: string;
  relationshipType?: "married" | "siblings" | "none";
}

export async function getInvitationsForUser(userId: string): Promise<Invitation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invitations")
    .select(`
      id, room_group_id, inviter_id, invitee_id, status, created_at,
      inviter:profiles!inviter_id(full_name, gender),
      invitee:profiles!invitee_id(full_name, gender)
    `)
    .or(`inviter_id.eq.${userId},invitee_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => {
    const inviter = Array.isArray(row.inviter) ? row.inviter[0] : row.inviter;
    const invitee = Array.isArray(row.invitee) ? row.invitee[0] : row.invitee;
    return {
      id: row.id,
      roomGroupId: row.room_group_id,
      inviterId: row.inviter_id,
      inviteeId: row.invitee_id,
      status: row.status,
      createdAt: row.created_at,
      inviterName: inviter?.full_name ?? undefined,
      inviteeName: invitee?.full_name ?? undefined,
      inviterGender: inviter?.gender ?? undefined,
      inviteeGender: invitee?.gender ?? undefined,
    };
  });
}

export async function getPendingInvitationsForUser(userId: string): Promise<Invitation[]> {
  const all = await getInvitationsForUser(userId);
  return all.filter((inv) => inv.inviteeId === userId && inv.status === "pending");
}

export async function createInvitation(data: CreateInvitationData): Promise<Invitation> {
  const supabase = await createClient();

  if (data.relationshipType && data.relationshipType !== "none") {
    await supabase
      .from("room_groups")
      .update({ relationship_type: data.relationshipType })
      .eq("id", data.roomGroupId);
  }

  const { data: row, error } = await supabase
    .from("invitations")
    .insert({
      room_group_id: data.roomGroupId,
      inviter_id: data.inviterId,
      invitee_id: data.inviteeId,
      status: "pending",
    })
    .select("id, room_group_id, inviter_id, invitee_id, status, created_at")
    .single();

  if (error) throw error;

  return {
    id: row.id,
    roomGroupId: row.room_group_id,
    inviterId: row.inviter_id,
    inviteeId: row.invitee_id,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function acceptInvitation(id: string, inviteeId: string): Promise<void> {
  const supabase = await createClient();

  const { data: invitation, error: fetchErr } = await supabase
    .from("invitations")
    .select("id, room_group_id, inviter_id, invitee_id")
    .eq("id", id)
    .eq("invitee_id", inviteeId)
    .eq("status", "pending")
    .single();

  if (fetchErr || !invitation) throw new Error("Invitation not found or already processed");

  const { data: roomGroup } = await supabase
    .from("room_groups")
    .select("id, conference_id, room_type_id, max_occupants")
    .eq("id", invitation.room_group_id)
    .single();

  if (!roomGroup) throw new Error("Room group not found");

  const { data: firstBooking } = await supabase
    .from("bookings")
    .select("total_price")
    .eq("room_group_id", roomGroup.id)
    .eq("status", "confirmed")
    .limit(1)
    .single();

  const perPersonPrice = firstBooking?.total_price ?? 0;

  await supabase
    .from("invitations")
    .update({ status: "accepted" })
    .eq("id", id);

  await supabase
    .from("bookings")
    .insert({
      user_id: inviteeId,
      room_group_id: roomGroup.id,
      conference_id: roomGroup.conference_id,
      total_price: perPersonPrice,
      amount_paid: 0,
      status: "confirmed",
    });
}

export async function declineInvitation(id: string, inviteeId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("invitations")
    .update({ status: "declined" })
    .eq("id", id)
    .eq("invitee_id", inviteeId)
    .eq("status", "pending");

  if (error) throw error;
}
