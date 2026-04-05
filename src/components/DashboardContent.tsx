'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import LibraryTab from '@/components/LibraryTab'
import DigestsTab from '@/components/DigestsTab'
import SettingsTab from '@/components/SettingsTab'
import OnboardingBanner from '@/components/OnboardingBanner'
import DashboardSummary from '@/components/DashboardSummary'
import ReferralPrompt from '@/components/ReferralPrompt'
import BrewingPreview from '@/components/BrewingPreview'

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

const tabs: { id: Tab; label: string; icon: string; mobileIcon: string }[] = [
  { id: 'library',  label: 'Library',  icon: '📚', mobileIcon: '📚' },
  { id: 'digests',  label: 'Digests',  icon: '📧', mobileIcon: '📧' },
  { id: 'settings', label: 'Settings', icon: '⚙️', mobileIcon: '⚙️' },
]

export default function DashboardContent() {
  const [activeTab, setActiveTab] = useState<Tab>('library')
  const [user, setUser] = useState<UserProfile | null>(null)
  const [postCount, setPostCount] = useState<number>(0)
  const [digestCount, setDigestCount] = useState<number>(0)
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
        const [{ count: posts }, { count: digests }] = await Promise.all([
          supabase.from('saved_posts').select('*', { count: 'exact', head: true }).eq('user_id', data.user.id),
          supabase.from('weekly_digests').select('*', { count: 'exact', head: true }).eq('user_id', data.user.id)
        ])
        setPostCount(posts || 0)
        setDigestCount(digests || 0)
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
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-0">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">☕ Steep</h1>
              <p className="text-gray-500 text-xs sm:text-sm mt-0.5 hidden sm:block">
                {user.name ? `Welcome back, ${user.name.split(' ')[0]}` : 'Your LinkedIn Knowledge Base'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <a href="/pricing" className="text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors hidden sm:block">
                Pricing
              </a>
              <span className="text-xs text-gray-400 hidden lg:block">{user.email}</span>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Desktop tab nav — hidden on mobile */}
      <div className="hidden sm:block bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'library' && (
          <>
            <OnboardingBanner steepEmail={user.steep_email} postCount={postCount} />
            <ReferralPrompt digestCount={digestCount} userEmail={user.email} />
            <DashboardSummary userId={user.id} digestDay={user.digest_day} />
            <BrewingPreview userId={user.id} digestDay={user.digest_day} />
            <LibraryTab userId={user.id} />
          </>
        )}
        {activeTab === 'digests' && <DigestsTab userId={user.id} />}
        {activeTab === 'settings' && <SettingsTab userId={user.id} />}
      </main>

      {/* Mobile bottom nav — visible only on mobile */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors ${
                activeTab === tab.id
                  ? 'text-gray-900'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className="text-xl leading-none">{tab.mobileIcon}</span>
              <span className={`text-xs font-medium ${activeTab === tab.id ? 'text-gray-900' : 'text-gray-400'}`}>
                {tab.label}
              </span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 w-8 h-0.5 bg-gray-900 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </nav>

    </div>
  )
}
