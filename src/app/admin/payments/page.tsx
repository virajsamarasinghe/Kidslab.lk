"use client";

import { useState } from "react";
import { AlertTriangle, CreditCard } from "lucide-react";
import { DataTable } from "@/components/admin/DataTable";
import { useListResource } from "@/hooks/useCrudResource";
import type { Payment } from "@/types/payment";
import type { PaymentStatus } from "@/lib/payhere";

const STATUS_STYLES: Record<PaymentStatus, { label: string; className: string }> = {
  success:     { label: "Paid",         className: "bg-green-50 text-green-700 ring-green-600/20" },
  pending:     { label: "Pending",      className: "bg-amber-50 text-amber-700 ring-amber-600/20" },
  failed:      { label: "Failed",       className: "bg-red-50 text-red-600 ring-red-600/20" },
  canceled:    { label: "Cancelled",    className: "bg-slate-100 text-slate-500 ring-slate-500/20" },
  chargedback: { label: "Charged back", className: "bg-red-100 text-red-700 ring-red-700/20" },
};

const FILTERS: { value: string; label: string }[] = [
  { value: "",            label: "All" },
  { value: "success",     label: "Paid" },
  { value: "pending",     label: "Pending" },
  { value: "failed",      label: "Failed" },
  { value: "chargedback", label: "Charged back" },
];

function money(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function AdminPayments() {
  const [status, setStatus] = useState("");

  const {
    items: payments, total, page, setPage, totalPages,
    search, setSearch, loading, error, reload, raw,
  } = useListResource<Payment>(
    `/api/payments${status ? `?status=${status}` : ""}`,
    { itemsKey: "payments" }
  );

  const revenue = (raw?.revenue as number) ?? 0;
  const needsAttention = (raw?.needsAttention as number) ?? 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1
          className="text-2xl font-bold text-slate-900 tracking-tight"
          style={{ fontFamily: "var(--font-display), var(--font-sans), system-ui, sans-serif" }}
        >
          Payments
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {total} transaction{total !== 1 ? "s" : ""} · {money(revenue, "LKR")} received
        </p>
      </div>

      {/* Paid but not enrolled: the one state that costs a customer if ignored. */}
      {needsAttention > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div className="text-sm">
            <p className="font-semibold text-amber-800">
              {needsAttention} paid {needsAttention === 1 ? "order needs" : "orders need"} fulfilment
            </p>
            <p className="mt-0.5 text-amber-700">
              Payment succeeded but enrolment or the receipt didn&apos;t complete. The
              reconciliation job retries these automatically every 15 minutes.
            </p>
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => { setStatus(f.value); setPage(1); }}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              status === f.value
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <DataTable
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search order, email or name…"
        total={total}
        itemLabel="payment"
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        loading={loading}
        error={error}
        onRetry={reload}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Order", "Customer", "Course", "Amount", "Status", "Date"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400">Loading…</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400">No payments yet</td></tr>
              ) : payments.map((p) => {
                const style = STATUS_STYLES[p.status] ?? STATUS_STYLES.failed;
                const unfulfilled = p.status === "success" && !p.fulfilledAt;
                return (
                  <tr key={p._id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-2 font-mono text-xs text-slate-500">
                        <CreditCard className="w-3.5 h-3.5 shrink-0 text-slate-300" />
                        {p.orderId}
                      </span>
                      {p.method && (
                        <span className="ml-5 block text-[11px] text-slate-400">{p.method}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="block font-semibold text-slate-900">{p.payerName || "—"}</span>
                      <span className="block text-xs text-slate-400">{p.payerEmail}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{p.itemName || "—"}</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900 whitespace-nowrap">
                      {money(p.amount, p.currency)}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${style.className}`}>
                        {style.label}
                      </span>
                      {unfulfilled && (
                        <span
                          className="ml-1.5 inline-block rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20"
                          title={p.fulfilmentError ?? "Awaiting fulfilment"}
                        >
                          Not enrolled
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleDateString("en-GB")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </DataTable>
    </div>
  );
}
