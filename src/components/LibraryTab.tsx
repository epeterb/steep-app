'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
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
    let query = supabase.from('saved_posts').select('*').eq('user_id', userId).order('captured_at', { ascending: false })

    if (selectedCollection) {
      const { data: cp } = await supabase.from('collection_posts').select('post_id').eq('collection_id', selectedCollection)
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

  const filtered = posts.filter(p => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return p.content?.toLowerCase().includes(q) || p.author_name?.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg"
        />
        <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
          + New Collection
        </button>
      </div>

      {collections.length > 0 && (
        <div className="bg-white rounded-lg border p-4">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setSelectedCollection(null)} className={selectedCollection === null ? 'px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700' : 'px-3 py-1.5 rounded-lg bg-gray-100'}>
              All Posts
            </button>
            {collections.map((c) => (
              <div key={c.id} className="relative group">
                <button onClick={() => setSelectedCollection(c.id)} className={selectedCollection === c.id ? 'px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 flex items-center gap-2' : 'px-3 py-1.5 rounded-lg bg-gray-100 flex items-center gap-2'}>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                  <span>{c.name}</span>
                  <span className="text-xs opacity-60">({c.post_count})</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold">No posts yet</h3>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((post) => (
            <div key={post.id} className="bg-white rounded-lg border p-6">
              <div className="flex justify-between gap-4 mb-4">
                <div>
                  <div className="font-semibold">{post.author_name}</div>
                  <div className="text-sm text-gray-600">{post.author_headline}</div>
                </div>
                <AddToCollection userId={userId} postId={post.id} onCollectionsUpdate={fetchCollections} />
              </div>
              <div className="mb-4">{post.content}</div>
              <a href={post.original_url} target="_blank" className="text-blue-600">View on LinkedIn →</a>
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
