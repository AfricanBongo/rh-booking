import { CHILDREN_SURCHARGE_MULTIPLIER } from "@/lib/constants";

export interface ChildInput {
  age: number;
  gender: "male" | "female";
}

export function calculateChildrenSurcharge(children: ChildInput[], perPersonRate: number): number {
  const billableCount = children.filter((c) => c.age >= 12).length;
  return billableCount * perPersonRate * CHILDREN_SURCHARGE_MULTIPLIER;
}
