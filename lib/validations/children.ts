import { z } from "zod";

export const childSchema = z.object({
  age: z.number().int().min(1, "Age must be at least 1").max(17, "Must be under 18"),
  gender: z.enum(["male", "female"], { message: "Gender is required" }),
});

export const childrenSchema = z.array(childSchema);

export type ChildFormData = z.infer<typeof childSchema>;
