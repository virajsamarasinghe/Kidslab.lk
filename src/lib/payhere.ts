import { createHash } from "crypto";
import { SITE_URL } from "@/config/site";

/**
 * PayHere Checkout (https://support.payhere.lk/api-&-mobile-sdk/checkout-api).
 *
 * The integration is a signed form POST to PayHere's hosted page, not a
 * server-to-server API call: we hand the browser a set of fields plus a `hash`
 * proving they came from us, and PayHere reports the outcome back to
 * `notify_url` out of band.
 *
 * Everything in this module is server-only — `PAYHERE_MERCHANT_SECRET` must
 * never reach the client, because anyone holding it can forge both a checkout
 * request and a payment notification.
 */

const CHECKOUT_URLS = {
  sandbox: "https://sandbox.payhere.lk/pay/checkout",
  live: "https://www.payhere.lk/pay/checkout",
} as const;

export type PayHereMode = keyof typeof CHECKOUT_URLS;

/** Sandbox unless explicitly set to `live` — a misconfigured env must never charge real cards. */
export function payhereMode(): PayHereMode {
  return process.env.PAYHERE_MODE === "live" ? "live" : "sandbox";
}

export function checkoutUrl(): string {
  return CHECKOUT_URLS[payhereMode()];
}

export function isPayHereConfigured(): boolean {
  return Boolean(process.env.PAYHERE_MERCHANT_ID && process.env.PAYHERE_MERCHANT_SECRET);
}

/**
 * Absolute origin for the return/cancel/notify URLs.
 *
 * PayHere requires absolute URLs, and `notify_url` is called by PayHere's
 * servers — so this must be the public origin of *this* deployment. During
 * local development that means a tunnel (e.g. ngrok), never `localhost`, or
 * the callback silently never arrives.
 *
 * The fallback to {@link SITE_URL} is loud rather than silent: on a preview
 * deployment with the variable unset, quietly defaulting to the production
 * domain would aim PayHere's webhook at the live site, and the preview's
 * orders would be confirmed against production's database instead.
 */
export function appUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!configured) {
    console.warn(
      `[payhere] NEXT_PUBLIC_APP_URL is not set — falling back to ${SITE_URL}. ` +
        `PayHere will send its payment notification there, not to this deployment.`
    );
    return SITE_URL;
  }
  return configured.replace(/\/$/, "");
}

function md5Upper(value: string): string {
  return createHash("md5").update(value).digest("hex").toUpperCase();
}

/**
 * Amount as PayHere hashes it: exactly two decimals, dot separator, no
 * thousand separators. A mismatch here is the usual cause of PayHere's
 * "Unauthorized payment request" — the hash is computed over this exact
 * string, so the form must send the same one.
 */
export function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

function merchantSecret(): string {
  const secret = process.env.PAYHERE_MERCHANT_SECRET;
  if (!secret) throw new Error("PAYHERE_MERCHANT_SECRET is not set");
  return secret;
}

export function merchantId(): string {
  const id = process.env.PAYHERE_MERCHANT_ID;
  if (!id) throw new Error("PAYHERE_MERCHANT_ID is not set");
  return id;
}

/**
 * `hash` for the checkout form:
 * UPPER(MD5(merchant_id + order_id + amount + currency + UPPER(MD5(secret))))
 */
export function generateCheckoutHash(params: {
  orderId: string;
  amount: number;
  currency: string;
}): string {
  return md5Upper(
    merchantId() +
      params.orderId +
      formatAmount(params.amount) +
      params.currency +
      md5Upper(merchantSecret())
  );
}

/** Payment outcomes PayHere reports on `status_code`. */
export const PAYHERE_STATUS: Record<string, PaymentStatus> = {
  "2": "success",
  "0": "pending",
  "-1": "canceled",
  "-2": "failed",
  "-3": "chargedback",
};

export type PaymentStatus =
  | "pending"
  | "success"
  | "failed"
  | "canceled"
  | "chargedback";

export interface PayHereNotification {
  merchant_id: string;
  order_id: string;
  payment_id: string;
  payhere_amount: string;
  payhere_currency: string;
  status_code: string;
  md5sig: string;
  method?: string;
  status_message?: string;
  custom_1?: string;
  custom_2?: string;
}

/**
 * Confirms a notification really came from PayHere by recomputing its
 * signature:
 * UPPER(MD5(merchant_id + order_id + payhere_amount + payhere_currency +
 *           status_code + UPPER(MD5(secret))))
 *
 * `notify_url` is a public, unauthenticated endpoint, so this check is the
 * only thing standing between a stranger's POST and us marking an order paid.
 *
 * The amount and currency are hashed by PayHere as the strings it sent, so
 * they're used verbatim here rather than reformatted.
 */
export function verifyNotification(n: PayHereNotification): boolean {
  const expected = md5Upper(
    n.merchant_id +
      n.order_id +
      n.payhere_amount +
      n.payhere_currency +
      n.status_code +
      md5Upper(merchantSecret())
  );
  return expected === (n.md5sig ?? "").toUpperCase();
}

/**
 * Whether a payment may move from one status to another.
 *
 * PayHere's signed payload carries no nonce or timestamp, so a notification
 * stays cryptographically valid forever. Without this guard, anyone who
 * captured the earlier `status_code=-2` for an order could replay it after the
 * payment succeeded and flip a paid enrolment back to failed. Signature
 * verification alone cannot catch that — the replay is genuinely PayHere's
 * message, just no longer the current one.
 *
 * Settled states are therefore one-way. `success` accepts only a chargeback
 * (the one legitimate move out of it), and `chargedback` accepts nothing.
 * Everything else stays permissive: a `failed` order that later reports
 * success is a real recovery, and refusing it would deny a genuine payment.
 */
export function canTransition(from: PaymentStatus, to: PaymentStatus): boolean {
  if (from === to) return true;
  if (from === "chargedback") return false;
  if (from === "success") return to === "chargedback";
  return true;
}

/**
 * Order reference sent to PayHere. Prefixed and randomised rather than
 * sequential so it can appear in URLs and emails without leaking how many
 * orders exist.
 */
export function newOrderId(): string {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `KL-${Date.now().toString(36).toUpperCase()}-${random}`;
}
