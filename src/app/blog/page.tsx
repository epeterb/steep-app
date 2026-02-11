import { Metadata } from 'next';
import Link from 'next/link';
import { getAllArticles } from '@/data/articles';

export const metadata: Metadata = {
  title: 'Blog | Steep',
  description: 'AEO and AI content strategy insights',
};

export default function BlogIndex() {
  const articles = getAllArticles();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link href="/" className="text-2xl font-bold">☕ Steep</Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-6xl font-bold mb-4">Blog</h1>
        <p className="text-xl text-gray-600 mb-12">Insights on AEO and AI optimization</p>

        <div className="space-y-8">
          {articles.map(article => (
            <article key={article.slug} className="bg-white rounded-lg p-8 shadow-sm">
              <Link href={`/blog/${article.slug}`}>
                <h2 className="text-3xl font-bold mb-3 hover:text-blue-600">{article.headline}</h2>
              </Link>
              <p className="text-gray-600 text-lg mb-4">{article.description}</p>
              <div className="flex gap-4 text-sm text-gray-500">
                <span className="font-medium text-gray-900">{article.author.name}</span>
                <span>•</span>
                <time>{new Date(article.datePublished).toLocaleDateString()}</time>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
