'use client'

import { useState } from 'react'

type Props = {
  userId: string
  collectionId?: string
}

function renderAnswer(text: string) {
  const html = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-blue-600 hover:underline">$1</a>')
    .replace(/^### (.*$)/gim, '<p class="font-semibold mt-3 mb-1">$1</p>')
    .replace(/^## (.*$)/gim, '<p class="font-semibold mt-3 mb-1">$1</p>')
    .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc">$1</li>')
    .replace(/\n\n/g, '</p><p class="mb-2">')
    .replace(/\n/g, '<br/>')
  return '<p class="mb-2">' + html + '</p>'
}

export default function AskLibraryChat(props: Props) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: any) {
    e.preventDefault()
    if (!input.trim() || loading) return

    const question = input
    setInput('')
    const newMessages = [...messages, { role: 'user', text: question }]
    setMessages(newMessages)
    setLoading(true)

    fetch('/api/library/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        user_id: props.userId,
        collection_id: props.collectionId
      })
    })
      .then(res => res.json())
      .then(data => {
        setMessages([...newMessages, {
          role: 'ai',
          text: data.answer,
          sources: data.citations
        }])
        setLoading(false)
      })
      .catch(() => {
        setMessages([...newMessages, { role: 'ai', text: 'Something went wrong. Please try again.' }])
        setLoading(false)
      })
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Ask Your Library</h3>

      {messages.length > 0 && (
        <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
          {messages.map((m, i) => (
            <div
              key={i}
              className={m.role === 'user'
                ? 'bg-blue-50 px-4 py-3 rounded-lg text-sm text-gray-800'
                : 'bg-gray-50 px-4 py-3 rounded-lg text-sm text-gray-800'
              }
            >
              <div className="text-xs font-medium text-gray-400 mb-1">
                {m.role === 'user' ? 'You' : 'Steep AI'}
              </div>
              {m.role === 'ai' ? (
                <>
                  <div
                    className="leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderAnswer(m.text) }}
                  />
                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap gap-2">
                      {m.sources.map((s: any, j: number) => (
                        <a
                          key={j}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline bg-white border border-blue-100 px-2 py-1 rounded"
                        >
                          {s.author} →
                        </a>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p>{m.text}</p>
              )}
            </div>
          ))}
          {loading && (
            <div className="bg-gray-50 px-4 py-3 rounded-lg text-sm text-gray-400">
              <div className="text-xs font-medium mb-1">Steep AI</div>
              Searching your library...
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about your saves..."
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? '...' : 'Ask'}
        </button>
      </form>
    </div>
  )
}
