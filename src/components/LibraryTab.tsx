'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import CreateCollectionModal from './CreateCollectionModal'
import AddToCollection from './AddToCollection'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface LibraryTabProps {
  userId: string
}

export default function LibraryTab({ userId }: LibraryTabProps) {
  const [posts, setPosts] = useState<any[]>([])
  const [collections, setCollections] = useState<any[]>([])
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchCollections()
    fetchPosts()
  }, [userId, selectedCollection])

  async function fetchCollections() {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('user_id', userId)
      .order('name')

    if (!error && data) {
      const collectionsWithCounts = await Promise.all(
        data.map(async (collection) => {
          const { count } = await supabase
            .from('collection_posts')
            .select('*', { count: 'exact', head: true })
            .eq('collection_id', collection.id)
          
          return { ...collection, post_count: count || 0 }
        })
      )
      setCollections(collectionsWithCounts)
    }
  }

  async function fetchPosts() {
    setLoading(true)

    let query = supabase
      .from('saved_posts')
      .select('*')
      .eq('user_id', userId)
      .order('captured_at', { ascending: false })

    if (selectedCollection) {
      const { data: collectionPosts } = await supabase
        .from('collection_posts')
        .select('post_id')
        .eq('collection_id', selectedCollection)

      if (collectionPosts) {
        const postIds = collectionPosts.map((cp) => cp.post_id)
        if (postIds.length > 0) {
          query = query.in('id', postIds)
        } else {
          setPosts([])
          setLoading(false)
          return
        }
      }
    }

    const { data, error } = await query

    if (!error && data) {
      setPosts(data)
    }

    setLoading(false)
  }

  function handleCollectionCreated(newCollection: any) {
    setCollections([...collections, { ...newCollection, post_count: 0 }])
  }

  async function deleteCollection(collectionId: string) {
    if (!confirm('Delete this collection? Posts will not be deleted.')) {
      return
    }

    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', collectionId)

    if (error) {
      console.error('Error deleting collection:', error)
      alert('Failed to delete collection')
      return
    }

    setCollections(collections.filter((c) => c.id !== collectionId))
    if (selectedCollection === collectionId) {
      setSelectedCollection(null)
    }
  }

  const filteredPosts = posts.filter((post) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      post.content?.toLowerCase().includes(query) ||
      post.author_name?.toLowerCase().includes(query) ||
      post.author_headline?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium whitespace-nowrap"
        >
          + New Collection
        </button>
      </div>

      {collections.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium text-gray-700">Filter by collection:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCollection(null)}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedCollection === null
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Posts
            </button>
            {collections.map((collection) => (
              <div key={collection.id} className="relative group">
                <button
                  onClick={() => setSelectedCollection(collection.id)}
                  className={`px-3 py-1.5 rounded-lg transition flex items-center gap-2 ${
                    selectedCollection === collection.id
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: collection.color }}
                  />
                  <span>{collection.name}</span>
                  <span className="text-xs opacity-60">
                    ({collection.post_count})
                  </span>
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteCollection(collection.id)
                  }}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs hover:bg-red-600"
                  title="Delete collection"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading your library...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {selectedCollection ? 'No posts in this collection' : 'No posts yet'}
          </h3>
          <p className="text-gray-600">
            {selectedCollection
              ? 'Add some posts to this collection'
              : 'Start forwarding posts to build your knowledge base'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{post.author_name}</div>
                  {post.author_headline && (
                    <div className="text-sm text-gray-600">{post.author_headline}</div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(post.captured_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                </div>
                <AddToCollection
                  userId={userId}
                  postId={post.id}
                  onCollectionsUpdate={fetchCollections}
                />
              </div>

              <div className="text-gray-800 mb-4 line-clamp-6">{post.content}</div>

              <div className="flex items-center gap-3">
                
                  href={post.original_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm font-medium"
                >
                  View on LinkedIn →
                </a>
                <span className="text-xs text-gray-400">
                  via {post.source === 'email' ? 'Email' : 'Unknown'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateCollectionModal
        userId={userId}
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleCollectionCreated}
      />
    </div>
  )
}
