'use client'

import { useState, useEffect } from 'react'

interface UserSettings {
  email: string
  name: string
  steep_email: string
  digest_day: string
  plan: string
  created_at: string
}

export default function SettingsTab({ userId }: { userId: string }) {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Form state
  const [digestDay, setDigestDay] = useState('saturday')
  const [name, setName] = useState('')

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/user/settings?user_id=${userId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch settings')
      }

      const data = await response.json()
      setSettings(data.user)
      setDigestDay(data.user.digest_day || 'saturday')
      setName(data.user.name || '')
      setError(null)
    } catch (err) {
      console.error('Error fetching settings:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      setSaving(true)
      setSuccessMessage(null)

      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          digest_day: digestDay,
          name: name
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      setSuccessMessage('Settings saved successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)

      // Refresh settings
      await fetchSettings()

    } catch (err) {
      console.error('Error saving settings:', err)
      alert(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="mt-4 text-gray-600">Loading settings...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Error: {error}</p>
        <button 
          onClick={() => fetchSettings()}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!settings) {
    return null
  }

  return (
    <div className="max-w-3xl">
      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          ✅ {successMessage}
        </div>
      )}

      {/* Profile Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Profile</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={settings.email}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-sm text-gray-500 mt-1">
              Email cannot be changed
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plan
            </label>
            <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
              <span className="font-medium text-gray-900 capitalize">
                {settings.plan}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Member Since
            </label>
            <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
              <span className="text-gray-700">
                {formatDate(settings.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Steep Email Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Your Steep Email</h2>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-2">
            Forward LinkedIn posts to this email to save them:
          </p>
          <div className="flex items-center justify-between">
            <code className="text-lg font-mono text-gray-900">
              {settings.steep_email}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(settings.steep_email)
                alert('Email copied to clipboard!')
              }}
              className="ml-4 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800"
            >
              Copy
            </button>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <p className="font-medium mb-2">How to save a post:</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Click the "..." menu on any LinkedIn post</li>
            <li>Select "Share via email"</li>
            <li>Send to <strong>{settings.steep_email}</strong></li>
          </ol>
        </div>
      </div>

      {/* Digest Preferences */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Digest Preferences</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Digest Delivery Day
            </label>
            <select
              value={digestDay}
              onChange={(e) => setDigestDay(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              <option value="monday">Monday</option>
              <option value="tuesday">Tuesday</option>
              <option value="wednesday">Wednesday</option>
              <option value="thursday">Thursday</option>
              <option value="friday">Friday</option>
              <option value="saturday">Saturday</option>
              <option value="sunday">Sunday</option>
            </select>
            <p className="text-sm text-gray-500 mt-2">
              Your weekly digest will be sent every {digestDay.charAt(0).toUpperCase() + digestDay.slice(1)} at 6:00 AM CST
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="px-8 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
        >
          {saving ? (
            <span className="flex items-center">
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
              Saving...
            </span>
          ) : (
            'Save Settings'
          )}
        </button>
      </div>
    </div>
  )
}
