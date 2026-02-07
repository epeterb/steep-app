'use client'

import { useState, useEffect } from 'react'

interface Digest {
  id: string
  week_start: string
  week_end: string
  post_count: number
  digest_content: string
  sent_at: string | null
  created_at: string
}

export default function DigestsTab({ userId }: { userId: string }) {
  const [digests, setDigests] = useState<Digest[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDigest, setSelectedDigest] = useState<Digest | null>(null)

  const fetchDigests = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/digests/list?user_id=${userId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch digests')
      }

      const data = await response.json()
      setDigests(data.digests || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching digests:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const generateDigest = async () => {
    if (!confirm('Generate a digest for this week? This will include all posts saved in the last 7 days.')) {
      return
    }

    try {
      setGenerating(true)
      const response = await fetch('/api/digest/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate digest')
      }

      if (data.post_count === 0) {
        alert('No posts saved this week. Save some posts first!')
        return
      }

      alert(`Digest generated! ${data.post_count} posts processed.`)
      
      // Refresh the list
      await fetchDigests()

    } catch (err) {
      console.error('Error generating digest:', err)
      alert(err instanceof Error ? err.message : 'Failed to generate digest')
    } finally {
      setGenerating(false)
    }
  }

  useEffect(() => {
    fetchDigests()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="mt-4 text-gray-600">Loading your digests...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Error: {error}</p>
        <button 
          onClick={() => fetchDigests()}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
        >
          Try Again
        </button>
      </div>
    )
  }

  // If viewing a specific digest
  if (selectedDigest) {
    return (
      <div>
        <button
          onClick={() => setSelectedDigest(null)}
          className="mb-6 text-gray-600 hover:text-gray-900 flex items-center"
        >
          ← Back to all digests
        </button>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ☕ Your Weekly Steep
            </h2>
            <p className="text-gray-600">
              {formatDate(selectedDigest.week_start)} – {formatDate(selectedDigest.week_end)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {selectedDigest.post_count} posts · {selectedDigest.sent_at ? `Sent ${formatDate(selectedDigest.sent_at)}` : 'Not sent'}
            </p>
          </div>

          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ 
              __html: selectedDigest.digest_content
                .replace(/\n/g, '<br>')
                .replace(/## (.*)/g, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>')
                .replace(/### (.*)/g, '<h3 class="text-xl font-bold mt-6 mb-3">$1</h3>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline">$1</a>')
            }}
          />
        </div>
      </div>
    )
  }

  // List view
  return (
    <div>
      {/* Header with Generate Button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Your Digests</h2>
          <p className="text-gray-600 mt-1">
            {digests.length === 0 
              ? 'No digests yet' 
              : `${digests.length} digest${digests.length === 1 ? '' : 's'} generated`
            }
          </p>
        </div>
        <button
          onClick={generateDigest}
          disabled={generating}
          className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center"
        >
          {generating ? (
            <>
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
              Generating...
            </>
          ) : (
            <>
              ⚡ Generate Digest Now
            </>
          )}
        </button>
      </div>

      {/* Digests List */}
      {digests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-600 mb-2">No digests yet</p>
          <p className="text-gray-500 text-sm mb-6">
            Digests are automatically generated every Saturday at 6am CST
          </p>
          <button
            onClick={generateDigest}
            className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Generate Your First Digest
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {digests.map(digest => (
            <div
              key={digest.id}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition cursor-pointer"
              onClick={() => setSelectedDigest(digest)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    ☕ Week of {formatDate(digest.week_start)}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {formatDate(digest.week_start)} – {formatDate(digest.week_end)}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <span>📚 {digest.post_count} posts</span>
                    <span>•</span>
                    <span>
                      {digest.sent_at 
                        ? `✅ Sent ${formatDate(digest.sent_at)}`
                        : '⏳ Not sent yet'
                      }
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  <span className="text-gray-400 hover:text-gray-600">
                    View →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
