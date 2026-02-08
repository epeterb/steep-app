'use client'

import { useState } from 'react'

export default function AskLibraryChat({ userId, collectionId }: { userId: string, collectionId?: string }) {
  const [input, setInput] = useState('')

  return (
    <div className="bg-white rounded-lg border p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Ask Your Library</h3>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask about your saves..."
        className="w-full px-4 py-2 border rounded-lg"
      />
    </div>
  )
}
