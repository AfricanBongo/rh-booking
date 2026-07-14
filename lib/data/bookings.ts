export interface Booking {
  id: string;
  userId: string;
  conferenceId: string;
  roomTypeId: string;
  status: "confirmed" | "cancelled" | "pending";
  createdAt: string;
}

export interface RegistrationData {
  userId: string;
  conferenceId: string;
  roomTypeId: string;
}

export async function getBooking(id: string): Promise<Booking> {
  void id;
  throw new Error("not implemented");
}

export async function getUserBooking(
  userId: string,
  conferenceId: string
): Promise<Booking | null> {
  void userId;
  void conferenceId;
  throw new Error("not implemented");
}

export async function registerForConference(
  data: RegistrationData
): Promise<Booking> {
  void data;
  throw new Error("not implemented");
}
