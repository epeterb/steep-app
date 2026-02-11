import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getArticleBySlug, getAllArticles } from '@/data/articles';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = getArticleBySlug(params.slug);
  if (!article) return { title: 'Article Not Found' };
  return {
    title: `${article.headline} | Steep`,
    description: article.description,
  };
}

export async function generateStaticParams() {
  const articles = getAllArticles();
  return articles.map((article) => ({ slug: article.slug }));
}

export default function BlogArticle({ params }: { params: { slug: string } }) {
  const article = getArticleBySlug(params.slug);
  if (!article) notFound();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.headline,
    "description": article.description,
    "datePublished": article.datePublished,
    "author": { "@type": "Person", "name": article.author.name },
    "publisher": { "@type": "Organization", "name": "Steep" }
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <div className="min-h-screen bg-white">
        <nav className="border-b">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <Link href="/blog" className="text-blue-600">← Back to Blog</Link>
          </div>
        </nav>
        <article className="max-w-3xl mx-auto px-4 py-12">
          <h1 className="text-5xl font-bold mb-6">{article.headline}</h1>
          <p className="text-xl text-gray-600 mb-6">{article.description}</p>
          <div className="flex gap-4 text-sm text-gray-500 mb-12">
            <span className="font-medium text-gray-900">{article.author.name}</span>
            <span>•</span>
            <time>{new Date(article.datePublished).toLocaleDateString()}</time>
          </div>
          <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: article.content }} />
        </article>
      </div>
    </>
  );
}
