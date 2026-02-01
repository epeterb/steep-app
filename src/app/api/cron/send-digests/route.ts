import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function GET(request: NextRequest) {
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
}

function convertToHtml(markdown: string): string {
  let html = markdown
  
  // Major section headers with inline styles
  html = html.replace(/^## (.*$)/gim, '<h2 style="color: #1a1a2e; font-size: 20px; font-weight: 700; margin: 48px 0 20px 0; padding-bottom: 12px; border-bottom: 3px solid #1a1a2e; letter-spacing: -0.5px; text-transform: uppercase;">$1</h2>')
  
  // Theme titles with INLINE STYLES (blue, gray background, padding, borders)
  html = html.replace(/^### (.*$)/gim, '<h3 style="color: #0066cc; font-size: 24px; font-weight: 700; margin: 56px 0 16px 0; padding: 16px; border-top: 3px solid #e8e8e8; border-bottom: 1px solid #e8e8e8; letter-spacing: -0.5px; background-color: #f8f9fa; margin-left: -16px; margin-right: -16px;">$1</h3>')
  
  // Bold labels with inline styles
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong style="color: #1a1a2e; font-weight: 600; font-size: 16px;">$1</strong>')
  
  // Italic text
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>')
  
  // Links with inline styles
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" style="color: #0066cc; text-decoration: none; font-weight: 500;">$1</a>')
  
  // Bullet points with inline styles
  html = html.replace(/^- (.*$)/gim, '<li style="color: #333; font-size: 16px; line-height: 1.7; margin: 8px 0; padding-left: 8px;">$1</li>')
  
  // Wrap list items in ul with inline styles
  html = html.replace(/(<li style=".*?">.*?<\/li>\n?)+/gim, '<ul style="margin: 12px 0 20px 0; padding-left: 28px;">$&</ul>')
  
  // Paragraphs
  html = html.replace(/\n\n/gim, '</p><p style="color: #333; font-size: 16px; line-height: 1.7; margin: 12px 0;">')
  html = html.replace(/\n/gim, '<br>')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1a1a2e; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fafafa;">
      <div style="text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #e8e8e8;">
        <h1 style="color: #1a1a2e; font-size: 32px; font-weight: 700; margin: 0 0 8px 0;">☕ Steep</h1>
        <p style="color: #666; font-size: 16px; margin: 0;">Your weekly digest</p>
      </div>
      <div style="background-color: #ffffff; padding: 32px; border-radius: 8px;">
        <p style="color: #333; font-size: 16px; line-height: 1.7; margin: 12px 0;">${html}</p>
      </div>
      <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e8e8e8; text-align: center;">
        <p style="color: #666; font-size: 14px; margin: 8px 0;">You're receiving this because you saved content to Steep this week.</p>
        <p style="color: #666; font-size: 14px; margin: 8px 0;"><a href="https://steep.news/dashboard" style="color: #0066cc; text-decoration: none; font-weight: 500;">View your dashboard</a></p>
      </div>
    </body>
    </html>
  `
}
