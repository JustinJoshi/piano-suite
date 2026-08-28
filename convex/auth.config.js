// Convex validates Clerk JWTs against these issuer domains.
//
// Primary domain: the Clerk instance used by the live app (production or local
// development). Extra domains: additional Clerk instances allowed for CI/E2E
// testing. Set `CLERK_FRONTEND_API_URL_EXTRA` as a comma-separated list on each
// Convex deployment that should accept more than one Clerk tenant.
const primaryDomain = process.env.CLERK_FRONTEND_API_URL || "";
const extraDomains = (process.env.CLERK_FRONTEND_API_URL_EXTRA || "")
  .split(",")
  .map((d) => d.trim())
  .filter(Boolean);

const domains = [primaryDomain, ...extraDomains].filter(Boolean);

const authConfig = {
  providers: domains.map((domain) => ({
    domain,
    applicationID: "convex",
  })),
};

export default authConfig;
