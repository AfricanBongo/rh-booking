import { z } from "zod";

export const additionalGuestSchema = z.object({
  age: z.number().int().min(1, "Age must be at least 1").max(17, "Must be under 18"),
  diningPassId: z.string().nullable(),
});

export const additionalGuestsSchema = z.array(additionalGuestSchema);

export type AdditionalGuestFormData = z.infer<typeof additionalGuestSchema>;

export const childSchema = additionalGuestSchema;
export const childrenSchema = additionalGuestsSchema;
export type ChildFormData = AdditionalGuestFormData;
