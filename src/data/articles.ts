export interface ArticleData {
  slug: string;
  headline: string;
  description: string;
  datePublished: string;
  author: { name: string; url?: string };
  tags?: string[];
  content: string;
}

export const exampleArticle: ArticleData = {
  slug: "aeo-guide-2026",
  headline: "AEO Optimization: The Complete Guide for 2026",
  description: "Learn how to optimize your content for AI answer engines.",
  datePublished: "2026-01-22T10:00:00Z",
  author: { name: "Peter" },
  tags: ["AEO", "SEO"],
  content: `<h2>What is AEO?</h2><p>AI Engine Optimization for answer engines.</p>`
};

export const articles: ArticleData[] = [exampleArticle];

export function getArticleBySlug(slug: string): ArticleData | undefined {
  return articles.find(article => article.slug === slug);
}

export function getAllArticles(): ArticleData[] {
  return [...articles].sort((a, b) => 
    new Date(b.datePublished).getTime() - new Date(a.datePublished).getTime()
  );
}
