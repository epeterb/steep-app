'use client'

import { useState, useEffect } from 'react'
import PostCard from './PostCard'

interface Post {
  id: string
  content: string | null
  author_name: string | null
  author_headline: string | null
  original_url: string
  captured_at: string
  source: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}

export default function LibraryTab({ userId }: { userId: string }) {
  const [posts, setPosts] = useState<Post[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [authorFilter, setAuthorFilter] = useState('')

  const fetchPosts = async (page = 1, append = false) => {
    try {
      if (append) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }

      const params = new URLSearchParams({
        user_id: userId,
        page: page.toString(),
        limit: '20',
      })

      // Add filters if active
      if (searchQuery) params.append('search', searchQuery)
      if (dateFilter !== 'all') params.append('date_filter', dateFilter)
      if (authorFilter) params.append('author', authorFilter)

      const response = await fetch(`/api/posts/list?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch posts')
      }

      const data = await response.json()
      
      if (!data.posts || !Array.isArray(data.posts)) {
        throw new Error('Invalid response format')
      }

      if (append) {
        setPosts(prev => [...prev, ...data.posts])
      } else {
        setPosts(data.posts)
      }
      
      setPagination(data.pagination)
      setError(null)

    } catch (err) {
      console.error('Error fetching posts:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  const handleSearch = () => {
    fetchPosts(1, false)
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setDateFilter('all')
    setAuthorFilter('')
    // Reset will happen when these state changes trigger useEffect
    setTimeout(() => fetchPosts(1, false), 0)
  }

  const loadMore = () => {
    if (pagination) {
      const nextPage = pagination.page + 1
      fetchPosts(nextPage, true)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="mt-4 text-gray-600">Loading your library...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Error: {error}</p>
        <button 
          onClick={() => fetchPosts()}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search Input */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>

          {/* Author Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Author
            </label>
            <input
              type="text"
              placeholder="Filter by author..."
              value={authorFilter}
              onChange={(e) => setAuthorFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filter Actions */}
        <div className="mt-4 flex gap-3">
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
          >
            Apply Filters
          </button>
          <button
            onClick={handleClearFilters}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Results Header */}
      <div className="mb-6">
        <p className="text-gray-600">
          {pagination ? (
            <>
              Showing {posts.length} of {pagination.total} saved posts
              {(searchQuery || dateFilter !== 'all' || authorFilter) && ' (filtered)'}
            </>
          ) : (
            'Loading...'
          )}
        </p>
      </div>

      {/* Posts Grid */}
      {posts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-600 mb-2">No posts found</p>
          <p className="text-gray-500 text-sm">
            {searchQuery || dateFilter !== 'all' || authorFilter 
              ? 'Try adjusting your filters' 
              : 'Start saving posts by forwarding them to your Steep email'
            }
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          {/* Load More */}
          {pagination && pagination.hasMore && (
            <div className="mt-8 text-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-8 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                {loadingMore ? (
                  <span className="flex items-center justify-center">
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                    Loading...
                  </span>
                ) : (
                  `Load More (${pagination.total - posts.length} remaining)`
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
