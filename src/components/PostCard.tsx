'use client'

import { formatDistanceToNow } from './date-utils'

interface PostCardProps {
  id: string
  authorName: string
  authorHeadline?: string
  content: string
  originalUrl: string
  capturedAt: string
}

export default function PostCard({
  authorName,
  authorHeadline,
  content,
  originalUrl,
  capturedAt
}: PostCardProps) {
  const preview = content.length > 200 
    ? content.substring(0, 200) + '...' 
    : content
  
  const timeAgo = formatDistanceToNow(new Date(capturedAt))
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900 text-lg">{authorName}</h3>
        {authorHeadline && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-1">{authorHeadline}</p>
        )}
      </div>
      
      <p className="text-gray-700 mb-4 line-clamp-4">{preview}</p>
      
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <span className="text-sm text-gray-400">{timeAgo}</span>
        
          href={originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
        >
          View Original →
        </a>
      </div>
    </div>
  )
}
