import Link from "next/link";
import { BookOpen, Clock, Calendar } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Article } from "@/lib/articles";

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Link href={`/articles/${article.slug}`} className="block">
      <Card className="h-full cursor-pointer transition-colors hover:border-primary/30 hover:bg-card/80">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-primary">
              <BookOpen className="h-4 w-4" />
            </div>
            <CardTitle data-testid="article-card-title">
              {article.title}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <CardDescription className="text-sm leading-relaxed">
            {article.description}
          </CardDescription>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
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
        </CardContent>
      </Card>
    </Link>
  );
}
