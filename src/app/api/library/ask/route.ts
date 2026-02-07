import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(request: NextRequest) {
  try {
    const { question, user_id, collection_id } = await request.json()

    if (!question || !user_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Fetch user's posts
    let query = supabase
      .from('saved_posts')
      .select('*')
      .eq('user_id', user_id)
      .order('captured_at', { ascending: false })
      .limit(100) // Limit to recent 100 posts to manage token usage

    // If filtering by collection
    if (collection_id) {
      const { data: collectionPosts } = await supabase
        .from('collection_posts')
        .select('post_id')
        .eq('collection_id', collection_id)

      const postIds = collectionPosts?.map(cp => cp.post_id) || []
      query = query.in('id', postIds)
    }

    const { data: posts, error: postsError } = await query

    if (postsError) {
      console.error('Error fetching posts:', postsError)
      return NextResponse.json(
        { error: 'Failed to fetch posts' },
        { status: 500 }
      )
    }

    if (!posts || posts.length === 0) {
      return NextResponse.json({
        answer: "You haven't saved any posts yet. Forward some LinkedIn posts to start building your library!",
        citations: []
      })
    }

    // Prepare posts for Claude
    const postsContext = posts.map((p, idx) => ({
      id: idx + 1,
      post_id: p.id,
      author: p.author_name,
      headline: p.author_headline,
      content: p.content?.substring(0, 1000), // Truncate to manage tokens
      url: p.original_url,
      date: p.captured_at
    }))

    // Ask Claude
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `You are a personal research assistant helping someone understand their saved LinkedIn posts.

USER'S SAVED POSTS:
${JSON.stringify(postsContext, null, 2)}

USER'S QUESTION:
${question}

INSTRUCTIONS:
1. Answer the question based ONLY on the saved posts provided above
2. Cite specific posts by their ID number (e.g., "According to post #3...")
3. If the posts don't contain relevant information, say so honestly
4. Keep your answer concise and actionable
5. At the end, list the post IDs you referenced

FORMAT YOUR RESPONSE LIKE THIS:
[Your answer here, citing posts like "Post #1 discusses..." or "According to #3..."]

CITED POSTS: [1, 3, 7]`
        }
      ]
    })

    const answerText = response.content[0].type === 'text' ? response.content[0].text : ''

    // Extract cited post IDs from the response
    const citedIds = extractCitedPostIds(answerText, postsContext.length)
    
    // Get citation details
    const citations = citedIds.map(id => {
      const post = postsContext[id - 1]
      return {
        post_id: post.post_id,
        author: post.author,
        url: post.url
      }
    })

    // Clean up the answer (remove the CITED POSTS line)
    const cleanAnswer = answerText.split('CITED POSTS:')[0].trim()

    return NextResponse.json({
      answer: cleanAnswer,
      citations: citations,
      post_count: posts.length
    })

  } catch (error) {
    console.error('Library ask error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}

function extractCitedPostIds(text: string, maxId: number): number[] {
  // Look for the CITED POSTS line
  const citedLine = text.split('CITED POSTS:')[1]
  if (!citedLine) return []

  // Extract numbers from the line
  const matches = citedLine.match(/\d+/g)
  if (!matches) return []

  // Convert to numbers and filter valid IDs
  return matches
    .map(n => parseInt(n))
    .filter(n => n >= 1 && n <= maxId)
}
