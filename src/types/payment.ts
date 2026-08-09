import type { PaymentStatus } from "@/lib/payhere";

export interface Payment {
  _id: string;
  orderId: string;
  userId: string | null;
  courseId: string | null;
  itemName: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentId: string;
  statusCode: string;
  statusMessage: string;
  method: string;
  payerName: string;
  payerEmail: string;
  payerPhone: string;
  fulfilledAt?: string;
  fulfilmentAttempts?: number;
  fulfilmentError?: string;
  receiptSentAt?: string;
  createdAt: string;
}
