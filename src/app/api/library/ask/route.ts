import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

export async function POST(request: NextRequest) {
  try {
    const { question, user_id, collection_id } = await request.json()

    let query = supabase
      .from('saved_posts')
      .select('id, author_name, author_headline, content, original_url, captured_at')
      .eq('user_id', user_id)
      .order('captured_at', { ascending: false })
      .limit(100)

    if (collection_id) {
      const { data: collectionPosts } = await supabase
        .from('collection_posts')
        .select('post_id')
        .eq('collection_id', collection_id)
      
      const postIds = collectionPosts?.map(cp => cp.post_id) || []
      query = query.in('id', postIds)
    }

    const { data: posts, error } = await query

    if (error || !posts || posts.length === 0) {
      return NextResponse.json({ 
        answer: 'No posts found in your library.',
        citations: []
      })
    }

    const postsContext = posts.map((p, idx) => ({
      id: idx + 1,
      author: p.author_name,
      headline: p.author_headline,
      content: p.content?.substring(0, 1000),
      url: p.original_url,
      date: p.captured_at
    }))

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `You are analyzing a user's saved LinkedIn posts. Answer their question conversationally and helpfully.

POSTS LIBRARY:
${JSON.stringify(postsContext, null, 2)}

USER QUESTION: ${question}

INSTRUCTIONS:
- Answer conversationally, like a knowledgeable assistant
- Do NOT use markdown headers (##, ###)
- You may use bold (**word**) sparingly for emphasis
- Keep bullet points minimal — prefer prose
- If listing posts by an author, just say "Andreas Horn saved 6 posts this week" naturally
- Cite sources by saying things like "In post #3, Horn argues..."
- End your response with "CITED POSTS: [list of post IDs]" on a new line
- Be concise — 3-5 sentences for simple questions, a short paragraph for complex ones`
      }]
    })

    const fullResponse = response.content[0].type === 'text' ? response.content[0].text : ''
    
    const citedIds = extractCitedPostIds(fullResponse)
    const citations = citedIds.map(id => {
      const post = posts[id - 1]
      return {
        post_id: post?.id,
        author: post?.author_name,
        url: post?.original_url
      }
    }).filter(c => c.post_id)

    const answer = fullResponse.split('CITED POSTS:')[0].trim()

    return NextResponse.json({ answer, citations })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to process question' }, { status: 500 })
  }
}

function extractCitedPostIds(text: string): number[] {
  const match = text.match(/CITED POSTS:\s*\[([\d,\s]+)\]/)
  if (!match) return []
  return match[1].split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
}
