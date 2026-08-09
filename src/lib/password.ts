/**
 * Password policy for admin accounts.
 *
 * Follows NIST SP 800-63B: length is the primary control, and blocklisting
 * known-bad choices beats composition rules (which mostly push people toward
 * `Password1!`). No forced rotation, no character-class requirements.
 */

import { randomInt } from "crypto";

export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 128;

/**
 * Common choices that satisfy a length rule but fall in seconds to a
 * dictionary attack. Compared case-insensitively, with digit/symbol suffixes
 * stripped, so `Password123!` is caught by the `password` entry.
 */
const BLOCKLIST = [
  "password", "passw0rd", "letmein", "welcome", "admin", "administrator",
  "qwerty", "iloveyou", "monkey", "dragon", "sunshine", "princess",
  "football", "baseball", "trustno", "changeme", "secret", "master",
  "abcdef", "123456", "111111", "000000", "kidslab", "robotics",
];

function normalise(password: string): string {
  return password.toLowerCase().replace(/[^a-z]/g, "");
}

/** Rejects `aaaaaaaaaaaa` and `abcabcabcabc`-style filler. */
function hasLowVariety(password: string): boolean {
  const unique = new Set(password).size;
  return unique <= 4;
}

function isSequential(password: string): boolean {
  const lower = password.toLowerCase();
  const runs = ["abcdefghijklmnopqrstuvwxyz", "01234567890", "qwertyuiop"];
  for (const run of runs) {
    for (let i = 0; i + 6 <= run.length; i++) {
      const chunk = run.slice(i, i + 6);
      if (lower.includes(chunk) || lower.includes([...chunk].reverse().join(""))) return true;
    }
  }
  return false;
}

export interface PasswordCheck {
  valid: boolean;
  /** Present when `valid` is false — safe to show the user verbatim. */
  error?: string;
}

/**
 * Validates a candidate password. `context` holds values the password must not
 * simply echo — the account's own email and name.
 */
export function validatePassword(password: string, context: string[] = []): PasswordCheck {
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return { valid: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` };
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return { valid: false, error: `Password must be at most ${MAX_PASSWORD_LENGTH} characters` };
  }

  const flat = normalise(password);
  if (BLOCKLIST.some(entry => flat.includes(entry))) {
    return { valid: false, error: "That password is too common — choose something less guessable" };
  }
  if (hasLowVariety(password)) {
    return { valid: false, error: "Password uses too few distinct characters" };
  }
  if (isSequential(password)) {
    return { valid: false, error: "Avoid keyboard or alphabet sequences" };
  }

  for (const value of context) {
    if (!value) continue;
    const part = normalise(value.split("@")[0]);
    if (part.length >= 4 && flat.includes(part)) {
      return { valid: false, error: "Password must not contain your name or email" };
    }
  }

  return { valid: true };
}

// Ambiguous-looking characters (0/O, 1/l/I) are left out so a password read
// off a phone screen or typed by hand doesn't get mistyped.
const TEMP_PASSWORD_CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";

/**
 * Generates a random password for a newly invited admin account.
 *
 * Retries against {@link validatePassword} rather than hand-tuning the
 * generator to satisfy every rule (sequences, low variety) — the policy is
 * the single source of truth, and a retry is cheap since a random 18-char
 * string from this charset almost always passes on the first attempt.
 */
export function generateTemporaryPassword(context: string[] = []): string {
  for (let attempt = 0; attempt < 10; attempt++) {
    let candidate = "";
    for (let i = 0; i < 18; i++) {
      candidate += TEMP_PASSWORD_CHARSET[randomInt(TEMP_PASSWORD_CHARSET.length)];
    }
    if (validatePassword(candidate, context).valid) return candidate;
  }
  throw new Error("Could not generate a password satisfying the password policy");
}
