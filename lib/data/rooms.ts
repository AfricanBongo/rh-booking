export interface RoomType {
  id: string;
  name: string;
  description: string;
  capacity: number;
  pricePerNight: number;
  totalRooms: number;
  conferenceId: string;
}

export interface RoomAvailability {
  roomTypeId: string;
  totalRooms: number;
  bookedRooms: number;
  availableRooms: number;
}

export async function getRoomTypes(conferenceId: string): Promise<RoomType[]> {
  void conferenceId;
  throw new Error("not implemented");
}

export async function getRoomAvailability(
  conferenceId: string
): Promise<RoomAvailability[]> {
  void conferenceId;
  throw new Error("not implemented");
}
