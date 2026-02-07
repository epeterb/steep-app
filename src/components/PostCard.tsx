'use client'

import { formatDistanceToNow } from '@/components/date-utils'

interface PostCardProps {
  post: {
    id: string
    author_name: string
    author_headline?: string
    content: string
    original_url: string
    captured_at: string
  }
}

export default function PostCard({ post }: PostCardProps) {
  const { author_name, author_headline, content, original_url, captured_at } = post
  
  const preview = content.length > 200 
    ? content.substring(0, 200) + '...' 
    : content
  
  const timeAgo = formatDistanceToNow(new Date(captured_at))
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900 text-lg">{author_name}</h3>
        {author_headline && (
          <p className="text-sm text-gray-600 mt-1">{author_headline}</p>
        )}
      </div>
      
      <p className="text-gray-700 mb-4 leading-relaxed">{preview}</p>
      
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <span className="text-xs text-gray-500">{timeAgo}</span>
        <a 
          href={original_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          View Original →
        </a>
      </div>
    </div>
  )
}
