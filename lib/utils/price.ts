export function calculateRoomAvailability(totalAvailable: number, bookedCount: number): number {
  return totalAvailable - bookedCount;
}
