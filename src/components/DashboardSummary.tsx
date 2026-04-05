'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Props {
  userId: string
  digestDay: string
}

export default function DashboardSummary({ userId, digestDay }: Props) {
  const [postsThisWeek, setPostsThisWeek] = useState<number>(0)
  const [totalPosts, setTotalPosts] = useState<number>(0)
  const [weeksActive, setWeeksActive] = useState<number>(0)
  const [daysUntilDigest, setDaysUntilDigest] = useState<number>(0)

  useEffect(() => {
    fetchStats()
  }, [userId])

  async function fetchStats() {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const [{ count: weekCount }, { count: totalCount }, { count: digestCount }] = await Promise.all([
      supabase.from('saved_posts').select('*', { count: 'exact', head: true })
        .eq('user_id', userId).gte('captured_at', weekAgo.toISOString()),
      supabase.from('saved_posts').select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase.from('weekly_digests').select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
    ])

    setPostsThisWeek(weekCount || 0)
    setTotalPosts(totalCount || 0)
    setWeeksActive(digestCount || 0)

    const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
    const todayIndex = new Date().getDay()
    const targetIndex = days.indexOf(digestDay?.toLowerCase() || 'saturday')
    const diff = (targetIndex - todayIndex + 7) % 7
    setDaysUntilDigest(diff === 0 ? 7 : diff)
  }

  const digestLabel = daysUntilDigest === 1 ? 'tomorrow' : `in ${daysUntilDigest} days`

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">This Week</p>
        <p className="text-2xl font-bold text-gray-900">{postsThisWeek}</p>
        <p className="text-xs text-gray-500 mt-0.5">posts saved</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Library</p>
        <p className="text-2xl font-bold text-gray-900">{totalPosts}</p>
        <p className="text-xs text-gray-500 mt-0.5">posts saved</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Next Digest</p>
        <p className="text-2xl font-bold text-gray-900">{digestLabel}</p>
        <p className="text-xs text-gray-500 mt-0.5">{digestDay ? digestDay.charAt(0).toUpperCase() + digestDay.slice(1) : 'Saturday'}</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Weeks Active</p>
        <p className="text-2xl font-bold text-gray-900">{weeksActive}</p>
        <p className="text-xs text-gray-500 mt-0.5">digests received</p>
      </div>
    </div>
  )
}
