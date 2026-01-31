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
        subject: `🍵 Your Weekly Steep (${digest.post_count} saves)`,
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
  const html = markdown
    .replace(/^## (.*$)/gim, '<h2 style="color: #1a1a2e; margin-top: 24px;">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 style="color: #16213e;">$1</h3>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" style="color: #0066cc;">$1</a>')
    .replace(/^- (.*$)/gim, '• $1<br>')
    .replace(/\n\n/gim, '</p><p>')
    .replace(/\n/gim, '<br>')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1a1a2e; margin: 0;">🍵 Steep</h1>
        <p style="color: #666; margin: 5px 0;">Your weekly digest</p>
      </div>
      <div>
        <p>${html}</p>
      </div>
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
        <p>You're receiving this because you saved content to Steep this week.</p>
        <p><a href="https://steep.news/dashboard" style="color: #0066cc;">View your dashboard</a></p>
      </div>
    </body>
    </html>
  `
}
