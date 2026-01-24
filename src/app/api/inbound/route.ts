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
    
    const emailContent = TextBody || ''
    const htmlContent = HtmlBody || ''
    
    const linkedInUrl = extractLinkedInUrl(emailContent + ' ' + htmlContent)
    
    const parsed = await parseEmailContent(emailContent, htmlContent, Subject)
    
    if (!parsed.original_url && linkedInUrl) {
      parsed.original_url = linkedInUrl
    }
    
    // If content is empty, try to extract from URL slug
    if ((!parsed.content || parsed.content.trim() === '') && parsed.original_url) {
      parsed.content = extractContentFromUrl(parsed.original_url)
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
  const patterns = [
    /https?:\/\/(?:www\.)?linkedin\.com\/posts\/[^\s"<>)]+/gi,
    /https?:\/\/(?:www\.)?linkedin\.com\/feed\/update\/[^\s"<>)]+/gi,
    /https?:\/\/(?:www\.)?linkedin\.com\/pulse\/[^\s"<>)]+/gi,
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      return match[0].split('?')[0]
    }
  }
  return null
}

function extractContentFromUrl(url: string): string {
  try {
    // LinkedIn URLs look like: linkedin.com/posts/author-name_post-title-here-activity-123
    const match = url.match(/linkedin\.com\/posts\/[^_]+_([^-]+-[^-]+-[^-]+-[^-]+-[^-]+)/i)
    
    if (match && match[1]) {
      // Convert slug to readable text
      let content = match[1]
        .replace(/-activity.*$/i, '') // Remove activity ID
        .replace(/-ugcPost.*$/i, '')  // Remove ugcPost ID
        .replace(/-/g, ' ')           // Replace hyphens with spaces
        .trim()
      
      // Capitalize first letter
      content = content.charAt(0).toUpperCase() + content.slice(1)
      
      // Add ellipsis to indicate it's truncated
      return content + '...'
    }
    
    // Fallback: try to get any readable part from the URL
    const slugMatch = url.match(/posts\/[^_]+_(.+?)(?:-activity|-ugcPost|\?|$)/i)
    if (slugMatch && slugMatch[1]) {
      let content = slugMatch[1].replace(/-/g, ' ').trim()
      content = content.charAt(0).toUpperCase() + content.slice(1)
      return content + '...'
    }
    
    return ''
  } catch (e) {
    return ''
  }
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
    
    if (!parsed.author_name || parsed.author_name === 'Unknown' || parsed.author_name.trim() === '') {
      const subjectMatch = subject.match(/^(?:Fwd?:|RE:)?\s*(.+?)(?:\s+shared|\s+posted|\s+on LinkedIn)/i)
      if (subjectMatch) {
        parsed.author_name = subjectMatch[1].trim()
      }
    }
    
    return parsed
  } catch (error) {
    console.error('Error parsing email:', error)
    
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
    timestamp: new Date()
    
