import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { generateSecret as otpGenerateSecret, generateURI, verifySync } from "otplib";
import QRCode from "qrcode";
import { SITE_NAME } from "@/config/site";

/**
 * TOTP two-factor for admin accounts (RFC 6238), compatible with Google
 * Authenticator, 1Password, Authy and the rest.
 *
 * Written against otplib v13, whose API differs substantially from the v12
 * examples found in most guides: there is no `authenticator` singleton, the
 * URI helper is `generateURI` rather than `keyuri`, and `verifySync` returns a
 * result object instead of a boolean.
 */

/**
 * Drift tolerance in **seconds** (v13) — not time steps, as v12's `window`
 * was. 30s is one step either side, so a code entered just as the window rolls
 * over still validates. Going wider extends how long an intercepted code stays
 * usable, so this is the practical maximum.
 */
const EPOCH_TOLERANCE_SECONDS = 30;

export const RECOVERY_CODE_COUNT = 10;

export function generateSecret(): string {
  return otpGenerateSecret();
}

/** The `otpauth://` URI an authenticator app scans, rendered as a data-URI QR code. */
export async function buildQrDataUrl(email: string, secret: string): Promise<string> {
  const uri = generateURI({ issuer: SITE_NAME, label: email, secret });
  return QRCode.toDataURL(uri, { margin: 1, width: 240 });
}

export function verifyToken(token: string, secret: string): boolean {
  const cleaned = token.replace(/\s/g, "");
  if (!/^\d{6}$/.test(cleaned)) return false;
  try {
    return verifySync({
      secret,
      token: cleaned,
      epochTolerance: EPOCH_TOLERANCE_SECONDS,
    }).valid;
  } catch {
    // Throws rather than returning invalid when the stored secret is malformed.
    return false;
  }
}

/**
 * Creates recovery codes, returning the plaintext to show the admin **once**
 * and bcrypt hashes to store. Hashed because a recovery code is a password
 * equivalent — a database leak must not hand over working second factors.
 */
export async function generateRecoveryCodes(): Promise<{ plain: string[]; hashed: string[] }> {
  const plain = Array.from({ length: RECOVERY_CODE_COUNT }, () =>
    // 5-4-... grouping keeps them readable when written down.
    randomBytes(5).toString("hex").toUpperCase().match(/.{1,5}/g)!.join("-")
  );
  const hashed = await Promise.all(plain.map(code => bcrypt.hash(code, 10)));
  return { plain, hashed };
}

/**
 * Spends a recovery code. Returns the remaining hashes with the used one
 * removed, or null when nothing matched — single-use is the whole point, so
 * the caller must persist the returned list.
 */
export async function consumeRecoveryCode(
  input: string,
  hashes: string[]
): Promise<string[] | null> {
  const candidate = input.replace(/\s/g, "").toUpperCase();
  if (!candidate) return null;

  for (const hash of hashes) {
    if (await bcrypt.compare(candidate, hash)) {
      return hashes.filter(h => h !== hash);
    }
  }
  return null;
}
