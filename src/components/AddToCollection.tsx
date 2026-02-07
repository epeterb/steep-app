'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface AddToCollectionProps {
  userId: string
  postId: string
  onCollectionsUpdate?: () => void
}

export default function AddToCollection({
  userId,
  postId,
  onCollectionsUpdate,
}: AddToCollectionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [collections, setCollections] = useState<any[]>([])
  const [postCollections, setPostCollections] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      loadCollections()
    }
  }, [isOpen, userId])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadCollections = async () => {
    setLoading(true)

    const { data: allCollections } = await supabase
      .from('collections')
      .select('*')
      .eq('user_id', userId)
      .order('name')

    const { data: existingCollections } = await supabase
      .from('collection_posts')
      .select('collection_id')
      .eq('post_id', postId)

    if (allCollections) {
      setCollections(allCollections)
    }

    if (existingCollections) {
      setPostCollections(new Set(existingCollections.map((c) => c.collection_id)))
    }

    setLoading(false)
  }

  const toggleCollection = async (collectionId: string) => {
    const isInCollection = postCollections.has(collectionId)

    if (isInCollection) {
      const { error } = await supabase
        .from('collection_posts')
        .delete()
        .eq('collection_id', collectionId)
        .eq('post_id', postId)

      if (error) {
        console.error('Error removing from collection:', error)
        alert('Failed to remove from collection')
        return
      }

      setPostCollections((prev) => {
        const next = new Set(prev)
        next.delete(collectionId)
        return next
      })
    } else {
      const { error } = await supabase.from('collection_posts').insert({
        collection_id: collectionId,
        post_id: postId,
      })

      if (error) {
        console.error('Error adding to collection:', error)
        alert('Failed to add to collection')
        return
      }

      setPostCollections((prev) => new Set(prev).add(collectionId))
    }

    onCollectionsUpdate?.()
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition flex items-center gap-1"
        title="Add to collection"
      >
        <span>📁</span>
        <span className="hidden sm:inline">Collections</span>
        {postCollections.size > 0 && (
          <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            {postCollections.size}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
          <div className="p-2">
            <div className="text-sm font-medium text-gray-700 px-2 py-1">
              Add to collection
            </div>

            {loading ? (
              <div className="text-center py-4 text-gray-500 text-sm">
                Loading...
              </div>
            ) : collections.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-sm">
                No collections yet
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                {collections.map((collection) => {
                  const isChecked = postCollections.has(collection.id)
                  return (
                    <button
                      key={collection.id}
                      onClick={() => toggleCollection(collection.id)}
                      className="w-full px-2 py-2 hover:bg-gray-50 rounded flex items-center gap-2 text-left transition"
                    >
                      <div className="flex-shrink-0">
                        {isChecked ? (
                          <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded border-2 border-gray-300" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: collection.color }}
                        />
                        <span className="text-sm text-gray-900 truncate">
                          {collection.name}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
