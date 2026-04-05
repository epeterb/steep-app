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

export default function BrewingPreview({ userId, digestDay }: Props) {
  const [count, setCount] = useState<number>(0)
  const [authors, setAuthors] = useState<string[]>([])
  const [daysUntil, setDaysUntil] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBrewing()
  }, [userId])

  async function fetchBrewing() {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const { data } = await supabase
      .from('saved_posts')
      .select('author_name')
      .eq('user_id', userId)
      .gte('captured_at', weekAgo.toISOString())
      .order('captured_at', { ascending: false })

    if (data) {
      setCount(data.length)
      const unique = Array.from(new Set(data.map((p: any) => p.author_name).filter(Boolean)))
      setAuthors(unique.slice(0, 3))
    }

    const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
    const todayIndex = new Date().getDay()
    const targetIndex = days.indexOf(digestDay?.toLowerCase() || 'saturday')
    const diff = (targetIndex - todayIndex + 7) % 7
    setDaysUntil(diff === 0 ? 7 : diff)
    setLoading(false)
  }

  if (loading || count === 0) return null

  const dayLabel = daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="text-2xl">☕</div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {count} {count === 1 ? 'post' : 'posts'} steeping for {dayLabel}'s digest
            </p>
            {authors.length > 0 && (
              <p className="text-xs text-gray-500 mt-0.5">
                From {authors.join(', ')}{authors.length < count ? ' and others' : ''}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {Array.from({ length: Math.min(count, 5) }).map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-amber-400"
                style={{ opacity: 1 - i * 0.15 }}
              />
            ))}
            {count > 5 && (
              <div className="w-2 h-2 rounded-full bg-amber-200" />
            )}
          </div>
          <span className="text-xs text-gray-400 ml-1">brewing</span>
        </div>
      </div>
    </div>
  )
}
