import { CHILDREN_SURCHARGE_MULTIPLIER } from "@/lib/constants";

export interface GuestInput {
  age: number;
}

export function calculateGuestSurcharge(guests: GuestInput[], perPersonRate: number): number {
  const billableCount = guests.filter((g) => g.age >= 12).length;
  return billableCount * perPersonRate * CHILDREN_SURCHARGE_MULTIPLIER;
}

export type ChildInput = GuestInput;
export const calculateChildrenSurcharge = calculateGuestSurcharge;
