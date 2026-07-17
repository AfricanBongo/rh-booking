export function calculatePerPersonPrice(roomPriceCents: number, maxOccupants: number): number {
  return Math.floor(roomPriceCents / maxOccupants);
}

export function calculateRoomAvailability(totalAvailable: number, bookedCount: number): number {
  return totalAvailable - bookedCount;
}
