import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";

export const registrationSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .refine((val) => isValidPhoneNumber(val), "Invalid phone number"),
  gender: z.enum(["male", "female"], {
    error: "Gender must be male or female",
  }),
  age: z.number().int().positive("Age must be a positive number"),
  church_branch_id: z.string().uuid("Invalid church branch"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export type RegistrationData = z.infer<typeof registrationSchema>;
export type LoginData = z.infer<typeof loginSchema>;
