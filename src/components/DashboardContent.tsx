'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import LibraryTab from '@/components/LibraryTab'
import DigestsTab from '@/components/DigestsTab'
import SettingsTab from '@/components/SettingsTab'
import OnboardingBanner from '@/components/OnboardingBanner'
import DashboardSummary from '@/components/DashboardSummary'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Tab = 'library' | 'digests' | 'settings'

interface UserProfile {
  id: string
  email: string
  name: string
  steep_email: string
  plan: string
  digest_day: string
}

export default function DashboardContent() {
  const [activeTab, setActiveTab] = useState<Tab>('library')
  const [user, setUser] = useState<UserProfile | null>(null)
  const [postCount, setPostCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const authEmail = searchParams.get('auth')
    if (authEmail) {
      localStorage.setItem('userEmail', authEmail)
      fetchUser(authEmail)
    } else {
      const storedEmail = localStorage.getItem('userEmail')
      if (storedEmail) {
        fetchUser(storedEmail)
      } else {
        router.push('/login')
      }
    }
  }, [searchParams, router])

  async function fetchUser(email: string) {
    try {
      const res = await fetch(`/api/user/by-email?email=${encodeURIComponent(email)}`)
      const data = await res.json()

      if (data.user) {
        setUser(data.user)
        const { count } = await supabase
          .from('saved_posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', data.user.id)
        setPostCount(count || 0)
      } else {
        setError('User not found')
        setTimeout(() => router.push('/login'), 2000)
      }
    } catch (err) {
      setError('Failed to load user data')
      setTimeout(() => router.push('/login'), 2000)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('userEmail')
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-2">Error: {error}</div>
          <div className="text-sm text-gray-500">Redirecting to login...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">☕ Steep</h1>
              <p className="text-gray-500 text-sm mt-0.5">
                {user.name ? `Welcome back, ${user.name.split(' ')[0]}` : 'Your LinkedIn Knowledge Base'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-400 hidden md:block">{user.email}</span>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-8">
            {(['library', 'digests', 'settings'] as Tab[]).map((tab) => {
              const labels: Record<Tab, string> = {
                library: '📚 Library',
                digests: '📧 Digests',
                settings: '⚙️ Settings',
              }
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {labels[tab]}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'library' && (
          <>
            <OnboardingBanner steepEmail={user.steep_email} postCount={postCount} />
            <DashboardSummary userId={user.id} digestDay={user.digest_day} />
            <LibraryTab userId={user.id} />
          </>
        )}
        {activeTab === 'digests' && <DigestsTab userId={user.id} />}
        {activeTab === 'settings' && <SettingsTab userId={user.id} />}
      </main>
    </div>
  )
}
