'use client'

import { useState } from 'react'

export default function AskLibraryChat({ userId, collectionId }: { userId: string, collectionId?: string }) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const handleAsk = async () => {
    if (!input.trim()) return
    
    const question = input
    setInput('')
    setMessages([...messages, { role: 'user', text: question }])
    setLoading(true)

    try {
      const res = await fetch('/api/library/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, user_id: userId, collection_id: collectionId })
      })
      const data = await res.json()
      setMessages([...messages, { role: 'user', text: question }, { role: 'ai', text: data.answer, sources: data.citations }])
    } catch (err) {
      setMessages([...messages, { role: 'user', text: question }, { role: 'ai', text: 'Error occurred' }])
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-lg border p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">🤔 Ask Your Library</h3>
      
      <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'bg-blue-50 p-3 rounded' : 'bg-gray-50 p-3 rounded'}>
            <div className="font-medium text-xs mb-1">{m.role === 'user' ? 'You' : 'AI'}</div>
            <div>{m.text}</div>
            {m.sources && m.sources.map((s: any, j: number) => (
              <a key={j} href={s.url} target="_blank" className="block text-sm text-blue-600 mt-2">📄 {s.author}</a>
            ))}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
          placeholder="Ask about your saves..."
          className="flex-1 px-4 py-2 border rounded-lg"
        />
        <button onClick={handleAsk} disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg">
          {loading ? '...' : 'Ask'}
        </button>
      </div>
    </div>
  )
}
