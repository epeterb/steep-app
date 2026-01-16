'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function HomeContent() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [referrer, setReferrer] = useState<string | null>(null)
  const [result, setResult] = useState<{
    success?: boolean
    steep_email?: string
    error?: string
  } | null>(null)

  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) setReferrer(ref)
  }, [searchParams])

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, referrer })
      })

      const data = await response.json()

      if (data.success) {
        setResult({ success: true, steep_email: data.user.steep_email })
        setEmail('')
        setName('')
      } else {
        setResult({ error: data.error })
      }
    } catch {
      setResult({ error: 'Something went wrong. Please try again.' })
    }

    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">☕ Steep</h1>
          <p className="text-xl text-gray-600 mb-2">Let your ideas brew</p>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-12">
            Forward LinkedIn posts you don't have time to explore. Get a personalized weekly digest that connects the dots.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center p-6">
            <div className="text-4xl mb-4">📧</div>
            <h3 className="font-semibold text-lg mb-2">Forward</h3>
            <p className="text-gray-600">See an interesting post? Forward it to your Steep email. That's it.</p>
          </div>
          <div className="text-center p-6">
            <div className="text-4xl mb-4">🧠</div>
            <h3 className="font-semibold text-lg mb-2">Brew</h3>
            <p className="text-gray-600">AI processes your saves, finds patterns, and surfaces insights.</p>
          </div>
          <div className="text-center p-6">
            <div className="text-4xl mb-4">☕</div>
            <h3 className="font-semibold text-lg mb-2">Digest</h3>
            <p className="text-gray-600">Every weekend, get a curated digest of what you captured.</p>
          </div>
        </div>

        <div className="bg-gray-900 text-white rounded-2xl p-8 mb-16" id="signup">
          <h2 className="text-2xl font-bold mb-2 text-center">Start steeping today</h2>
          <p className="text-gray-400 mb-6 text-center">Free 14-day trial • No credit card required</p>

          {result?.success ? (
            <div className="bg-green-900/50 border border-green-500 rounded-xl p-6 text-center max-w-md mx-auto">
              <div className="text-3xl mb-3">🎉</div>
              <h3 className="text-xl font-semibold mb-2">You're in!</h3>
              <p className="text-gray-300 mb-4">Your personal Steep email is:</p>
              <div className="bg-gray-800 rounded-lg px-4 py-3 font-mono text-lg text-green-400 mb-4 break-all">{result.steep_email}</div>
              <p className="text-gray-400 text-sm mb-4">Forward LinkedIn posts to this address and they'll appear in your dashboard.</p>
              <a href="/dashboard" className="inline-block bg-white text-gray-900 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition">Go to Dashboard →</a>
            </div>
          ) : (
            <form onSubmit={handleSignup} className="max-w-md mx-auto">
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium mb-2">Your name</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Peter"
                  required
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="mb-6">
                <label htmlFor="email" className="block text-sm font-medium mb-2">Email address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="peter@example.com"
                  required
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              {result?.error && (
                <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-200 text-sm">{result.error}</div>
              )}
              <button type="submit" disabled={loading} className="w-full bg-white text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'Creating your account...' : 'Get my Steep email →'}
              </button>
            </form>
          )}
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">Simple pricing</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-gray-200 rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-2">Free Trial</h3>
              <div className="text-3xl font-bold mb-4">$0</div>
              <p className="text-gray-600 text-sm mb-4">14 days, full access</p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>✓ Unlimited saves</li>
                <li>✓ Weekly digest</li>
                <li>✓ AI-powered themes</li>
              </ul>
            </div>
            <div className="border-2 border-gray-900 rounded-xl p-6 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1 rounded-full">Popular</div>
              <h3 className="font-semibold text-lg mb-2">Monthly</h3>
              <div className="text-3xl font-bold mb-4">$4.99<span className="text-lg font-normal text-gray-500">/mo</span></div>
              <p className="text-gray-600 text-sm mb-4">Cancel anytime</p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>✓ Everything in trial</li>
                <li>✓ Trend analysis</li>
                <li>✓ Profile insights</li>
              </ul>
            </div>
            <div className="border border-gray-200 rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-2">Lifetime</h3>
              <div className="text-3xl font-bold mb-4">$199</div>
              <p className="text-gray-600 text-sm mb-4">One-time payment</p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>✓ Everything forever</li>
                <li>✓ Early adopter pricing</li>
                <li>✓ Priority support</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="text-center">
          <a href="/dashboard" className="text-gray-600 hover:text-gray-900 underline">Already have an account? Go to dashboard →</a>
        </div>

        <div className="text-center mt-16 text-gray-500 text-sm">
          <p>A <a href="https://syndesi.co" className="underline hover:text-gray-700">Syndesi</a> project</p>
        </div>
      </div>
    </main>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="text-gray-500">Loading...</div></div>}>
      <HomeContent />
    </Suspense>
  )
}
