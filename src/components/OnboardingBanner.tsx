'use client'

import { useState, useEffect } from 'react'

interface Props {
  steepEmail: string
  postCount: number
}

export default function OnboardingBanner({ steepEmail, postCount }: Props) {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const wasDismissed = localStorage.getItem('onboarding_dismissed')
    if (wasDismissed) setDismissed(true)
  }, [])

  const dismiss = () => {
    localStorage.setItem('onboarding_dismissed', 'true')
    setDismissed(true)
  }

  if (dismissed || postCount > 0) return null

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-base font-semibold text-amber-900 mb-1">
            You're all set — here's how to start steeping
          </h3>
          <p className="text-sm text-amber-800 mb-4">
            When you see a LinkedIn post worth saving, forward it to your personal Steep address below.
            Every Saturday we'll distill everything into your weekly digest.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-white border border-amber-300 rounded-lg px-4 py-2 font-mono text-sm font-medium text-gray-800 select-all">
              {steepEmail}
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(steepEmail)}
              className="text-sm font-medium text-amber-700 hover:text-amber-900 underline underline-offset-2"
            >
              Copy address
            </button>
          </div>
        </div>
        <button
          onClick={dismiss}
          className="text-amber-400 hover:text-amber-600 text-xl leading-none mt-0.5"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
      <div className="mt-4 flex items-center gap-6 text-xs text-amber-700 flex-wrap">
        <span>① Forward any LinkedIn post to your address</span>
        <span>② We parse and save it automatically</span>
        <span>③ Get your digest every Saturday</span>
      </div>
    </div>
  )
}
