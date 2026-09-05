import { z } from "zod";

export const additionalGuestSchema = z.object({
  age: z.number().int().min(0, "Age cannot be negative").max(99, "Age must be 99 or below"),
});

export const additionalGuestsSchema = z.array(additionalGuestSchema);

export type AdditionalGuestFormData = z.infer<typeof additionalGuestSchema>;

export const childSchema = additionalGuestSchema;
export const childrenSchema = additionalGuestsSchema;
export type ChildFormData = AdditionalGuestFormData;
