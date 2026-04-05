'use client'

import { useState } from 'react'

const STRIPE_ENABLED = process.env.NEXT_PUBLIC_STRIPE_ENABLED === 'true'

export default function PricingPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCheckout = async () => {
    if (!email) {
      setError('Please enter your email address')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Something went wrong')
      }
    } catch {
      setError('Failed to start checkout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-20">

        <div className="text-center mb-16">
          <a href="/" className="text-3xl font-bold text-gray-900">☕ Steep</a>
          <p className="text-gray-500 mt-2">Your LinkedIn Knowledge Base</p>
          <div className="mt-6">
            <span className="inline-block bg-amber-100 text-amber-800 text-sm font-medium px-4 py-1.5 rounded-full">
              🎉 Founding member pricing — locked in forever
            </span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mt-6 mb-4">Simple, honest pricing</h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            One plan. Everything included. No per-seat nonsense.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">

          {/* Free card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Early Access</h2>
              <p className="text-gray-500 text-sm">For founding members</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900">Free</span>
              <span className="text-gray-500 ml-2">during early access</span>
            </div>
            <ul className="space-y-3 mb-8">
              {['Unlimited post saves','Weekly AI digest','Collections & tagging','Ask Your Library (AI chat)','Priority support','Founding member badge'].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-gray-700">
                  <span className="text-green-500 font-bold">✓</span>{f}
                </li>
              ))}
            </ul>
            <a
              href="/login"
              className="block text-center bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition"
            >
              Get started free
            </a>
          </div>

          {/* Pro card */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <span className="bg-amber-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full">
                EARLY ADOPTER RATE
              </span>
            </div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-1">Pro</h2>
              <p className="text-gray-400 text-sm">
                {STRIPE_ENABLED ? 'Lock in your founding rate' : 'When billing goes live'}
              </p>
            </div>
            <div className="mb-2">
              <span className="text-4xl font-bold text-white">$9.95</span>
              <span className="text-gray-400 ml-2">/ year</span>
            </div>
            <p className="text-gray-500 text-xs mb-6">That's $0.83/month. Less than a coffee.</p>
            <ul className="space-y-3 mb-8">
              {['Everything in Early Access','Digest frequency control','Export your library','Referral rewards','Early access to new features'].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-gray-300">
                  <span className="text-amber-400 font-bold">✓</span>{f}
                </li>
              ))}
            </ul>

            {STRIPE_ENABLED ? (
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Your Steep email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                {error && <p className="text-red-400 text-xs">{error}</p>}
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full bg-amber-400 text-gray-900 py-3 rounded-xl font-semibold hover:bg-amber-300 transition disabled:opacity-60"
                >
                  {loading ? 'Redirecting...' : 'Upgrade to Pro — $9.95/yr'}
                </button>
              </div>
            ) : (
              <button
                disabled
                className="w-full text-center bg-amber-400 text-gray-900 py-3 rounded-xl font-semibold opacity-75 cursor-not-allowed"
              >
                Coming soon — you'll be first to know
              </button>
            )}
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Common questions</h2>
          <div className="space-y-6">
            {[
              { q: 'When does billing start?', a: "It doesn't yet. Early members get full access free while we build. When we turn on billing, founding members lock in the $9.95/year rate permanently." },
              { q: "What happens to my data if I don't upgrade?", a: "Nothing. Your library, digests, and collections stay exactly as they are. We'll give plenty of notice before any changes." },
              { q: 'How does it work?', a: "Forward LinkedIn posts to your personal Steep email address. We parse them, save them to your library, and distill them into a weekly digest every Saturday." },
              { q: 'Is there a referral program?', a: "Coming soon. Refer a colleague and you both get a free year of Pro when billing launches." },
            ].map(({ q, a }) => (
              <div key={q} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                <h3 className="font-semibold text-gray-900 mb-2">{q}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center text-gray-500 text-sm">
          <p>A <a href="https://syndesi.io" className="underline hover:text-gray-700">Syndesi</a> product · <a href="/dashboard" className="underline hover:text-gray-700">Back to dashboard</a></p>
        </div>

      </div>
    </div>
  )
}
