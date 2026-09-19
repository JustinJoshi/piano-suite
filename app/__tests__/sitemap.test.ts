import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { resolveSiteUrl } from "@/lib/site-url";
import { getAllArticles } from "@/lib/articles";
import { learningRoutes } from "@/lib/routes";

const staticPaths = [
  "/",
  "/start",
  "/tools/chord-drill",
  "/tools/arpeggios",
  "/tools/root-cycling",
  "/tools/progression",
  "/tools/workshop",
  "/tools/workshop/blocks",
  "/marketplace",
  "/routes",
  "/pricing",
  "/articles",
  "/terms",
  "/privacy",
];

describe("app/sitemap", () => {
  const entries = sitemap();
  const origin = resolveSiteUrl();

  it("builds every url from the resolved origin with no doubled slashes", () => {
    for (const entry of entries) {
      expect(entry.url.startsWith(`${origin}/`)).toBe(true);
      const afterScheme = entry.url.replace(`${origin}/`, "");
      expect(afterScheme).not.toContain("//");
    }
  });

  it("has one entry per article file, derived from the registry", () => {
    const articles = getAllArticles();
    const articleUrls = entries
      .map((entry) => entry.url)
      .filter((url) => url.startsWith(`${origin}/articles/`));
    expect(articleUrls).toHaveLength(articles.length);
    for (const article of articles) {
      expect(articleUrls).toContain(`${origin}/articles/${article.slug}`);
    }
  });

  it("has one entry per learning route, derived from the registry", () => {
    const routeUrls = entries
      .map((entry) => entry.url)
      .filter((url) => url.startsWith(`${origin}/routes/`));
    expect(routeUrls).toHaveLength(learningRoutes.length);
    for (const route of learningRoutes) {
      expect(routeUrls).toContain(`${origin}/routes/${route.id}`);
    }
  });

  it("keeps all pre-existing static paths", () => {
    for (const path of staticPaths) {
      expect(entries.map((entry) => entry.url)).toContain(`${origin}${path}`);
    }
  });
});
