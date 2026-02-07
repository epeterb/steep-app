interface Post {
  id: string
  content: string | null
  author_name: string | null
  author_headline: string | null
  original_url: string | null
  captured_at: string
}

interface PostCardProps {
  post: Post
}

export default function PostCard({ post }: PostCardProps) {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return 'Unknown date'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
      <div className="mb-3">
        <h3 className="font-semibold text-gray-900">
          {post.author_name || 'Unknown Author'}
        </h3>
        {post.author_headline && (
          <p className="text-sm text-gray-600">{post.author_headline}</p>
        )}
      </div>
      
      {post.content && (
        <p className="text-gray-700 mb-4 line-clamp-3">{post.content}</p>
      )}
      
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">
          {formatDate(post.captured_at)}
        </span>
        {post.original_url && (
          
            href={post.original_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800"
          >
            View Original →
          </a>
        )}
      </div>
    </div>
  )
}
