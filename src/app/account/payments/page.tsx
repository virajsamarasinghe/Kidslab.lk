import Link from "next/link";
import { Receipt } from "lucide-react";
import { getAccountUser } from "@/lib/account";
import Payment from "@/models/Payment";
import type { PaymentStatus } from "@/lib/payhere";
import { Button } from "@/components/ui/button";

/** Colour and wording per status. `pending` deliberately reads as reassuring, not alarming. */
const STATUS_STYLES: Record<PaymentStatus, { label: string; className: string }> = {
  success:     { label: "Paid",        className: "bg-green-50 text-green-700 border-green-200" },
  pending:     { label: "Processing",  className: "bg-amber-50 text-amber-700 border-amber-200" },
  failed:      { label: "Failed",      className: "bg-red-50 text-red-600 border-red-200" },
  canceled:    { label: "Cancelled",   className: "bg-slate-50 text-slate-500 border-slate-200" },
  chargedback: { label: "Charged back", className: "bg-red-50 text-red-600 border-red-200" },
};

function formatMoney(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default async function AccountPaymentsPage() {
  const account = await getAccountUser();
  if (!account) return null;

  // `rawNotification` is excluded — it holds the card holder name and masked
  // card number PayHere echoes back, which this page has no reason to touch.
  const payments = await Payment.find({ userId: account._id })
    .select("orderId itemName amount currency status method createdAt")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  if (payments.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center">
        <Receipt className="mx-auto mb-4 h-10 w-10 text-slate-300" />
        <h2 className="mb-2 font-semibold" style={{ color: "var(--brand-navy)" }}>
          No payments yet
        </h2>
        <p className="mb-6 text-sm text-slate-400">
          Your receipts and order history will appear here once you enrol in a course.
        </p>
        <Link href="/#courses">
          <Button className="btn-brand-copper rounded-full px-8 text-white">
            Browse courses
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
      {/* Table on desktop; the same rows stack into cards on mobile, where a
          five-column table would either overflow or shrink past readability. */}
      <table className="hidden w-full text-left text-sm sm:table">
        <thead>
          <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
            <th className="px-6 py-4 font-medium">Order</th>
            <th className="px-6 py-4 font-medium">Course</th>
            <th className="px-6 py-4 font-medium">Date</th>
            <th className="px-6 py-4 text-right font-medium">Amount</th>
            <th className="px-6 py-4 text-right font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => {
            const style = STATUS_STYLES[p.status as PaymentStatus] ?? STATUS_STYLES.failed;
            return (
              <tr key={p.orderId} className="border-b border-slate-50 last:border-0">
                <td className="px-6 py-4 font-mono text-xs text-slate-400">{p.orderId}</td>
                <td className="px-6 py-4 font-medium text-slate-700">{p.itemName}</td>
                <td className="px-6 py-4 text-slate-500">
                  {new Date(p.createdAt).toLocaleDateString("en-LK", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </td>
                <td className="px-6 py-4 text-right font-medium text-slate-700">
                  {formatMoney(p.amount, p.currency)}
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`inline-block rounded-full border px-3 py-1 text-xs font-medium ${style.className}`}>
                    {style.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <ul className="divide-y divide-slate-50 sm:hidden">
        {payments.map((p) => {
          const style = STATUS_STYLES[p.status as PaymentStatus] ?? STATUS_STYLES.failed;
          return (
            <li key={p.orderId} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-700">{p.itemName}</p>
                  <p className="mt-0.5 font-mono text-xs text-slate-400">{p.orderId}</p>
                </div>
                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${style.className}`}>
                  {style.label}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-slate-500">
                  {new Date(p.createdAt).toLocaleDateString("en-LK", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </span>
                <span className="font-medium text-slate-700">
                  {formatMoney(p.amount, p.currency)}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
