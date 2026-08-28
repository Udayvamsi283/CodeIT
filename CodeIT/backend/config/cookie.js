/**
 * Helper to build production-hardened, environment-controlled cookie configuration.
 *
 * For cross-site production (Vercel frontend -> Render backend):
 * - Reads COOKIE_SECURE (defaults to true in production, false in development)
 * - Reads COOKIE_SAME_SITE (defaults to 'none' in production/secure mode, 'lax' in development)
 * - Guarantees that if sameSite === 'none', secure is strictly set to true (required by modern browsers)
 *
 * @returns {{ httpOnly: boolean, secure: boolean, sameSite: 'lax'|'strict'|'none', maxAge: number, path: string }}
 */
export function getCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';

  // 1. Determine secure flag
  let secure = isProd;
  if (process.env.COOKIE_SECURE !== undefined && process.env.COOKIE_SECURE !== '') {
    const secStr = String(process.env.COOKIE_SECURE).trim().toLowerCase();
    secure = secStr === 'true' || secStr === '1' || secStr === 'yes';
  }

  // 2. Determine sameSite flag ('lax', 'strict', or 'none')
  let sameSite = secure ? 'none' : 'lax';
  if (process.env.COOKIE_SAME_SITE !== undefined && process.env.COOKIE_SAME_SITE !== '') {
    const siteStr = String(process.env.COOKIE_SAME_SITE).trim().toLowerCase();
    if (siteStr === 'none' || siteStr === 'lax' || siteStr === 'strict') {
      sameSite = siteStr;
    }
  }

  // 3. Security invariant: SameSite=None MUST have Secure=true in Chrome/modern browsers
  if (sameSite === 'none') {
    secure = true;
  }

  return {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    path: '/'
  };
}

/**
 * Returns cookie options specifically for clearing a cookie across domains.
 * Same path, domain, secure, and sameSite settings are required by browsers to delete the cookie.
 */
export function getClearCookieOptions() {
  const options = getCookieOptions();
  delete options.maxAge;
  return options;
}
