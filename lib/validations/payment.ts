import { z } from "zod";
import { MIN_PAYMENT_AMOUNT } from "@/lib/constants";

function createPaymentSchema(remainingBalance: number): z.ZodObject<{ amount: z.ZodNumber }> {
  return z.object({
    amount: z
      .number()
      .int("Amount must be a whole number (cents)")
      .min(MIN_PAYMENT_AMOUNT, `Minimum payment is $${MIN_PAYMENT_AMOUNT / 100}`)
      .max(remainingBalance, `Amount cannot exceed remaining balance of $${remainingBalance / 100}`),
  });
}

export type PaymentValidation =
  | { success: true; data: { amount: number } }
  | { success: false; error: string };

export function validatePaymentAmount(
  amount: number,
  remainingBalance: number,
): PaymentValidation {
  const schema = createPaymentSchema(remainingBalance);
  const result = schema.safeParse({ amount });

  if (result.success) {
    return { success: true, data: { amount: result.data.amount } };
  }

  return { success: false, error: result.error.issues[0].message };
}
