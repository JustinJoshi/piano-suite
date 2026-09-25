/**
 * Which pages wear the roll. Public pages always render in `.tone-roll`
 * (paper hanging from the tracker bar), whatever preset the workspace uses,
 * and the ambient atmosphere is switched off behind them — the paper is
 * opaque, so a live canvas underneath would only cost battery.
 */

const EXACT = new Set(["/", "/start", "/pricing", "/terms", "/privacy"]);
const PREFIXES = ["/marketplace", "/routes", "/articles", "/sign-in", "/sign-up"];

export function isRollRoute(pathname: string): boolean {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (EXACT.has(path)) return true;
  return PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}
