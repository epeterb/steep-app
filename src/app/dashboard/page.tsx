'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
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

interface Digest {
  id: string
  week_start: string
  week_end: string
  post_count: number
  created_at: string
  sent_at: string | null
}

export default function Dashboard() {
  const searchParams = useSearchParams()
  const [posts, setPosts] = useState<SavedPost[]>([])
  const [digests, setDigests] = useState<Digest[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [digestResult, setDigestResult] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const [lookingUp, setLookingUp] = useState(false)
  const [linkSent, setLinkSent] = useState(false)
  const [sendingLink, setSendingLink] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    // Check for magic link auth
    const authEmail = searchParams.get('auth')
    const error = searchParams.get('error')

    if (error === 'invalid') {
      setAuthError('Invalid or already used login link.')
    } else if (error === 'expired') {
      setAuthError('Login link has expired. Please request a new one.')
    }

    if (authEmail) {
      localStorage.setItem('steep_user_email', decodeURIComponent(authEmail))
      loadUserByEmail(decodeURIComponent(authEmail))
      // Clean URL
      window.history.replaceState({}, '', '/dashboard')
      return
    }

    const storedEmail = localStorage.getItem('steep_user_email')
    if (storedEmail) {
      setUserEmail(storedEmail)
      loadUserByEmail(storedEmail)
    } else {
      setLoading(false)
    }
  }, [searchParams])

  async function loadUserByEmail(email: string) {
    setLookingUp(true)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (userError || !userData) {
      setLookingUp(false)
      setLoading(false)
      localStorage.removeItem('steep_user_email')
      return
    }

    setUser(userData)
    localStorage.setItem('steep_user_email', email)

    const { data: postsData } = await supabase
      .from('saved_posts')
      .select('*')
      .eq('user_id', userData.id)
      .order('captured_at', { ascending: false })

    if (postsData) {
      setPosts(postsData)
    }

    const { data: digestsData } = await supabase
      .from('weekly_digests')
      .select('*')
      .eq('user_id', userData.id)
      .order('created_at', { ascending: false })

    if (digestsData) {
      setDigests(digestsData)
    }

    setLookingUp(false)
    setLoading(false)
  }

  async function handleSendMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setSendingLink(true)
    setAuthError(null)

    try {
      const response = await fetch('/api/auth/send-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail })
      })

      const data = await response.json()

      if (data.success) {
        setLinkSent(true)
      } else {
        setAuthError(data.error || 'Failed to send login link')
      }
    } catch (error) {
      setAuthError('Something went wrong. Please try again.')
    }

    setSendingLink(false)
  }

  function logout() {
    localStorage.removeItem('steep_user_email')
    setUser(null)
    setPosts([])
    setDigests([])
    setUserEmail('')
    setLinkSent(false)
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

      if (data.error) {
        setDigestResult(`Error: ${data.error}`)
      } else if (data.post_count === 0) {
        setDigestResult('No posts to digest this week. Start forwarding some posts!')
      } else {
        setDigestResult(`Digest generated with ${data.post_count} posts!`)
        const { data: digestsData } = await supabase
          .from('weekly_digests')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        if (digestsData) {
          setDigests(digestsData)
        }
      }
    } catch (error) {
      setDigestResult('Failed to generate digest')
    }

    setGenerating(false)
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  // Login screen
  if (!user && !loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto px-6 py-20">
          <div className="text-center mb-8">
            <a href="/" className="text-4xl font-bold text-gray-900">☕ Steep</a>
            <p className="text-gray-600 mt-2">Sign in to your dashboard</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            {linkSent ? (
              <div className="text-center">
                <div className="text-4xl mb-4">📧</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Check your email!</h3>
                <p className="text-gray-600 mb-4">
                  We sent a login link to <strong>{userEmail}</strong>
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  The link expires in 15 minutes.
                </p>
                <button
                  onClick={() => setLinkSent(false)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Use a different email
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendMagicLink}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="peter@example.com"
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {authError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {authError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={sendingLink}
                  className="w-full bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition disabled:opacity-50"
                >
                  {sendingLink ? 'Sending...' : 'Send me a login link →'}
                </button>
              </form>
            )}
            
            <div className="mt-4 text-center">
              <a href="/" className="text-sm text-gray-500 hover:text-gray-700">
                Don't have an account? Sign up
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <a href="/" className="text-2xl font-bold text-gray-900">☕ Steep</a>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.name}</span>
              <button 
                onClick={logout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Your Steep Email</h2>
              <p className="text-gray-600 font-mono bg-gray-100 px-3 py-1 rounded mt-1 inline-block">
                {user?.steep_email}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Forward LinkedIn posts to this address to save them.
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                {user?.plan} plan
              </span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Saved Posts</h2>
              <span className="text-gray-500">{posts.length} total</span>
            </div>

            {posts.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="text-4xl mb-4">📭</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts yet</h3>
                <p className="text-gray-600 mb-4">
                  Forward your first LinkedIn post to<br/>
                  <span className="font-mono text-gray-900">{user?.steep_email}</span>
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <div key={post.id} className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="font-semibold text-gray-900">{post.author_name}</span>
                        {post.author_headline && (
                          <span className="text-gray-500 text-sm ml-2">{post.author_headline}</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">{formatDate(post.captured_at)}</span>
                    </div>
                    
                    {post.content && (
                      <p className="text-gray-700 mb-3 whitespace-pre-wrap line-clamp-4">
                        {post.content}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        {post.tags?.map((tag) => (
                          <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                      {post.original_url && (
                        <a 
                          href={post.original_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 text-sm hover:underline"
                        >
                          View original →
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Digests</h2>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
              <button
                onClick={generateDigest}
                disabled={generating || posts.length === 0}
                className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg font-semibold hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? 'Brewing...' : '☕ Generate Digest'}
              </button>
              
              {digestResult && (
                <p className="text-sm text-gray-600 mt-3 text-center">{digestResult}</p>
              )}
              
              <p className="text-xs text-gray-500 mt-3 text-center">
                Digests are also sent automatically every Saturday.
              </p>
            </div>

            {digests.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">Past Digests</h3>
                {digests.map((digest) => (
                  <a 
                    key={digest.id}
                    href={`/digest/${digest.id}`}
                    className="block bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
