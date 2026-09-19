import type { MetadataRoute } from "next";
import { resolveSiteUrl } from "@/lib/site-url";
import { getAllArticles } from "@/lib/articles";
import { learningRoutes } from "@/lib/routes";

const siteUrl = resolveSiteUrl();

// Public routes per proxy.ts's allowlist (audit 2026-09, Phase 1.7).
const routes: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/start", changeFrequency: "monthly", priority: 0.9 },
  { path: "/tools/chord-drill", changeFrequency: "monthly", priority: 0.8 },
  { path: "/tools/arpeggios", changeFrequency: "monthly", priority: 0.8 },
  { path: "/tools/root-cycling", changeFrequency: "monthly", priority: 0.8 },
  { path: "/tools/progression", changeFrequency: "monthly", priority: 0.8 },
  { path: "/tools/workshop", changeFrequency: "weekly", priority: 0.9 },
  { path: "/tools/workshop/blocks", changeFrequency: "weekly", priority: 0.8 },
  { path: "/marketplace", changeFrequency: "weekly", priority: 0.8 },
  { path: "/routes", changeFrequency: "monthly", priority: 0.7 },
  { path: "/pricing", changeFrequency: "monthly", priority: 0.7 },
  { path: "/articles", changeFrequency: "monthly", priority: 0.6 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticEntries = routes.map(({ path, changeFrequency, priority }) => ({
    url: `${siteUrl}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));

  const articleEntries: MetadataRoute.Sitemap = getAllArticles().map(
    (article) => {
      const parsed = new Date(article.publishedAt);
      return {
        url: `${siteUrl}/articles/${article.slug}`,
        lastModified: Number.isNaN(parsed.getTime()) ? lastModified : parsed,
        changeFrequency: "yearly" as const,
        priority: 0.5,
      };
    },
  );

  const routeEntries: MetadataRoute.Sitemap = learningRoutes.map((route) => ({
    url: `${siteUrl}/routes/${route.id}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticEntries, ...articleEntries, ...routeEntries];
}
