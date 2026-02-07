'use client'

import { useEffect, useState } from 'react'
import PostCard from '@/components/PostCard'

interface Post {
  id: string
  author_name: string
  author_headline?: string
  content: string
  original_url: string
  captured_at: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}

export default function Dashboard() {
  const [posts, setPosts] = useState<Post[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const userId = 'd7b500dd-0089-4fa7-83e7-2c91539950a2'

  const fetchPosts = async (page: number, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }

      const response = await fetch(`/api/posts/list?user_id=${userId}&page=${page}&limit=20`)
      const data = await response.json()

      if (append) {
        setPosts(prev => [...prev, ...data.posts])
      } else {
        setPosts(data.posts)
      }

      setPagination(data.pagination)
      setCurrentPage(page)
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchPosts(1)
  }, [])

  const loadMore = () => {
    if (pagination?.hasMore) {
      fetchPosts(currentPage + 1, true)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">🍵 Steep</h1>
              <a href="/" className="text-sm text-gray-600 hover:text-gray-900">
                Home
              </a>
            </div>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-gray-500">Loading your library...</div>
        </div>
      </div>
    )
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">🍵 Steep</h1>
              <a href="/" className="text-sm text-gray-600 hover:text-gray-900">
                Home
              </a>
            </div>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Your library is empty
            </h2>
            <p className="text-gray-600 mb-6">
              Start saving posts by forwarding them to your Steep email
            </p>
            <div className="bg-gray-100 rounded-lg p-4 inline-block">
              <p className="text-sm text-gray-700">
                Forward LinkedIn posts to: <strong>{userId}@save.steep.news</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🍵 Steep</h1>
              <p className="text-sm text-gray-600 mt-1">
                Your Library · {pagination?.total || 0} saved posts
              </p>
            </div>
            <a href="/" className="text-sm text-gray-600 hover:text-gray-900">
              Home
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>

        {pagination?.hasMore && (
          <div className="mt-8 text-center">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loadingMore ? 'Loading...' : 'Load More'}
            </button>
            <p className="text-sm text-gray-500 mt-2">
              Showing {posts.length} of {pagination.total} posts
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
