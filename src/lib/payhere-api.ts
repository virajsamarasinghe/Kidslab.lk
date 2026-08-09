import { payhereMode } from "@/lib/payhere";

/**
 * PayHere's Retrieval API — the authoritative record of what actually happened
 * to a payment (https://support.payhere.lk/api-&-mobile-sdk/retrieval-api).
 *
 * Used by the reconciliation sweep to close the webhook's blind spot: if the
 * `notify_url` call is lost — our host down, a deploy mid-flight, deployment
 * protection returning 401 — nothing else would ever tell us the customer paid.
 *
 * This uses a separate credential pair (App ID / App Secret, created under
 * PayHere → Integrations) from the Merchant ID / Merchant Secret that sign the
 * checkout.
 */

const API_BASE = {
  sandbox: "https://sandbox.payhere.lk",
  live: "https://www.payhere.lk",
} as const;

export function isRetrievalConfigured(): boolean {
  return Boolean(process.env.PAYHERE_APP_ID && process.env.PAYHERE_APP_SECRET);
}

/**
 * Access tokens last ~10 minutes. Cached in module scope so a sweep over many
 * orders performs one token exchange rather than one per order; the 60-second
 * safety margin avoids using a token that expires mid-flight.
 */
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;

  const appId = process.env.PAYHERE_APP_ID;
  const appSecret = process.env.PAYHERE_APP_SECRET;
  if (!appId || !appSecret) throw new Error("PayHere retrieval credentials are not set");

  const basic = Buffer.from(`${appId}:${appSecret}`).toString("base64");

  const res = await fetch(`${API_BASE[payhereMode()]}/merchant/v1/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`PayHere token request failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) throw new Error("PayHere token response had no access_token");

  const ttlSeconds = Math.max(30, (data.expires_in ?? 600) - 60);
  cachedToken = { value: data.access_token, expiresAt: Date.now() + ttlSeconds * 1000 };
  return cachedToken.value;
}

/** One payment record as PayHere reports it. */
export interface RetrievedPayment {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  /** RECEIVED · REFUND REQUESTED · REFUND PROCESSING · REFUNDED · CHARGEBACKED */
  status: string;
  method: string;
  /**
   * PayHere's own cut and what's left after it. Only this API reports them —
   * the webhook doesn't — which is why the dashboard can show true net income
   * only for payments the reconciliation sweep has backfilled.
   */
  fee: number | null;
  net: number | null;
}

/**
 * Looks up every payment PayHere holds for an order id.
 *
 * Returns an empty array when PayHere has no record — which is the normal
 * answer for an order the customer abandoned before entering card details,
 * and is deliberately not treated as an error.
 */
export async function retrievePayments(orderId: string): Promise<RetrievedPayment[]> {
  const token = await getAccessToken();

  const url = `${API_BASE[payhereMode()]}/merchant/v1/payment/search?order_id=${encodeURIComponent(orderId)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`PayHere retrieval failed for ${orderId}: ${res.status}`);
  }

  const body = (await res.json()) as {
    status?: number;
    data?: Array<{
      payment_id?: number | string;
      order_id?: string;
      amount?: number;
      currency?: string;
      status?: string;
      payment_method?: { method?: string };
      amount_detail?: { gross?: number; fee?: number; net?: number };
    }> | null;
  };

  // `status: -1` means "not found" rather than a transport failure.
  if (body.status !== 1 || !Array.isArray(body.data)) return [];

  return body.data.map((p) => ({
    paymentId: String(p.payment_id ?? ""),
    orderId: p.order_id ?? orderId,
    amount: Number(p.amount ?? 0),
    currency: p.currency ?? "",
    status: (p.status ?? "").toUpperCase(),
    method: p.payment_method?.method ?? "",
    // `null` rather than 0 — "PayHere didn't tell us" and "the fee was zero"
    // must not average into the same number on the dashboard.
    fee: typeof p.amount_detail?.fee === "number" ? p.amount_detail.fee : null,
    net: typeof p.amount_detail?.net === "number" ? p.amount_detail.net : null,
  }));
}

/**
 * Maps PayHere's textual retrieval status onto our own.
 *
 * The Retrieval API reports words (`RECEIVED`), while the webhook reports
 * numeric codes — the same underlying state in two vocabularies. Anything
 * unrecognised returns `null` so the caller leaves the record alone rather
 * than guessing.
 */
export function mapRetrievalStatus(status: string): "success" | "chargedback" | null {
  switch (status) {
    case "RECEIVED":
      return "success";
    case "CHARGEBACKED":
      return "chargedback";
    // Refund states are intentionally unmapped: the payment did succeed, and
    // the refund workflow is a separate concern this sweep shouldn't infer.
    default:
      return null;
  }
}
