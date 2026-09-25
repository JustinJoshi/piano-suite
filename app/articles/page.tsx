import { getAllArticles } from "@/lib/articles";
import { ArticleCard } from "@/components/articles/article-card";
import { RollMain, RollPageHead } from "@/components/roll/page-head";

export default function ArticlesPage() {
  const articles = getAllArticles();

  return (
    <>
      <RollPageHead
        label="Reading"
        note="Written for people teaching themselves."
        eyebrow="How to practice, when there’s no teacher to ask"
        title="Articles"
        lede={
          <p>
            Research-backed guides for learning piano on your own, from spaced repetition and active recall to the
            hands-on habits jazz pianists have trusted for decades. Read them at your own pace.
          </p>
        }
      />
      <RollMain className="roll-page-end">
        {articles.length === 0 ? (
          <div className="rounded-md border border-dashed border-rule p-8 text-center">
            <p className="text-muted-foreground">No articles yet. They’re coming.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {articles.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        )}
      </RollMain>
    </>
  );
}
