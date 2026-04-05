'use client'

import { useState, useEffect } from 'react'

interface Props {
  digestCount: number
  userEmail: string
}

export default function ReferralPrompt({ digestCount, userEmail }: Props) {
  const [dismissed, setDismissed] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const wasDismissed = localStorage.getItem('referral_dismissed')
    if (wasDismissed) setDismissed(true)
  }, [])

  const dismiss = () => {
    localStorage.setItem('referral_dismissed', 'true')
    setDismissed(true)
  }

  const referralLink = `https://steep.news/login?ref=${encodeURIComponent(userEmail)}`

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareText = `I've been using Steep to turn my LinkedIn saves into a weekly intelligence digest. Worth checking out — it's free right now: ${referralLink}`

  // Only show after first digest, and not dismissed
  if (dismissed || digestCount < 1) return null

  return (
    <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-6 mb-8 text-white">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🎁</span>
            <h3 className="text-base font-semibold">Know someone who'd love this?</h3>
          </div>
          <p className="text-sm text-gray-300 mb-4">
            Share Steep with a colleague. When billing launches, you both get a free year of Pro.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={copyLink}
              className="bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors"
            >
              {copied ? '✓ Copied!' : 'Copy referral link'}
            </button>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-gray-300 hover:text-white underline underline-offset-2 transition-colors"
            >
              Share on LinkedIn
            </a>
            <a
              href={`mailto:?subject=You should try Steep&body=${encodeURIComponent(shareText)}`}
              className="text-sm font-medium text-gray-300 hover:text-white underline underline-offset-2 transition-colors"
            >
              Send via email
            </a>
          </div>
        </div>
        <button
          onClick={dismiss}
          className="text-gray-500 hover:text-gray-300 text-xl leading-none mt-0.5"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  )
}
