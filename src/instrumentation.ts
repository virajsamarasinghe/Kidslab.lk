/**
 * Runs once when a Next.js server instance starts, before it takes requests.
 *
 * Used here to materialise the shipped email copy into the database, so a
 * fresh install's dashboard opens on a fully populated set of templates rather
 * than one that only appears after the first email happens to go out.
 *
 * Two rules this file has to respect:
 *
 * - `register` must complete before the server is ready, so nothing slow or
 *   failable may be awaited here. The seed is kicked off and deliberately not
 *   awaited — an unreachable database delays no page, and the send path seeds
 *   again on its first call if this attempt didn't land.
 * - It also runs in the Edge runtime, where Mongoose doesn't work. Hence the
 *   `NEXT_RUNTIME` guard and the dynamic import: a static import would pull
 *   the whole database layer into the Edge bundle.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { seedEmailTemplates } = await import("@/lib/settings");
  void seedEmailTemplates().catch(() => {
    // seedEmailTemplates already swallows its own failures; this is only here
    // so a rejection can never take the server process down at boot.
  });
}
