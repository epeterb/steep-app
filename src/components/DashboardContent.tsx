'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import LibraryTab from '@/components/LibraryTab'
import DigestsTab from '@/components/DigestsTab'
import SettingsTab from '@/components/SettingsTab'

type Tab = 'library' | 'digests' | 'settings'

export default function DashboardContent() {
  const [activeTab, setActiveTab] = useState<Tab>('library')
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const authEmail = searchParams.get('auth')
    
    if (authEmail) {
      localStorage.setItem('userEmail', authEmail)
      fetchUserId(authEmail)
    } else {
      const storedEmail = localStorage.getItem('userEmail')
      if (storedEmail) {
        fetchUserId(storedEmail)
      } else {
        router.push('/')
      }
    }
  }, [searchParams, router])

  async function fetchUserId(email: string) {
    try {
      const res = await fetch(`/api/user/by-email?email=${encodeURIComponent(email)}`)
      const data = await res.json()
      
      if (data.user) {
        setUserId(data.user.id)
        setUserEmail(data.user.email)
      } else {
        router.push('/')
      }
    } catch (err) {
      router.push('/')
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

  if (!userId) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🍵 Steep</h1>
              <p className="text-gray-600 mt-1">Your LinkedIn Knowledge Base</p>
            </div>
            <div className="flex items-center gap-4">
              {userEmail && (
                <span className="text-sm text-gray-600">{userEmail}</span>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
            <button
              onClick={() => setActiveTab('library')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'library'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📚 Library
            </button>
            <button
              onClick={() => setActiveTab('digests')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'digests'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📧 Digests
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'settings'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ⚙️ Settings
            </button>
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'library' && <LibraryTab userId={userId} />}
        {activeTab === 'digests' && <DigestsTab userId={userId} />}
        {activeTab === 'settings' && <SettingsTab userId={userId} />}
      </main>
    </div>
  )
}
