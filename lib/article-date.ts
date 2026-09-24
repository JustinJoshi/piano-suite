/**
 * Format an article's `publishedAt` ("2026-08-02") for display.
 *
 * A bare ISO date parses as UTC midnight, so formatting it in the reader's
 * (or the build server's) local zone shows the *previous* day anywhere west
 * of Greenwich — "Aug 1" for an article dated Aug 2. Formatting in UTC keeps
 * the calendar date the author wrote.
 */
export function formatArticleDate(
  isoDate: string,
  month: "short" | "long" = "short"
): string | null {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month,
    day: "numeric",
    timeZone: "UTC",
  });
}
