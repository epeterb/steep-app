'use client'

import { useState } from 'react'

type Props = {
  userId: string
  collectionId?: string
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
    setMessages([...messages, { role: 'user', text: question }])
    setLoading(true)

    fetch('/api/library/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        question: question,
        user_id: props.userId,
        collection_id: props.collectionId 
      })
    })
    .then(res => res.json())
    .then(data => {
      setMessages([...messages, 
        { role: 'user', text: question }, 
        { role: 'ai', text: data.answer, sources: data.citations }
      ])
      setLoading(false)
    })
    .catch(err => {
      setMessages([...messages, 
        { role: 'user', text: question }, 
        { role: 'ai', text: 'Error' }
      ])
      setLoading(false)
    })
  }

  return (
    <div className="bg-white rounded-lg border p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Ask Your Library</h3>
      
      <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'bg-blue-50 p-3 rounded' : 'bg-gray-50 p-3 rounded'}>
            <div className="text-xs mb-1">{m.role === 'user' ? 'You' : 'AI'}</div>
            <div>{m.text}</div>
            {m.sources && m.sources.map((s: any, j: number) => (
              <a key={j} href={s.url} target="_blank" className="block text-sm text-blue-600 mt-2">
                {s.author}
              </a>
            ))}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your saves..."
          className="flex-1 px-4 py-2 border rounded-lg"
        />
        <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg">
          {loading ? '...' : 'Ask'}
        </button>
      </form>
    </div>
  )
}
