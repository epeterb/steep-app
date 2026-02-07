'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function DigestsTab({ userId }: { userId: string }) {
  const [digests, setDigests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDigests()
  }, [userId])

  const fetchDigests = async () => {
    const { data } = await supabase
      .from('weekly_digests')
      .select('*')
      .eq('user_id', userId)
      .order('week_start', { ascending: false })

    if (data) setDigests(data)
    setLoading(false)
  }

  if (loading) {
    return <div className="text-center py-12">Loading digests...</div>
  }

  if (digests.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">☕</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No digests yet</h3>
        <p className="text-gray-600">Your first digest will arrive this weekend</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {digests.map((digest) => (
        <div key={digest.id} className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Week of {new Date(digest.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </h3>
              <p className="text-sm text-gray-600">
                {digest.post_count} posts · {digest.sent_at ? 'Sent' : 'Draft'}
              </p>
            </div>
          </div>
          <div className="prose max-w-none text-gray-800 line-clamp-6">
            {digest.digest_content?.substring(0, 500)}...
          </div>
        </div>
      ))}
    </div>
  )
}
