import { describe, expect, it } from "vitest";
import {
  EMAIL_TEMPLATE_DEFAULTS,
  EMAIL_TEMPLATE_KEYS,
  EMAIL_TEMPLATE_META,
} from "@/config/email-templates";
import {
  changedEmailTemplateFields,
  mergeEmailTemplates,
  previewEmailTemplate,
  renderEmailTemplate,
  unknownTokens,
} from "./email-templates";

/**
 * The blank-slot rules are the whole contract of this module: an admin has to
 * be able to *delete* a button without the defaults silently putting it back,
 * and has to be unable to send an email with no subject. Those two pull in
 * opposite directions, so both are pinned here.
 */
describe("mergeEmailTemplates", () => {
  it("falls back to the shipped copy when nothing is stored", () => {
    expect(mergeEmailTemplates(null)).toEqual(EMAIL_TEMPLATE_DEFAULTS);
    expect(mergeEmailTemplates({})).toEqual(EMAIL_TEMPLATE_DEFAULTS);
  });

  it("restores the default for a required slot that was blanked", () => {
    const merged = mergeEmailTemplates({
      welcome: { subject: "   ", heading: "", preheader: "", intro: "" },
    });
    expect(merged.welcome.subject).toBe(EMAIL_TEMPLATE_DEFAULTS.welcome.subject);
    expect(merged.welcome.heading).toBe(EMAIL_TEMPLATE_DEFAULTS.welcome.heading);
    expect(merged.welcome.intro).toBe(EMAIL_TEMPLATE_DEFAULTS.welcome.intro);
  });

  it("keeps an optional slot the admin deliberately cleared", () => {
    const merged = mergeEmailTemplates({
      welcome: { buttonLabel: "", footerNote: "", note: "", outro: "" },
    });
    expect(merged.welcome.buttonLabel).toBe("");
    expect(merged.welcome.footerNote).toBe("");
  });

  it("fills in a slot that was never written, e.g. one added by a later release", () => {
    const merged = mergeEmailTemplates({ welcome: { subject: "Hello" } });
    expect(merged.welcome.subject).toBe("Hello");
    expect(merged.welcome.buttonLabel).toBe(EMAIL_TEMPLATE_DEFAULTS.welcome.buttonLabel);
  });

  it("ignores non-string junk rather than persisting it into an email", () => {
    const merged = mergeEmailTemplates({
      welcome: { subject: 42 as unknown as string },
    });
    expect(merged.welcome.subject).toBe(EMAIL_TEMPLATE_DEFAULTS.welcome.subject);
  });
});

describe("placeholders", () => {
  const base = EMAIL_TEMPLATE_DEFAULTS.smtpTest;

  it("substitutes into the subject as plain text, not escaped HTML", () => {
    const { subject } = renderEmailTemplate("smtpTest", { ...base, subject: "{{a}} & {{b}}" }, {
      a: "Tom",
      b: "Jerry",
    });
    expect(subject).toBe("Tom & Jerry");
  });

  it("escapes values landing in the body — a registrant can't inject markup", () => {
    const { html } = renderEmailTemplate("welcome", {
      ...EMAIL_TEMPLATE_DEFAULTS.welcome,
      intro: "Hi {{name}}",
    }, { name: "<script>alert(1)</script>" });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("keeps the admin's own markup around the placeholder", () => {
    const { html } = renderEmailTemplate("welcome", {
      ...EMAIL_TEMPLATE_DEFAULTS.welcome,
      intro: "Hi <strong>{{name}}</strong>",
    }, { name: "Nimal" });
    expect(html).toContain("<strong>Nimal</strong>");
  });

  it("drops an unknown token instead of shipping it to a customer", () => {
    const { subject } = renderEmailTemplate("smtpTest", { ...base, subject: "A{{whoops}}B" }, {});
    expect(subject).toBe("AB");
  });

  it("reports unknown tokens so the editor can flag the typo", () => {
    expect(unknownTokens({ ...base, heading: "{{nam}}" }, "smtpTest")).toEqual(["nam"]);
    expect(unknownTokens({ ...base, heading: "{{siteName}}" }, "smtpTest")).toEqual([]);
  });
});

describe("optional blocks", () => {
  const base = EMAIL_TEMPLATE_DEFAULTS.adminInvite;
  const vars = { name: "A", roleLabel: "Editor", loginUrl: "https://kidslab.lk/login" };

  it("omits the button when either half is blank", () => {
    expect(renderEmailTemplate("adminInvite", base, vars).html).toContain("Sign in");
    expect(
      renderEmailTemplate("adminInvite", { ...base, buttonLabel: "" }, vars).html
    ).not.toContain(">Sign in<");
    expect(
      renderEmailTemplate("adminInvite", { ...base, buttonUrl: "" }, vars).html
    ).not.toContain(">Sign in<");
  });

  it("drops the closing divider along with the closing note", () => {
    const withNote = renderEmailTemplate("adminInvite", base, vars).html;
    const without = renderEmailTemplate("adminInvite", { ...base, footerNote: "" }, vars).html;
    expect(withNote).toContain("border-top:1px solid");
    expect(without).not.toContain("border-top:1px solid");
  });

  it("splits blank-line-separated text into paragraphs and single newlines into breaks", () => {
    const { html } = renderEmailTemplate("smtpTest", {
      ...EMAIL_TEMPLATE_DEFAULTS.smtpTest,
      intro: "One\n\nTwo\nstill two",
    }, {});
    expect(html).toContain(">One</p>");
    expect(html).toContain("Two<br />still two</p>");
  });

  it("appends mechanical small print that the editor can't remove", () => {
    const { html } = renderEmailTemplate(
      "passwordReset",
      { ...EMAIL_TEMPLATE_DEFAULTS.passwordReset, note: "" },
      { minutes: "30", resetUrl: "https://kidslab.lk/r?t=1" },
      { extraNotes: ["Paste this link instead"] }
    );
    expect(html).toContain("Paste this link instead");
  });
});

describe("previews", () => {
  it("renders every shipped template with a subject and no leftover placeholders", () => {
    for (const key of EMAIL_TEMPLATE_KEYS) {
      const { subject, html } = previewEmailTemplate(key, EMAIL_TEMPLATE_DEFAULTS[key]);
      expect(subject.length, key).toBeGreaterThan(0);
      expect(html, key).not.toMatch(/\{\{/);
      expect(html, key).toContain("<!DOCTYPE html");
    }
  });

  it("gives marketing mail an unsubscribe line and transactional mail none", () => {
    for (const key of EMAIL_TEMPLATE_KEYS) {
      const { html } = previewEmailTemplate(key, EMAIL_TEMPLATE_DEFAULTS[key]);
      const marketing = EMAIL_TEMPLATE_META[key].kind === "marketing";
      expect(html.includes("Unsubscribe"), key).toBe(marketing);
    }
  });
});

/**
 * What the auto-seed writes, and — more importantly — when it stops writing.
 * A comparison that never reaches "no change" would write the same document on
 * every server start.
 */
describe("changedEmailTemplateFields", () => {
  it("reports every slot on an empty database", () => {
    const merged = mergeEmailTemplates(null);
    const slots = Object.keys(EMAIL_TEMPLATE_DEFAULTS.welcome).length;
    expect(changedEmailTemplateFields({}, merged)).toHaveLength(
      slots * EMAIL_TEMPLATE_KEYS.length
    );
  });

  it("reports nothing once the shipped copy has been written — seeding is one-shot", () => {
    const merged = mergeEmailTemplates(null);
    expect(changedEmailTemplateFields(merged, merged)).toEqual([]);
  });

  it("reports only the slots a new release added", () => {
    const stored = mergeEmailTemplates(null) as Record<string, Record<string, string>>;
    delete stored.welcome.note;
    expect(changedEmailTemplateFields(stored, mergeEmailTemplates(null))).toEqual([
      "welcome.note",
    ]);
  });

  it("treats a deliberately cleared slot as settled, not as missing", () => {
    // The seed must not resurrect a button the admin removed on purpose.
    const stored = mergeEmailTemplates({ welcome: { buttonLabel: "" } });
    expect(changedEmailTemplateFields(stored, stored)).toEqual([]);
    expect(stored.welcome.buttonLabel).toBe("");
  });

  it("never asks to overwrite an admin's edit, because the merge keeps it", () => {
    const stored = { welcome: { subject: "My own subject" } };
    const merged = mergeEmailTemplates(stored);
    expect(merged.welcome.subject).toBe("My own subject");
    expect(changedEmailTemplateFields(stored, merged)).not.toContain("welcome.subject");
  });
});
