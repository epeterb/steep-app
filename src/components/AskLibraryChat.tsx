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

  const formatAnswer = (text: string) => {
    let html = text
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    html = html.replace(/^- (.*$)/gim, '<li class="ml-4 mb-1">$1</li>')
    html = html.replace(/\n\n/g, '<br/><br/>')
    return html
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🤔</span>
        <h3 className="text-lg font-semibold text-gray-900">Ask Your Library</h3>
      </div>
      
      <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
        {messages.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-2 font-medium">Ask questions about your saved posts</p>
            <p className="text-sm text-gray-400">Try: "What are the main themes?" or "Who talks about AI?"</p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i}>
            {m.role === 'user' ? (
              <div className="bg-blue-50 p-4 rounded-lg ml-12 border border-blue-100">
                <div className="text-xs font-semibold text-blue-600 mb-1.5">YOU ASKED</div>
                <div className="text-gray-900 font-medium">{m.text}</div>
              </div>
            ) : (
              <div className="bg-gray-50 p-5 rounded-lg mr-12 border border-gray-200">
                <div className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">AI ANSWER</div>
                <div 
                  className="text-gray-800 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: formatAnswer(m.text) }}
                />
                
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-gray-300">
                    <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                      📚 Sources ({m.sources.length})
                    </div>
                    <div className="grid gap-2">
                      {m.sources.map((s: any, j: number) => (
                        
                          key={j}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-200 hover:border-blue-400 hover:shadow-sm transition-all group"
                        >
                          <div className="text-2xl">📄</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {s.author}
                            </div>
                            <div className="text-xs text-gray-500">
                              View original post →
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="bg-gray-50 p-5 rounded-lg mr-12 border border-gray-200">
            <div className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">AI ANSWER</div>
            <div className="flex items-center gap-2 text-gray-500">
              <div className="animate-pulse">Analyzing your library...</div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleAsk(); }} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your saves..."
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button 
          type="submit"
          disabled={loading || !input.trim()} 
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow"
        >
          {loading ? '⏳' : 'Ask'}
        </button>
      </form>
    </div>
  )
}
