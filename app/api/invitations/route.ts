import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createInvitation, acceptInvitation, declineInvitation } from "@/lib/data/invitations";
import { validateGenderSharing } from "@/lib/utils/gender-validation";
import { getProfile } from "@/lib/data/profiles";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { roomGroupId, inviteeId, relationship } = body;

  if (!inviteeId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const [inviterProfile, inviteeProfile] = await Promise.all([
    getProfile(user.id),
    getProfile(inviteeId),
  ]);

  if (!inviterProfile || !inviteeProfile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const genderCheck = validateGenderSharing(
    inviterProfile.gender,
    inviteeProfile.gender,
    relationship
  );

  if (!genderCheck.allowed) {
    return NextResponse.json(
      { error: genderCheck.reason, requiresRelationship: genderCheck.requiresRelationship },
      { status: 422 }
    );
  }

  if (!roomGroupId) {
    return NextResponse.json({ error: "roomGroupId required" }, { status: 400 });
  }

  const invitation = await createInvitation({
    roomGroupId,
    inviterId: user.id,
    inviteeId,
    relationshipType: relationship,
  });

  return NextResponse.json({ invitation });
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { invitationId, action } = body;

  if (!invitationId || !action) {
    return NextResponse.json({ error: "Missing invitationId or action" }, { status: 400 });
  }

  if (action !== "accept" && action !== "decline") {
    return NextResponse.json({ error: "Action must be 'accept' or 'decline'" }, { status: 400 });
  }

  try {
    if (action === "accept") {
      await acceptInvitation(invitationId, user.id);
    } else {
      await declineInvitation(invitationId, user.id);
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to process invitation";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
