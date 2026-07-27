import fs from "fs";
import path from "path";

export interface Article {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  readingTime: string;
  content: string;
}

const ARTICLES_DIR = path.join(process.cwd(), "articles");

function parseFrontmatter(raw: string): Omit<Article, "slug" | "content"> {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    throw new Error("Invalid article format: missing frontmatter");
  }

  const frontmatter = match[1];
  const fields: Record<string, string> = {};

  for (const line of frontmatter.split("\n")) {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) continue;
    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    fields[key] = value;
  }

  return {
    title: fields.title ?? "Untitled",
    description: fields.description ?? "",
    publishedAt: fields.publishedAt ?? "",
    readingTime: fields.readingTime ?? "",
  };
}

export function getArticleBySlug(slug: string): Article | null {
  const filePath = path.join(ARTICLES_DIR, `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  const metadata = parseFrontmatter(raw);
  const content = raw.replace(/^---\n[\s\S]*?\n---\n/, "");

  return {
    slug,
    ...metadata,
    content,
  };
}

export function getAllArticles(): Article[] {
  if (!fs.existsSync(ARTICLES_DIR)) {
    return [];
  }

  const files = fs.readdirSync(ARTICLES_DIR);
  const markdownFiles = files.filter((file) => file.endsWith(".md"));

  return markdownFiles
    .map((file) => {
      const slug = file.replace(/\.md$/, "");
      return getArticleBySlug(slug);
    })
    .filter((article): article is Article => article !== null)
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
}
