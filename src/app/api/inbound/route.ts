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
    
    const { To, From, Subject, TextBody, HtmlBody } = payload
    
    console.log('Received email for:', To)
    console.log('From:', From)
    console.log('Subject:', Subject)
    
    const steepEmail = To.toLowerCase().trim()
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('steep_email', steepEmail)
      .single()
    
    if (userError || !user) {
      console.error('User not found for:', steepEmail)
      return NextResponse.json({ 
        success: false, 
        error: 'User not found',
        steep_email: steepEmail 
      })
    }
    
    console.log('Found user:', user.name)
    
    // Use both TextBody and HtmlBody for better parsing
    const emailContent = TextBody || ''
    const htmlContent = HtmlBody || ''
    
    // Pre-extract LinkedIn URL if present (these often get lost in parsing)
    const linkedInUrl = extractLinkedInUrl(emailContent + ' ' + htmlContent)
    
    const parsed = await parseEmailContent(emailContent, htmlContent, Subject)
    
    // Use pre-extracted URL as fallback
    if (!parsed.original_url && linkedInUrl) {
      parsed.original_url = linkedInUrl
    }
    
    console.log('Parsed content:', {
      source: parsed.source,
      author: parsed.author_name,
      contentLength: parsed.content?.length,
      url: parsed.original_url
    })
    
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

function extractLinkedInUrl(text: string): string | null {
  // Match various LinkedIn post URL formats
  const patterns = [
    /https?:\/\/(?:www\.)?linkedin\.com\/posts\/[^\s"<>)]+/gi,
    /https?:\/\/(?:www\.)?linkedin\.com\/feed\/update\/[^\s"<>)]+/gi,
    /https?:\/\/(?:www\.)?linkedin\.com\/pulse\/[^\s"<>)]+/gi,
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      // Clean up the URL (remove tracking params if desired, or keep as-is)
      return match[0].split('?')[0]
    }
  }
  return null
}

async function parseEmailContent(
  textBody: string, 
  htmlBody: string,
  subject: string
): Promise<{
  source: string
  author_name: string
  author_headline: string | null
  content: string
  original_url: string | null
  post_date: string | null
  tags: string[]
}> {
  try {
    // Combine sources for better context
    const combinedContent = `
SUBJECT: ${subject}

TEXT VERSION:
${textBody.substring(0, 8000)}

HTML VERSION (for additional context):
${htmlBody.substring(0, 4000)}
`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `You are a content extraction specialist. Parse this forwarded email and extract the original LinkedIn post content.

${combinedContent}

IMPORTANT: LinkedIn forwarded posts come in many formats:
1. "Share" button forwards - include author name and post text
2. Mobile app shares - often just a URL with preview text
3. Copy/paste shares - raw text with URL
4. Comment shares - "X commented on this"

Extract and return ONLY valid JSON (no markdown, no backticks, no explanation):
{
  "source": "linkedin",
  "author_name": "Full name of the person who wrote the original post (not the forwarder, not 'Unknown' unless truly impossible to determine)",
  "author_headline": "Their job title/headline if visible, or null",
  "content": "The actual post text content - what the author wrote. If you can only find a URL, leave this empty string",
  "original_url": "The linkedin.com URL to the post - look for linkedin.com/posts/ or linkedin.com/feed/update/",
  "post_date": "ISO date if visible, or null",
  "tags": ["3-5", "relevant", "topic", "keywords"]
}

Rules:
- The author is the person who WROTE the post, not who forwarded it
- Look for patterns like "Author Name\\nHeadline\\n\\nPost content"
- If there's an image description, that's not the post content
- Extract the LinkedIn URL even if it has tracking parameters
- Tags should reflect the actual topics discussed
- If you truly cannot find content, return empty string for content but still try to get author and URL`
        }
      ]
    })
    
    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    
    const cleanedText = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()
    
    const parsed = JSON.parse(cleanedText)
    
    // Validate author_name isn't empty
    if (!parsed.author_name || parsed.author_name === 'Unknown' || parsed.author_name.trim() === '') {
      // Try to extract from subject line as fallback
      const subjectMatch = subject.match(/^(?:Fwd?:|RE:)?\s*(.+?)(?:\s+shared|\s+posted|\s+on LinkedIn)/i)
      if (subjectMatch) {
        parsed.author_name = subjectMatch[1].trim()
      }
    }
    
    return parsed
  } catch (error) {
    console.error('Error parsing email:', error)
    
    // Better fallback - try to extract URL at minimum
    const urlMatch = (textBody + htmlBody).match(/https?:\/\/(?:www\.)?linkedin\.com\/[^\s"<>]+/)
    
    return {
      source: 'linkedin',
      author_name: 'Unknown Author',
      author_headline: null,
      content: '',
      original_url: urlMatch ? urlMatch[0].split('?')[0] : null,
      post_date: null,
      tags: []
    }
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Steep inbound webhook is running',
    timestamp: new Date().toISOString()
  })
}
