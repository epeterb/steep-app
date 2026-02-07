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
    
    const { count: weeksActive } = await supabase
      .from('weekly_digests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id)
    
    // Generate digest regardless of post count
    const digestContent = posts && posts.length > 0 
      ? await generateWeeklyDigest(user, posts, weeksActive || 0)
      : await generateNoPostsReminder(user)
    
    const today = new Date()
    const weekStart = new Date(weekAgo)
    
    const { data: savedDigest, error: saveError } = await supabase
      .from('weekly_digests')
      .insert({
        user_id: user_id,
        week_start: weekStart.toISOString().split('T')[0],
        week_end: today.toISOString().split('T')[0],
        post_count: posts?.length || 0,
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
      post_count: posts?.length || 0,
      preview: digestContent.substring(0, 500) + '...'
    })
    
  } catch (error) {
    console.error('Digest generation error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

async function generateNoPostsReminder(user: any): Promise<string> {
  return `## ☕ Your Week, Distilled

Hey ${user.name},

We brewed your weekly digest, but the pot's empty this week—no posts saved!

**Here's how to capture content for next week:**

1. **Forward posts** to \`${user.email.split('@')[0]}@in.steep.news\`
2. **Save interesting LinkedIn content** as you scroll
3. **Let it steep** all week
4. **Get your digest** every ${user.digest_day.charAt(0).toUpperCase() + user.digest_day.slice(1)}

The best insights come from consistent curation. Start saving this week and watch the patterns emerge.

**Quick tip:** When you see a post worth remembering, forward it immediately. Your future self will thank you.

See you next week,  
**Steep** ☕

---

*Not seeing value? Reply and let us know how we can help.*`
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
        content: `You are a personal knowledge curator creating a weekly digest for a busy professional.

USER CONTEXT:
- Name: ${user.name}
- Weeks using Steep: ${weeksActive + 1}

THIS WEEK'S SAVED CONTENT (${posts.length} posts):
${JSON.stringify(postsForPrompt, null, 2)}

CREATE A WEEKLY DIGEST WITH THESE SECTIONS:

## ☕ THE THROUGHLINE
What's the connective tissue across everything saved this week? (2-3 sentences)

## 📚 THIS WEEK'S THEMES
Group posts into 2-4 themes. For each:
- **Theme Name**: Punchy title
- **The Pattern**: What people are saying (2-3 sentences)
- **The Posts**: Brief summary of each relevant post with [→ Original](url) link
- **Your Takeaway**: One actionable insight

## 👀 PEOPLE WORTH FOLLOWING
Authors who appeared multiple times or posted great content. Include why they're worth following.

## 💎 THE SLEEPER
One post that seems minor but contains a hidden gem worth revisiting.

## 🤔 REFLECTION PROMPT
One thought-provoking question based on what they saved.

STYLE GUIDELINES:
- Write like a smart friend giving highlights
- Conversational, not formal
- Skimmable in 3-4 minutes
- Every post summary must link to original
- If only 1-2 posts were saved, keep it brief and acknowledge the light week`
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
