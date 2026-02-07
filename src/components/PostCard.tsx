'use client'

import { formatDistanceToNow } from './date-utils'

interface Post {
  id: string
  author_name: string
  author_headline?: string
  content: string
  original_url: string
  captured_at: string
}

export default function PostCard({ post }: { post: Post }) {
  // Safe content handling - handle null, undefined, or empty content
  const content = post.content || ''
  const truncatedContent = content.length > 200 
    ? content.substring(0, 200) + '...' 
    : content

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900 mb-1">
          {post.author_name || 'Unknown Author'}
        </h3>
        {post.author_headline && (
          <p className="text-sm text-gray-500">{post.author_headline}</p>
        )}
      </div>

      {truncatedContent && (
        <p className="text-gray-700 mb-4 line-clamp-4">
          {truncatedContent}
        </p>
      )}

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">
          {formatDistanceToNow(post.captured_at)}
        </span>
        <a
          href={post.original_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          View Original →
        </a>
      </div>
    </div>
  )
}
