/**
 * Session timing constants.
 *
 * Kept separate from `lib/auth` because the proxy runs on the edge runtime and
 * importing `lib/auth` there would drag in Mongoose and `next/headers`.
 */

/**
 * Idle window: the session cookie's lifetime. The proxy re-issues the cookie
 * on activity, so this expires only after a genuine gap in use.
 */
export const SESSION_IDLE_SECONDS = 60 * 60 * 8;

/** Hard ceiling from first sign-in, regardless of activity. */
export const SESSION_ABSOLUTE_SECONDS = 60 * 60 * 24 * 7;
