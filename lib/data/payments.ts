export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  status: "succeeded" | "pending" | "failed";
  createdAt: string;
}

export async function getPaymentHistory(bookingId: string): Promise<Payment[]> {
  void bookingId;
  throw new Error("not implemented");
}
