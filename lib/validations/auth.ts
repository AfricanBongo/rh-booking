import { z } from "zod";

const phoneRegex = /^[\d\s\-+().]{10,}$/;

function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 11;
}

export const registrationSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .regex(phoneRegex, "Invalid phone format")
    .refine(isValidPhone, "Phone must be 10-11 digits"),
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
