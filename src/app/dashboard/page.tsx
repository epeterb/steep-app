'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import LibraryTab from '@/components/LibraryTab'
import DigestsTab from '@/components/DigestsTab'
import SettingsTab from '@/components/SettingsTab'

type Tab = 'library' | 'digests' | 'settings'

export default function DashboardV2() {
  const [activeTab, setActiveTab] = useState<Tab>('library')
  const userId = 'd7b500dd-0089-4fa7-83e7-2c91539950a2'
  const router = useRouter()

  const handleLogout = () => {
    // Clear any session data
    localStorage.clear()
    sessionStorage.clear()
    // Redirect to home
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🍵 Steep</h1>
              <p className="text-gray-600 mt-1">Your LinkedIn Knowledge Base</p>
            </div>
            <div className="flex items-center gap-4">
              <a 
                href="/"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Home
              </a>
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

      {/* Tabs Navigation */}
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

      {/* Tab Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'library' && <LibraryTab userId={userId} />}
        {activeTab === 'digests' && <DigestsTab userId={userId} />}
        {activeTab === 'settings' && <SettingsTab userId={userId} />}
      </main>
    </div>
  )
}
