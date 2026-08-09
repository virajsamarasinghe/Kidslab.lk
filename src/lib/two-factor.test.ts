import { describe, expect, it } from "vitest";
import { generateSync } from "otplib";
import {
  buildQrDataUrl, consumeRecoveryCode, generateRecoveryCodes,
  generateSecret, RECOVERY_CODE_COUNT, verifyToken,
} from "./two-factor";

describe("TOTP", () => {
  it("accepts a code generated from the same secret", () => {
    const secret = generateSecret();
    expect(verifyToken(generateSync({ secret }), secret)).toBe(true);
  });

  it("tolerates whitespace, as pasted from an authenticator app", () => {
    const secret = generateSecret();
    const code = generateSync({ secret });
    expect(verifyToken(`${code.slice(0, 3)} ${code.slice(3)}`, secret)).toBe(true);
  });

  it("rejects codes from a different secret", () => {
    const secret = generateSecret();
    expect(verifyToken(generateSync({ secret }), generateSecret())).toBe(false);
  });

  it("rejects malformed input without throwing", () => {
    const secret = generateSecret();
    expect(verifyToken("abcdef", secret)).toBe(false);
    expect(verifyToken("12345", secret)).toBe(false);
    expect(verifyToken("", secret)).toBe(false);
    expect(verifyToken(generateSync({ secret }), "!!!not-base32!!!")).toBe(false);
  });

  it("produces an embeddable QR data URI", async () => {
    const qr = await buildQrDataUrl("admin@kidslab.lk", generateSecret());
    expect(qr.startsWith("data:image/png;base64,")).toBe(true);
  });
});

describe("recovery codes", () => {
  it("issues the expected count and never stores plaintext", async () => {
    const { plain, hashed } = await generateRecoveryCodes();
    expect(plain).toHaveLength(RECOVERY_CODE_COUNT);
    expect(hashed).toHaveLength(RECOVERY_CODE_COUNT);
    expect(hashed.some(h => plain.includes(h))).toBe(false);
  });

  it("consumes a valid code exactly once", async () => {
    const { plain, hashed } = await generateRecoveryCodes();
    const remaining = await consumeRecoveryCode(plain[2], hashed);
    expect(remaining).toHaveLength(RECOVERY_CODE_COUNT - 1);
    // Replaying the same code against the reduced set must fail.
    expect(await consumeRecoveryCode(plain[2], remaining!)).toBeNull();
  });

  it("is case- and whitespace-insensitive", async () => {
    const { plain, hashed } = await generateRecoveryCodes();
    expect(await consumeRecoveryCode(` ${plain[0].toLowerCase()} `, hashed)).not.toBeNull();
  });

  it("rejects codes that were never issued", async () => {
    const { hashed } = await generateRecoveryCodes();
    expect(await consumeRecoveryCode("NOPE1-NOPE2", hashed)).toBeNull();
    expect(await consumeRecoveryCode("", hashed)).toBeNull();
  });
});
