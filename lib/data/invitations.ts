export interface Invitation {
  id: string;
  senderId: string;
  recipientId: string;
  bookingId: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
}

export interface CreateInvitationData {
  senderId: string;
  recipientId: string;
  bookingId: string;
}

export async function getInvitations(userId: string): Promise<Invitation[]> {
  void userId;
  throw new Error("not implemented");
}

export async function createInvitation(
  data: CreateInvitationData
): Promise<Invitation> {
  void data;
  throw new Error("not implemented");
}

export async function acceptInvitation(id: string): Promise<Invitation> {
  void id;
  throw new Error("not implemented");
}

export async function declineInvitation(id: string): Promise<Invitation> {
  void id;
  throw new Error("not implemented");
}
