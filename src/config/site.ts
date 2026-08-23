export const SITE_URL = "https://kidslab.lk";
export const SITE_NAME = "kidslab.lk";

export const ADMIN_COOKIE_NAME = "kidslab_admin_token";

/**
 * Branding + contact details shared by the site and every outbound email.
 *
 * Emails must use absolute URLs for images and links — a mail client has no
 * origin to resolve `/logo.png` against — so everything here is fully
 * qualified off {@link SITE_URL}.
 */
export const SITE_LEGAL_NAME = "KidsLab Robotics & AI Academy";
export const SITE_TAGLINE = "Robotics & AI for curious kids";
export const SITE_LOGO_URL = `${SITE_URL}/logo.png`;

export const CONTACT_EMAIL = "info@kidslab.lk";
export const CONTACT_PHONE = "+94 76 397 7035";
export const CONTACT_ADDRESS = "Colombo, Sri Lanka";

/** Google Tag Manager container ID (kidslab.lk web container). */
export const GTM_ID = "GTM-K5SF2WC2";

/**
 * GA4 measurement ID, loaded directly via gtag.js.
 *
 * Deliberately NOT also configured as a Google tag inside the GTM container
 * above — two loaders for the same measurement ID double-count every
 * pageview. If GA4 is ever moved into GTM, delete the <GoogleAnalytics />
 * component from the root layout in the same change.
 */
export const GA_MEASUREMENT_ID = "G-E8MR59WLNT";

export const WHATSAPP_URL = "https://wa.me/94763977035";
export const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=61585638656242";

/** Brand palette, mirrored from the `--brand-*` custom properties in globals.css. */
export const BRAND_COLORS = {
  navy: "#0f2418",
  copper: "#e08a3c",
  blue: "#2b5fe0",
  yellow: "#fbbf24",
  paper: "#f7f5ee",
} as const;
