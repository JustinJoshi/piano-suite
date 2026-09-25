import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import Link from "next/link";
import { getAllArticles, getArticleBySlug } from "@/lib/articles";
import { formatArticleDate } from "@/lib/article-date";
import { ArticleContent } from "@/components/articles/article-content";
import { RollMain } from "@/components/roll/page-head";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const articles = getAllArticles();
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    return {
      title: "Article Not Found",
    };
  }

  return {
    title: article.title,
    description: article.description,
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  return (
    <RollMain className="roll-page-end">
      <article className="max-w-3xl pt-8">
        <header className="mb-8">
          <Link href="/articles" className="roll-link mb-8 inline-flex items-center gap-2 text-base">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to articles
          </Link>
          <p className="roll-label" style={{ color: "var(--felt)" }}>
            Article
          </p>
          <h1 className="roll-h1 roll-h1-page mt-3">{article.title}</h1>
          <p className="roll-lede">{article.description}</p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {article.publishedAt && formatArticleDate(article.publishedAt, "long") ? (
              <time dateTime={article.publishedAt} className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" aria-hidden="true" />
                {formatArticleDate(article.publishedAt, "long")}
              </time>
            ) : null}
            {article.readingTime && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" aria-hidden="true" />
                {article.readingTime} read
              </span>
            )}
          </div>
        </header>

        <hr className="roll-crease mb-10" aria-hidden="true" style={{ margin: "0 0 2.5rem" }} />

        <ArticleContent content={article.content} />
      </article>
    </RollMain>
  );
}
