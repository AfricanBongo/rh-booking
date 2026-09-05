export interface ChildInput {
  age: number;
}

export type GuestInput = ChildInput;
export const calculateChildrenSurcharge = (): number => 0;
export const calculateGuestSurcharge = calculateChildrenSurcharge;
