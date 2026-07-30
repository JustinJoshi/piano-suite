/**
 * Parse Clerk `authorizedParties` from an env string.
 *
 * Clerk recommends setting `authorizedParties` in production so session
 * tokens are only accepted from known origins (limits subdomain cookie
 * abuse). Leave the env unset to omit the option (Clerk default).
 *
 * Format: comma-separated absolute origins, e.g.
 * `https://example.com,https://www.example.com,http://localhost:3000`
 *
 * @see https://clerk.com/docs/guides/development/deployment/production
 */

export function parseAuthorizedParties(
  raw: string | undefined
): string[] | undefined {
  if (raw === undefined || raw.trim() === "") {
    return undefined;
  }

  const parties = raw
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  return parties.length > 0 ? parties : undefined;
}

/** Reads `CLERK_AUTHORIZED_PARTIES` for `clerkMiddleware` options. */
export function getAuthorizedPartiesFromEnv(
  env: NodeJS.ProcessEnv = process.env
): string[] | undefined {
  return parseAuthorizedParties(env.CLERK_AUTHORIZED_PARTIES);
}
