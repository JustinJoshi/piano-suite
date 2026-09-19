/**
 * Canonical site origin for metadata, sitemap, and robots.
 *
 * Precedence — first non-empty value wins (empty/whitespace counts as unset):
 *   1. NEXT_PUBLIC_SITE_URL (scheme added if missing)
 *   2. VERCEL_PROJECT_PRODUCTION_URL (bare host)
 *   3. VERCEL_URL (bare host)
 *   4. http://localhost:3000
 */
export function resolveSiteUrl(
  env: Record<string, string | undefined> = process.env,
): string {
  const explicit = nonEmpty(env.NEXT_PUBLIC_SITE_URL);
  if (explicit) {
    return stripTrailingSlash(
      /^[a-z][a-z0-9+.-]*:\/\//i.test(explicit) ? explicit : `https://${explicit}`,
    );
  }

  for (const name of ["VERCEL_PROJECT_PRODUCTION_URL", "VERCEL_URL"] as const) {
    const host = nonEmpty(env[name]);
    if (host) return stripTrailingSlash(`https://${host}`);
  }

  return "http://localhost:3000";
}

function nonEmpty(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function stripTrailingSlash(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}
