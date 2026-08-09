import { describe, expect, it } from "vitest";
import { MIN_PASSWORD_LENGTH, validatePassword } from "./password";

describe("password policy", () => {
  it("accepts a long, varied passphrase", () => {
    expect(validatePassword("correct-horse-battery-staple").valid).toBe(true);
    expect(validatePassword("Tr0ubad0ur&Kestrel!Sky").valid).toBe(true);
  });

  it("rejects anything under the minimum length", () => {
    const result = validatePassword("Sh0rt!x");
    expect(result.valid).toBe(false);
    expect(result.error).toContain(String(MIN_PASSWORD_LENGTH));
  });

  it("rejects common passwords even when they satisfy length rules", () => {
    // The classic "meets every composition rule, falls instantly" case.
    expect(validatePassword("Password123!456").valid).toBe(false);
    expect(validatePassword("letmein-letmein").valid).toBe(false);
    expect(validatePassword("administrator99").valid).toBe(false);
  });

  it("rejects low-variety filler", () => {
    expect(validatePassword("aaaaaaaaaaaaaaaa").valid).toBe(false);
    expect(validatePassword("abababababababab").valid).toBe(false);
  });

  it("rejects keyboard and alphabet runs", () => {
    expect(validatePassword("abcdefghijklmno").valid).toBe(false);
    expect(validatePassword("qwertyuiop-zxcv").valid).toBe(false);
  });

  it("rejects passwords containing the account's own name or email", () => {
    expect(validatePassword("viraj-samarasinghe-99", ["viraj@kidslab.lk"]).valid).toBe(false);
    expect(validatePassword("kestrel-Fairfax-Nimbus", ["viraj@kidslab.lk"]).valid).toBe(true);
  });

  it("rejects non-strings and over-long input rather than throwing", () => {
    expect(validatePassword(undefined as unknown as string).valid).toBe(false);
    expect(validatePassword("a".repeat(200)).valid).toBe(false);
  });
});
