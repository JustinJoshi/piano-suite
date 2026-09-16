import { BookOpen } from "lucide-react";
import { getAllArticles } from "@/lib/articles";
import { ArticleCard } from "@/components/articles/article-card";
import { SiteFooter } from "@/components/site-footer";

export default function ArticlesPage() {
  const articles = getAllArticles();

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border bg-card/50">
          <div
            aria-hidden
            className="staff-lines staff-lines-faded pointer-events-none absolute inset-0"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-door-learn/12 to-transparent"
          />
          <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-door-learn">
              <BookOpen className="h-3.5 w-3.5" />
              learn
            </span>
            <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Articles
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Friendly, research-backed guides for learning piano on your own —
              from spaced repetition and active recall to the hands-on habits
              jazz pianists have trusted for decades. Grab a cup of something
              warm and read at your own pace.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          {articles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center">
              <p className="text-muted-foreground">
                No articles yet — but they&apos;re coming. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <ArticleCard key={article.slug} article={article} />
              ))}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
