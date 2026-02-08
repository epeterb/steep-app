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
      setMessages([...messages, 
        { role: 'user', text: question }, 
        { role: 'ai', text: data.answer, sources: data.citations }
      ])
    } catch (err) {
      setMessages([...messages, 
        { role: 'user', text: question }, 
        { role: 'ai', text: 'Error occurred' }
      ])
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">🤔 Ask Your Library</h3>
      
      <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i}>
            {m.role === 'user' ? (
              <div className="bg-blue-50 p-3 rounded-lg ml-12 border border-blue-100">
                <div className="font-semibold text-xs text-blue-600 mb-1">YOU</div>
                <div className="text-gray-900">{m.text}</div>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg mr-12 border border-gray-200">
                <div className="font-semibold text-xs text-gray-600 mb-2">AI</div>
                <div className="text-gray-800 whitespace-pre-wrap">{m.text}</div>
                
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-300">
                    <div className="text-xs font-semibold text-gray-600 mb-2">
                      Sources ({m.sources.length})
                    </div>
                    {m.sources.map((s: any, j: number) => (
                      
                        key={j}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 mb-1 rounded bg-white border hover:border-blue-400 transition"
                      >
                        <span>📄</span>
                        <span className="text-sm font-medium text-gray-900">{s.author}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="bg-gray-50 p-4 rounded-lg mr-12">
            <div className="text-gray-500 animate-pulse">Thinking...</div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
          placeholder="Ask about your saves..."
          className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <button 
          onClick={handleAsk} 
          disabled={loading} 
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '...' : 'Ask'}
        </button>
      </div>
    </div>
  )
}
