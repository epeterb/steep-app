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
    const payload = await request.json()
    
    // Postmark sends: From, To, Subject, TextBody, HtmlBody, etc.
    const { To, From, Subject, TextBody, HtmlBody } = payload
    
    console.log('Received email for:', To)
    console.log('From:', From)
    console.log('Subject:', Subject)
    
    // Extract the steep email address (peter@in.steep.news)
    const steepEmail = To.toLowerCase().trim()
    
    // Find the user by their steep_email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('steep_email', steepEmail)
      .single()
    
    if (userError || !user) {
      console.error('User not found for:', steepEmail)
      // Return 200 anyway so Postmark doesn't retry
      return NextResponse.json({ 
        success: false, 
        error: 'User not found',
        steep_email: steepEmail 
      })
    }
    
    console.log('Found user:', user.name)
    
    // Parse the email content using Claude
    const emailContent = TextBody || HtmlBody || ''
    const parsed = await parseEmailContent(emailContent)
    
    console.log('Parsed content:', {
      source: parsed.source,
      author: parsed.author_name,
      contentLength: parsed.content?.length
    })
    
    // Save to database
    const { data: post, error: postError } = await supabase
      .from('saved_posts')
      .insert({
        user_id: user.id,
        source: parsed.source,
        author_name: parsed.author_name,
        author_headline: parsed.author_headline,
        content: parsed.content,
        original_url: parsed.original_url,
        post_date: parsed.post_date,
        raw_email: payload,
        tags: parsed.tags || [],
      })
      .select()
      .single()
    
    if (postError) {
      console.error('Error saving post:', postError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to save post' 
      })
    }
    
    console.log('Saved post:', post.id)
    
    return NextResponse.json({ 
      success: true, 
      post_id: post.id,
      author: parsed.author_name,
      source: parsed.source
    })
    
  } catch (error) {
    console.error('Inbound webhook error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Server error' 
    })
  }
}

async function parseEmailContent(emailBody: string): Promise<{
  source: string
  author_name: string
  author_headline: string | null
  content: string
  original_url: string | null
  post_date: string | null
  tags: string[]
}> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `You are a content extraction specialist. Parse this forwarded email and extract the original LinkedIn post or Substack newsletter content.

EMAIL CONTENT:
${emailBody.substring(0, 10000)}

Extract and return ONLY valid JSON (no markdown, no explanation, no backticks):
{
  "source": "linkedin" or "substack" or "other",
  "author_name": "Full name of original author",
  "author_headline": "Their headline if visible, or null",
  "content": "The full text of the original post/article",
  "original_url": "Direct link to post if present, or null",
  "post_date": "ISO date if visible, or null",
  "tags": ["relevant", "topic", "tags"]
}

Rules:
- Strip all email forwarding artifacts (Fw:, -----, signatures)
- For LinkedIn: Look for the post content, author name, and any engagement numbers
- For Substack: Look for the article title and body
- Extract only the meaningful content
- Return ONLY the JSON object`
        }
      ]
    })
    
    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    
    // Clean up any markdown artifacts
    const cleanedText = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()
    
    return JSON.parse(cleanedText)
  } catch (error) {
    console.error('Error parsing email:', error)
    // Fallback if parsing fails
    return {
      source: 'other',
      author_name: 'Unknown',
      author_headline: null,
      content: emailBody.substring(0, 5000),
      original_url: null,
      post_date: null,
      tags: []
    }
  }
}

// Also handle GET for testing
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Steep inbound webhook is running',
    timestamp: new Date().toISOString()
  })
}
