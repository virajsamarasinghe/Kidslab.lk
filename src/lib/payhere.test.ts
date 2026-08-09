import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  appUrl,
  canTransition,
  checkoutUrl,
  formatAmount,
  generateCheckoutHash,
  isPayHereConfigured,
  newOrderId,
  PAYHERE_STATUS,
  payhereMode,
  verifyNotification,
  type PayHereNotification,
} from "./payhere";

/**
 * These cover the two functions PayHere's security rests on.
 *
 * The expected digests below were computed independently (not by calling the
 * code under test) from PayHere's published formulas, so a refactor that
 * quietly changes the hashing — reordering the concatenation, dropping an
 * uppercase, formatting the amount differently — fails here rather than in
 * production, where the symptom is either every payment rejected or, far
 * worse, forged notifications accepted.
 */

const MERCHANT_ID = "1221149";
const SECRET = "TESTSECRET123";

// UPPER(MD5("1221149" + "KL-TEST-001" + "2500.00" + "LKR" + UPPER(MD5(secret))))
const EXPECTED_CHECKOUT_HASH = "0291F6A1446356F581C2EC3E48EF917A";
// …with status_code "2" inserted before the secret digest.
const EXPECTED_NOTIFY_SIG = "AFEA0B95E0E0D965B6A75B4F81050359";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env.PAYHERE_MERCHANT_ID = MERCHANT_ID;
  process.env.PAYHERE_MERCHANT_SECRET = SECRET;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

function validNotification(): PayHereNotification {
  return {
    merchant_id: MERCHANT_ID,
    order_id: "KL-TEST-001",
    payment_id: "320027494",
    payhere_amount: "2500.00",
    payhere_currency: "LKR",
    status_code: "2",
    md5sig: EXPECTED_NOTIFY_SIG,
  };
}

describe("formatAmount", () => {
  it("always emits exactly two decimals", () => {
    expect(formatAmount(2500)).toBe("2500.00");
    expect(formatAmount(2500.5)).toBe("2500.50");
    expect(formatAmount(0)).toBe("0.00");
  });

  it("never emits thousand separators", () => {
    // A comma here is the classic cause of PayHere's "Unauthorized payment
    // request": the hash covers this exact string.
    expect(formatAmount(1234567.89)).toBe("1234567.89");
    expect(formatAmount(1234567.89)).not.toContain(",");
  });

  it("rounds to the cent rather than truncating", () => {
    expect(formatAmount(10.005)).toBe("10.01");
    expect(formatAmount(10.994)).toBe("10.99");
  });
});

describe("generateCheckoutHash", () => {
  it("matches an independently computed digest", () => {
    expect(
      generateCheckoutHash({ orderId: "KL-TEST-001", amount: 2500, currency: "LKR" })
    ).toBe(EXPECTED_CHECKOUT_HASH);
  });

  it("is uppercase hex, as PayHere requires", () => {
    const hash = generateCheckoutHash({ orderId: "KL-TEST-001", amount: 2500, currency: "LKR" });
    expect(hash).toMatch(/^[0-9A-F]{32}$/);
  });

  it("changes when any signed component changes", () => {
    const base = generateCheckoutHash({ orderId: "KL-TEST-001", amount: 2500, currency: "LKR" });
    expect(generateCheckoutHash({ orderId: "KL-TEST-002", amount: 2500, currency: "LKR" })).not.toBe(base);
    expect(generateCheckoutHash({ orderId: "KL-TEST-001", amount: 2501, currency: "LKR" })).not.toBe(base);
    expect(generateCheckoutHash({ orderId: "KL-TEST-001", amount: 2500, currency: "USD" })).not.toBe(base);
  });

  it("changes when the merchant secret changes", () => {
    const base = generateCheckoutHash({ orderId: "KL-TEST-001", amount: 2500, currency: "LKR" });
    process.env.PAYHERE_MERCHANT_SECRET = "A-DIFFERENT-SECRET";
    expect(generateCheckoutHash({ orderId: "KL-TEST-001", amount: 2500, currency: "LKR" })).not.toBe(base);
  });

  it("throws rather than signing with an empty secret", () => {
    delete process.env.PAYHERE_MERCHANT_SECRET;
    expect(() =>
      generateCheckoutHash({ orderId: "KL-TEST-001", amount: 2500, currency: "LKR" })
    ).toThrow();
  });
});

describe("verifyNotification", () => {
  it("accepts a correctly signed notification", () => {
    expect(verifyNotification(validNotification())).toBe(true);
  });

  it("accepts a lowercase signature", () => {
    // Nothing in PayHere's contract guarantees the case of what they send.
    const n = { ...validNotification(), md5sig: EXPECTED_NOTIFY_SIG.toLowerCase() };
    expect(verifyNotification(n)).toBe(true);
  });

  it("rejects a tampered amount", () => {
    expect(verifyNotification({ ...validNotification(), payhere_amount: "1.00" })).toBe(false);
  });

  it("rejects a tampered status code", () => {
    // The attack this blocks: flipping a failed payment to a successful one.
    expect(verifyNotification({ ...validNotification(), status_code: "2 " })).toBe(false);
    expect(verifyNotification({ ...validNotification(), status_code: "-2" })).toBe(false);
  });

  it("rejects a tampered order or merchant id", () => {
    expect(verifyNotification({ ...validNotification(), order_id: "KL-TEST-002" })).toBe(false);
    expect(verifyNotification({ ...validNotification(), merchant_id: "9999999" })).toBe(false);
  });

  it("rejects a tampered currency", () => {
    expect(verifyNotification({ ...validNotification(), payhere_currency: "USD" })).toBe(false);
  });

  it("rejects a notification signed with a different secret", () => {
    process.env.PAYHERE_MERCHANT_SECRET = "SOMEBODY-ELSES-SECRET";
    expect(verifyNotification(validNotification())).toBe(false);
  });

  it("rejects a missing or empty signature without throwing", () => {
    expect(verifyNotification({ ...validNotification(), md5sig: "" })).toBe(false);
    const noSig = { ...validNotification() } as Partial<PayHereNotification>;
    delete noSig.md5sig;
    expect(verifyNotification(noSig as PayHereNotification)).toBe(false);
  });
});

describe("mode selection", () => {
  it("defaults to sandbox when unset", () => {
    delete process.env.PAYHERE_MODE;
    expect(payhereMode()).toBe("sandbox");
    expect(checkoutUrl()).toBe("https://sandbox.payhere.lk/pay/checkout");
  });

  it("only goes live on the exact string 'live'", () => {
    // A typo must never charge real cards.
    for (const value of ["LIVE", "Live", "production", "true", "1", ""]) {
      process.env.PAYHERE_MODE = value;
      expect(payhereMode()).toBe("sandbox");
    }
    process.env.PAYHERE_MODE = "live";
    expect(payhereMode()).toBe("live");
    expect(checkoutUrl()).toBe("https://www.payhere.lk/pay/checkout");
  });
});

describe("isPayHereConfigured", () => {
  it("requires both credentials", () => {
    expect(isPayHereConfigured()).toBe(true);
    delete process.env.PAYHERE_MERCHANT_SECRET;
    expect(isPayHereConfigured()).toBe(false);
  });
});

describe("appUrl", () => {
  it("strips a trailing slash so paths don't double up", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://example.com/";
    expect(appUrl()).toBe("https://example.com");
  });

  it("falls back to the site URL when unset", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    expect(appUrl()).toBe("https://kidslab.lk");
  });
});

describe("newOrderId", () => {
  it("is unique across rapid calls", () => {
    const ids = new Set(Array.from({ length: 500 }, newOrderId));
    expect(ids.size).toBe(500);
  });

  it("is URL-safe and prefixed", () => {
    const id = newOrderId();
    expect(id).toMatch(/^KL-[0-9A-Z]+-[0-9A-Z]{6}$/);
    expect(encodeURIComponent(id)).toBe(id);
  });
});

describe("canTransition", () => {
  it("refuses to move a paid order to any failure state", () => {
    // The replay attack this exists for: re-sending the earlier `-2 failed`
    // notification, which stays validly signed forever, after the payment
    // succeeded. Signature verification cannot catch it — the message really
    // is PayHere's, just superseded.
    expect(canTransition("success", "failed")).toBe(false);
    expect(canTransition("success", "canceled")).toBe(false);
    expect(canTransition("success", "pending")).toBe(false);
  });

  it("allows the one legitimate move out of success", () => {
    expect(canTransition("success", "chargedback")).toBe(true);
  });

  it("treats chargedback as final", () => {
    for (const to of ["success", "pending", "failed", "canceled"] as const) {
      expect(canTransition("chargedback", to)).toBe(false);
    }
  });

  it("tolerates a duplicate delivery of the same status", () => {
    // PayHere retries notifications; a repeat must be a no-op, not a rejection.
    for (const s of ["pending", "success", "failed", "canceled", "chargedback"] as const) {
      expect(canTransition(s, s)).toBe(true);
    }
  });

  it("still allows a failed order to later succeed", () => {
    // Refusing this would deny a genuine recovery, and the only way such a
    // notification can exist is if the payment really did go through.
    expect(canTransition("failed", "success")).toBe(true);
    expect(canTransition("canceled", "success")).toBe(true);
    expect(canTransition("pending", "success")).toBe(true);
  });
});

describe("PAYHERE_STATUS", () => {
  it("maps PayHere's documented status codes", () => {
    expect(PAYHERE_STATUS["2"]).toBe("success");
    expect(PAYHERE_STATUS["0"]).toBe("pending");
    expect(PAYHERE_STATUS["-1"]).toBe("canceled");
    expect(PAYHERE_STATUS["-2"]).toBe("failed");
    expect(PAYHERE_STATUS["-3"]).toBe("chargedback");
  });

  it("has no mapping for unknown codes, so callers fall back to failed", () => {
    expect(PAYHERE_STATUS["7"]).toBeUndefined();
  });
});
