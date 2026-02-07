'use client'

import { useState } from 'react'

type Message = {
  role: 'user' | 'assistant'
  content: string
  citations?: { post_id: string; author: string; url: string }[]
}

export default function AskLibraryChat({ 
  userId, 
  collectionId 
}: { 
  userId: string
  collectionId?: string 
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/library/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: input,
          user_id: userId,
          collection_id: collectionId 
        })
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.answer,
        citations: data.citations
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error asking library:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🤔</span>
        <h3 className="text-lg font-semibold text-gray-900">Ask Your Library</h3>
      </div>

      {/* Messages */}
      <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
        {messages.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-2">Ask questions about your saved posts</p>
            <p className="text-sm">Try: "What are the main themes?" or "Summarize AI trends"</p>
          </div>
        )}

        {messages.map((message, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-lg ${
              message.role === 'user'
                ? 'bg-blue-50 ml-12'
                : 'bg-gray-50 mr-12'
            }`}
          >
            <div className="font-medium text-sm text-gray-600 mb-1">
              {message.role === 'user' ? 'You' : 'AI'}
            </div>
            <div className="text-gray-900 whitespace-pre-wrap">
              {message.content}
            </div>

            {/* Citations */}
            {message.citations && message.citations.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs font-medium text-gray-500 mb-2">
                  Sources:
                </div>
                <div className="space-y-1">
                  {message.citations.map((citation, i) => (
                    
                      key={i}
                      href={citation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-blue-600 hover:underline"
                    >
                      📄 {citation.author}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="p-4 rounded-lg bg-gray-50 mr-12">
            <div className="font-medium text-sm text-gray-600 mb-1">AI</div>
            <div className="text-gray-500">Thinking...</div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your saves..."
          disabled={loading}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Ask
        </button>
      </form>
    </div>
  )
}
