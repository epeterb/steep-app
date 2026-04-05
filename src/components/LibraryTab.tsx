'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import AskLibraryChat from './AskLibraryChat'
import CreateCollectionModal from './CreateCollectionModal'
import AddToCollection from './AddToCollection'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LibraryTab({ userId }: { userId: string }) {
  const [posts, setPosts] = useState<any[]>([])
  const [collections, setCollections] = useState<any[]>([])
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    loadData()
  }, [userId, selectedCollection])

  const loadData = async () => {
    await Promise.all([fetchCollections(), fetchPosts()])
  }

  const fetchCollections = async () => {
    const { data } = await supabase
      .from('collections')
      .select('*')
      .eq('user_id', userId)
      .order('name')

    if (data) {
      const withCounts = await Promise.all(
        data.map(async (c) => {
          const { count } = await supabase
            .from('collection_posts')
            .select('*', { count: 'exact', head: true })
            .eq('collection_id', c.id)
          return { ...c, post_count: count || 0 }
        })
      )
      setCollections(withCounts)
    }
  }

  const fetchPosts = async () => {
    setLoading(true)
    let query = supabase
      .from('saved_posts')
      .select('*')
      .eq('user_id', userId)
      .order('captured_at', { ascending: false })

    if (selectedCollection) {
      const { data: cp } = await supabase
        .from('collection_posts')
        .select('post_id')
        .eq('collection_id', selectedCollection)
      if (cp && cp.length > 0) {
        query = query.in('id', cp.map(x => x.post_id))
      } else {
        setPosts([])
        setLoading(false)
        return
      }
    }

    const { data } = await query
    if (data) setPosts(data)
    setLoading(false)
  }

  const handleGenerateDigest = async () => {
    setGenerating(true)
    try {
      const r = await fetch('/api/digest/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      })
      const d = await r.json()
      alert(d.post_count === 0 ? 'No posts this week yet.' : 'Digest generated! Check your Digests tab.')
    } finally {
      setGenerating(false)
    }
  }

  const filtered = posts.filter(p => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return p.content?.toLowerCase().includes(q) || p.author_name?.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-4">

      {/* Action bar — stacks on mobile */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={handleGenerateDigest}
            disabled={generating}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-60 whitespace-nowrap"
          >
            {generating ? 'Generating...' : 'Generate Digest'}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            + Collection
          </button>
        </div>
      </div>

      {/* Collections filter */}
      {collections.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCollection(null)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedCollection === null
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Posts
            </button>
            {collections.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCollection(c.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                  selectedCollection === c.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                {c.name}
                <span className="text-xs opacity-60">({c.post_count})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <AskLibraryChat userId={userId} collectionId={selectedCollection || undefined} />

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">📚</div>
          <h3 className="text-lg font-semibold text-gray-900">No posts yet</h3>
          <p className="text-gray-500 text-sm mt-1">Forward a LinkedIn post to your Steep address to get started</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((post) => (
            <div key={post.id} className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex justify-between gap-4 mb-3">
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{post.author_name}</div>
                  <div className="text-sm text-gray-500 truncate">{post.author_headline}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(post.captured_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric'
                    })}
                  </div>
                </div>
                <AddToCollection userId={userId} postId={post.id} onCollectionsUpdate={fetchCollections} />
              </div>
              <p className="text-sm text-gray-700 leading-relaxed mb-3 line-clamp-4">{post.content}</p>
              <a
                href={post.original_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                View on LinkedIn →
              </a>
            </div>
          ))}
        </div>
      )}

      <CreateCollectionModal
        userId={userId}
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={(c) => setCollections([...collections, { ...c, post_count: 0 }])}
      />
    </div>
  )
}
