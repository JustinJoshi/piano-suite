import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import Link from "next/link";
import { getAllArticles, getArticleBySlug } from "@/lib/articles";
import { formatArticleDate } from "@/lib/article-date";
import { ArticleContent } from "@/components/articles/article-content";
import { SiteFooter } from "@/components/site-footer";

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
    <div className="flex min-h-screen flex-col">
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link
              href="/articles"
              className="mb-6 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to articles
            </Link>

            <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-door-learn">
              article
            </span>
            <h1 className="mb-4 mt-3 font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {article.title}
            </h1>

            <p className="mb-6 text-lg leading-relaxed text-muted-foreground">
              {article.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {article.publishedAt &&
              formatArticleDate(article.publishedAt, "long") ? (
                <time
                  dateTime={article.publishedAt}
                  className="flex items-center gap-1.5"
                >
                  <Calendar className="h-4 w-4" />
                  {formatArticleDate(article.publishedAt, "long")}
                </time>
              ) : null}
              {article.readingTime && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {article.readingTime} read
                </span>
              )}
            </div>
          </div>

          <div className="bar-line mb-10" aria-hidden />

          <ArticleContent content={article.content} />
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
