import mongoose, { Schema, Document } from "mongoose";
import type { PaymentStatus } from "@/lib/payhere";

/**
 * One attempted PayHere transaction.
 *
 * Created as `pending` when the checkout form is signed, then updated only by
 * the `notify_url` webhook — the browser's return trip proves nothing, since
 * anyone can open the success URL without paying.
 *
 * `amount` is copied from the Course at initiation and re-checked against the
 * amount PayHere reports, so a tampered client can't pay less than the price.
 */
export interface IPayment extends Document {
  orderId: string;
  userId?: mongoose.Types.ObjectId;
  courseId?: mongoose.Types.ObjectId;
  itemName: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  /** PayHere's own transaction id, present once a notification arrives. */
  paymentId: string;
  statusCode: string;
  statusMessage: string;
  /** e.g. VISA, MASTER, AMEX, EZCASH — as reported by PayHere. */
  method: string;
  payerName: string;
  payerEmail: string;
  payerPhone: string;
  /** Set once enrolment and receipt have both completed. Absent means still owed. */
  fulfilledAt?: Date;
  /**
   * Lease marker. Set when a worker starts fulfilling and cleared implicitly by
   * `fulfilledAt`; a stale value (older than the lease window) means a previous
   * attempt died mid-way and the work is up for grabs again.
   */
  fulfilmentStartedAt?: Date;
  fulfilmentAttempts: number;
  /** Last failure reason, for the admin dashboard to surface. */
  fulfilmentError?: string;
  /** Set once the receipt email is away, so a retry doesn't send a second one. */
  receiptSentAt?: Date;
  /**
   * Settlement figures from PayHere's Retrieval API — what actually reaches the
   * bank, as opposed to `amount`, which is what the customer was charged.
   *
   * Absent until the reconciliation sweep backfills them: PayHere's webhook
   * doesn't report its own fee, so gross is all we know at payment time.
   */
  feeAmount?: number;
  netAmount?: number;
  settlementSyncedAt?: Date;
  /** Full webhook body, kept verbatim for reconciliation and disputes. */
  rawNotification?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    orderId:       { type: String, required: true, unique: true, trim: true },
    userId:        { type: Schema.Types.ObjectId, ref: "User" },
    courseId:      { type: Schema.Types.ObjectId, ref: "Course" },
    itemName:      { type: String, default: "" },
    amount:        { type: Number, required: true },
    currency:      { type: String, default: "LKR" },
    status: {
      type: String,
      enum: ["pending", "success", "failed", "canceled", "chargedback"],
      default: "pending",
    },
    paymentId:     { type: String, default: "" },
    statusCode:    { type: String, default: "" },
    statusMessage: { type: String, default: "" },
    method:        { type: String, default: "" },
    payerName:     { type: String, default: "" },
    payerEmail:    { type: String, default: "" },
    payerPhone:    { type: String, default: "" },
    fulfilledAt:         { type: Date },
    fulfilmentStartedAt: { type: Date },
    fulfilmentAttempts:  { type: Number, default: 0 },
    fulfilmentError:     { type: String },
    receiptSentAt:       { type: Date },
    feeAmount:           { type: Number },
    netAmount:           { type: Number },
    settlementSyncedAt:  { type: Date },
    rawNotification: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

PaymentSchema.index({ createdAt: -1 });
PaymentSchema.index({ status: 1, createdAt: -1 });
PaymentSchema.index({ userId: 1, createdAt: -1 });
// Drives the reconciliation sweep: paid-but-unfulfilled, and long-stale pendings.
PaymentSchema.index({ status: 1, fulfilledAt: 1 });

export default mongoose.models.Payment as mongoose.Model<IPayment> ||
  mongoose.model<IPayment>("Payment", PaymentSchema);
