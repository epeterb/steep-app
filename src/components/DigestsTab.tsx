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
  const [selectedDigest, setSelectedDigest] = useState<Digest | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDigests()
  }, [userId])

  const fetchDigests = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/digests/list?user_id=${userId}`)
      const data = await response.json()
      if (data.digests) {
        setDigests(data.digests)
      }
    } catch (err) {
      setError('Failed to load digests')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const generateDigest = async () => {
    if (!confirm('Generate a new digest from your recent saves?')) return

    try {
      setGenerating(true)
      const response = await fetch('/api/digest/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert(`Digest generated! ${data.post_count} posts processed.`)
        fetchDigests()
      } else {
        alert(data.message || 'No posts to digest')
      }
    } catch (err) {
      alert('Failed to generate digest')
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  const formatWeekRange = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  }

  const formatMarkdown = (markdown: string) => {
    let html = markdown
    
    // Major section headers
    html = html.replace(/^## (.*$)/gim, '<h2 class="major-section">$1</h2>')
    
    // Theme titles
    html = html.replace(/^### (.*$)/gim, '<h3 class="theme-title">$1</h3>')
    
    // Bold text
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong class="label">$1</strong>')
    
    // Italic text
    html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>')
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="link" target="_blank" rel="noopener noreferrer">$1</a>')
    
    // Bullet points
    html = html.replace(/^- (.*$)/gim, '<li class="bullet-item">$1</li>')
    html = html.replace(/(<li class="bullet-item">.*?<\/li>\n?)+/gim, '<ul class="bullet-list">$&</ul>')
    
    // Paragraphs
    html = html.replace(/\n\n/gim, '</p><p class="paragraph">')
    html = html.replace(/\n/gim, '<br>')

    return `
      <style>
        .digest-content {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #1a1a2e;
        }
        
        .digest-content .major-section {
          color: #1a1a2e;
          font-size: 24px;
          font-weight: 700;
          margin: 40px 0 12px 0;
          padding-bottom: 8px;
          border-bottom: 2px solid #e8e8e8;
          letter-spacing: -0.5px;
        }
        
        .digest-content .major-section:first-child {
          margin-top: 0;
        }
        
        .digest-content .theme-title {
          color: #16213e;
          font-size: 20px;
          font-weight: 700;
          margin: 32px 0 8px 0;
          letter-spacing: -0.3px;
        }
        
        .digest-content .paragraph {
          color: #333;
          font-size: 16px;
          line-height: 1.7;
          margin: 8px 0;
        }
        
        .digest-content .label {
          color: #1a1a2e;
          font-weight: 600;
        }
        
        .digest-content .link {
          color: #0066cc;
          text-decoration: none;
          font-weight: 500;
        }
        
        .digest-content .link:hover {
          text-decoration: underline;
        }
        
        .digest-content .bullet-list {
          margin: 8px 0 16px 0;
          padding-left: 24px;
        }
        
        .digest-content .bullet-item {
          color: #333;
          font-size: 16px;
          line-height: 1.6;
          margin: 4px 0;
          padding-left: 8px;
        }
      </style>
      <div class="digest-content">
        <p class="paragraph">${html}</p>
      </div>
    `
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading digests...</div>
      </div>
    )
  }

  if (selectedDigest) {
    return (
      <div className="max-w-4xl">
        <button
          onClick={() => setSelectedDigest(null)}
          className="mb-6 text-gray-600 hover:text-gray-900"
        >
          ← Back to all digests
        </button>
        
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold mb-2">☕ Week of {formatWeekRange(selectedDigest.week_start, selectedDigest.week_end)}</h2>
          <p className="text-gray-600 mb-6">{selectedDigest.post_count} posts saved this week</p>
          
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: formatMarkdown(selectedDigest.digest_content) }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Your Digests</h2>
          <p className="text-gray-600">{digests.length} digests generated</p>
        </div>
        <button
          onClick={generateDigest}
          disabled={generating}
          className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 disabled:opacity-50"
        >
          {generating ? 'Generating...' : 'Generate Digest Now'}
        </button>
      </div>

      {digests.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600 mb-4">No digests yet</p>
          <button
            onClick={generateDigest}
            className="text-blue-600 hover:text-blue-800"
          >
            Generate your first digest →
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {digests.map((digest) => (
            <div
              key={digest.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer"
              onClick={() => setSelectedDigest(digest)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg mb-1">
                    ☕ Week of {new Date(digest.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </h3>
                  <p className="text-gray-600 text-sm mb-2">
                    {formatWeekRange(digest.week_start, digest.week_end)}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-600">☕ {digest.post_count} posts</span>
                    {digest.sent_at ? (
                      <span className="text-green-600">✅ Sent {new Date(digest.sent_at).toLocaleDateString()}</span>
                    ) : (
                      <span className="text-gray-400">⏳ Not sent yet</span>
                    )}
                  </div>
                </div>
                <button className="text-blue-600 hover:text-blue-800">
                  View →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
