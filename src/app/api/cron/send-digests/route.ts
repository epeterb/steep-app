import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function GET(request: NextRequest) {
  // Lazy load Resend only when needed
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    return NextResponse.json({ 
      error: 'RESEND_API_KEY not configured',
      message: 'Add RESEND_API_KEY to environment variables'
    }, { status: 500 })
  }

  const { Resend } = await import('resend')
  const resend = new Resend(resendKey)

  const today = new Date()
  const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'America/Chicago' }).toLowerCase()

  console.log(`Running digest cron on ${dayOfWeek}`)

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .eq('digest_day', dayOfWeek)
    .in('plan', ['monthly', 'annual', 'lifetime', 'trial'])

  if (usersError) {
    console.error('Error fetching users:', usersError)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }

  if (!users || users.length === 0) {
    return NextResponse.json({ 
      message: 'No digests to send today',
      day: dayOfWeek 
    })
  }

  const results = []

  for (const user of users) {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const digestResponse = await fetch(`${appUrl}/api/digest/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      })

      const digestData = await digestResponse.json()

      if (digestData.post_count === 0) {
        results.push({ 
          user: user.email, 
          status: 'skipped', 
          reason: 'no posts this week' 
        })
        continue
      }

      const { data: digest } = await supabase
        .from('weekly_digests')
        .select('*')
        .eq('id', digestData.digest_id)
        .single()

      if (!digest) {
        results.push({ 
          user: user.email, 
          status: 'error', 
          reason: 'digest not found' 
        })
        continue
      }

      const htmlContent = convertToHtml(digest.digest_content)

      const { error: emailError } = await resend.emails.send({
        from: 'Steep <digest@steep.news>',
        to: user.email,
        subject: `☕ Your Weekly Steep (${digest.post_count} saves)`,
        html: htmlContent,
      })

      if (emailError) {
        console.error('Email error for', user.email, emailError)
        results.push({ 
          user: user.email, 
          status: 'error', 
          reason: 'email failed' 
        })
        continue
      }

      await supabase
        .from('weekly_digests')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', digest.id)

      results.push({ 
        user: user.email, 
        status: 'sent', 
        post_count: digest.post_count 
      })

    } catch (error) {
      console.error('Error processing user', user.email, error)
      results.push({ 
        user: user.email, 
        status: 'error', 
        reason: String(error) 
      })
    }
  }

  return NextResponse.json({ 
    processed: results.length, 
    day: dayOfWeek,
    results 
  })
}function convertToHtml(markdown: string): string {
  // Split into sections for better control
  let html = markdown
    
  // Major section headers (## THE THROUGHLINE, ## THIS WEEK'S THEMES, etc.)
  html = html.replace(/^## (.*$)/gim, '<h2 class="major-section">$1</h2>')
  
  // Theme titles (### Claude Mastery Mania, etc.) - these need to be bigger and bolder
  html = html.replace(/^### (.*$)/gim, '<h3 class="theme-title">$1</h3>')
  
  // Bold text (**The Pattern:**)
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong class="label">$1</strong>')
  
  // Italic text
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>')
  
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="link">$1</a>')
  
  // Bullet points - create proper list items
  html = html.replace(/^- (.*$)/gim, '<li class="bullet-item">$1</li>')
  
  // Wrap consecutive list items i
