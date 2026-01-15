'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface SavedPost {
  id: string
  source: string
  author_name: string
  author_headline: string | null
  content: string
  original_url: string | null
  captured_at: string
  tags: string[]
}

interface User {
  id: string
  name: string
  email: string
  steep_email: string
  plan: string
}

export default function Dashboard() {
  const [posts, setPosts] = useState<SavedPost[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [digestResult, setDigestResult] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    // For now, load the first user (Peter)
    // In production, this would use auth
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('steep_email', 'peter@in.steep.news')
      .single()

    if (userData) {
      setUser(userData)

      const { data: postsData } = await supabase
        .from('saved_posts')
        .select('*')
        .eq('user_id', userData.id)
        .order('captured_at', { ascending: false })
        .limit(50)

      if (postsData) {
        setPosts(postsData)
      }
    }

    setLoading(false)
  }

  async function generateDigest() {
    if (!user) return
    
    setGenerating(true)
    setDigestResult(null)
    
    try {
      const response = await fetch('/api/digest/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setDigestResult(`✅ Digest generated! ${data.post_count} posts processed.`)
      } else {
        setDigestResult(`⚠️ ${data.message || data.error}`)
      }
    } catch (error) {
      setDigestResult('❌ Error generating digest')
    }
    
    setGenerating(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <a href="/" className="text-xl font-bold">☕ Steep</a>
          {user && (
            <div className="text-sm text-gray-600">
              {user.name} • <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{user.steep_email}</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats & Actions */}
        <div className="bg-white rounded-xl p-6 mb-8 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold mb-1">Your Saved Posts</h1>
              <p className="text-gray-600">
                {posts.length} posts captured • Forward posts to{' '}
                <span className="font-mono text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded">
                  {user?.steep_email}
                </span>
              </p>
            </div>
            <div>
              <button
                onClick={generateDigest}
                disabled={generating}
                className="bg-gray-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? 'Generating...' : 'Generate Digest'}
              </button>
            </div>
          </div>
          {digestResult && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
              {digestResult}
            </div>
          )}
        </div>

        {/* Posts List */}
        {posts.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <div className="text-5xl mb-4">📭</div>
            <h2 className="text-xl font-semibold mb-2">No posts yet</h2>
            <p className="text-gray-600 mb-4">
              Forward a LinkedIn post to <strong>{user?.steep_email}</strong> to get started.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 max-w-md mx-auto text-left text-sm">
              <p className="font-medium mb-2">How to forward:</p>
              <ol className="list-decimal list-inside text-gray-600 space-y-1">
                <li>Find an interesting LinkedIn post</li>
                <li>Click the three dots (...) menu</li>
                <li>Select "Send via Direct Message" or copy the link</li>
                <li>Email it to your Steep address</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold">{post.author_name}</h3>
                    {post.author_headline && (
                      <p className="text-sm text-gray-500">{post.author_headline}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      post.source === 'linkedin' 
                        ? 'bg-blue-100 text-blue-700' 
                        : post.source === 'substack'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {post.source}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(post.captured_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap line-clamp-4">
                  {post.content}
                </p>
                {post.original_url && (
                  <a 
                    href={post.original_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline mt-3 inline-block"
                  >
                    View original →
                  </a>
                )}
                {post.tags && post.tags.length > 0 && (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {post.tags.map((tag, i) => (
                      <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
