import Link from "next/link";
import { ArrowUpRight, BookOpen, Clock, Calendar } from "lucide-react";
import type { Article } from "@/lib/articles";

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Link
      href={`/articles/${article.slug}`}
      className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-surface transition-all hover:-translate-y-0.5 hover:border-door-learn/40 hover:shadow-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-door-learn/12 text-door-learn ring-1 ring-door-learn/25">
          <BookOpen className="h-[18px] w-[18px]" />
        </span>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
      </div>
      <h3
        data-testid="article-card-title"
        className="mt-5 font-heading text-lg font-semibold leading-snug tracking-tight text-foreground"
      >
        {article.title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
        {article.description}
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
        {article.publishedAt && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(article.publishedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
        {article.readingTime && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {article.readingTime}
          </span>
        )}
      </div>
    </Link>
  );
}
