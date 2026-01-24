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
    const { user_id } = await request.json()
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user_id)
      .single()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    
    const { data: posts, error: postsError } = await supabase
      .from('saved_posts')
      .select('*')
      .eq('user_id', user_id)
      .gte('captured_at', weekAgo.toISOString())
      .order('captured_at', { ascending: false })
    
    if (postsError) {
      console.error('Error fetching posts:', postsError)
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
    }
    
    if (!posts || posts.length === 0) {
      return NextResponse.json({ 
        success: true,
        message: 'No posts saved this week',
        post_count: 0 
      })
    }
    
    const { count: weeksActive } = await supabase
      .from('weekly_digests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id)
    
    const digestContent = await generateWeeklyDigest(user, posts, weeksActive || 0)
    
    const today = new Date()
    const weekStart = new Date(weekAgo)
    
    const { data: savedDigest, error: saveError } = await supabase
      .from('weekly_digests')
      .insert({
        user_id: user_id,
        week_start: weekStart.toISOString().split('T')[0],
        week_end: today.toISOString().split('T')[0],
        post_count: posts.length,
        digest_content: digestContent,
      })
      .select()
      .single()
    
    if (saveError) {
      console.error('Error saving digest:', saveError)
      return NextResponse.json({ error: 'Failed to save digest' }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true,
      digest_id: savedDigest.id,
      post_count: posts.length,
      preview: digestContent.substring(0, 500) + '...'
    })
    
  } catch (error) {
    console.error('Digest generation error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

async function generateWeeklyDigest(
  user: any, 
  posts: any[], 
  weeksActive: number
): Promise<string> {
  
  const postsForPrompt = posts.map(p => ({
    author: p.author_name,
    headline: p.author_headline,
    content: p.content?.substring(0, 2000),
    url: p.original_url,
    source: p.source,
    saved: p.captured_at
  }))
  
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: `You are a personal knowledge curator creating a weekly digest for a busy executive.

USER CONTEXT:
- Name: ${user.name}
- Weeks using Steep: ${weeksActive + 1}

THIS WEEK'S SAVED CONTENT (${posts.length} posts):
${JSON.stringify(postsForPrompt, null, 2)}

CREATE A WEEKLY DIGEST TITLED "Your Week, Distilled" WITH THESE SECTIONS:

# Your Week, Distilled
*Week of [date range]*

## The Throughline
What's the connective tissue across everything saved this week? (2-3 sentences)

## This Week's Themes
Group posts into 2-4 themes. For each:
- **Theme Name**: Punchy title
- **The Pattern**: What people are saying (2-3 sentences)
- **The Posts**: Brief summary of each relevant post with [Original](url) link
- **Your Takeaway**: One actionable insight

## Voices Worth Noting
Highlight 2-3 authors whose content stood out this week. Focus on WHAT made their posts valuable, not whether to follow them (assume the reader already engages with these people). Format:
- **[Author Name]**: What made their contribution notable this week

## The Sleeper
One post that seems minor but contains a hidden gem worth revisiting. Explain why it deserves a second look.

## Reflection
One thought-provoking question based on what they saved.

---

STYLE GUIDELINES:
- Write like a sharp, trusted advisor briefing an executive
- Professional and polished, no emojis
- Skimmable in 3-4 minutes
- Every post summary must link to original
- If only 1-2 posts were saved, keep it brief and acknowledge the light week
- Tone: confident, concise, insightful`
      }
    ]
  })
  
  return response.content[0].type === 'text' ? response.content[0].text : ''
}

export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Digest generation endpoint ready' 
  })
}
