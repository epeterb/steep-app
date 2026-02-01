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
  let html = markdown
  
  // FIRST: Convert bullets BEFORE processing anything else
  // This ensures - at start of line becomes a list item
  html = html.replace(/^- (.*$)/gim, '☆LISTITEM☆$1☆ENDITEM☆')
  
  // Remove the # from the newsletter title line
  html = html.replace(/^# (.*$)/gim, '<div style="font-size: 32px; font-weight: 700; color: #1a1a2e; margin: 0 0 8px 0; padding: 20px 0; border-bottom: 4px solid #1a1a2e; text-align: center;">$1</div>')
  
  // Major section headers (## THE THROUGHLINE, ## THIS WEEK'S THEMES)
  html = html.replace(/^## (.*$)/gim, '<div style="font-size: 24px; font-weight: 700; color: #1a1a2e; margin: 48px 0 16px 0; padding-bottom: 12px; border-bottom: 3px solid #1a1a2e; text-transform: uppercase; letter-spacing: 0.5px;">$1</div>')
  
  // Theme titles - BLUE, BOLD, BIG (26px)
  html = html.replace(/^### (.*$)/gim, '<table width="100%" cellpadding="0" cellspacing="0" style="margin: 48px 0 12px 0;"><tr><td style="background-color: #f0f7ff; border-left: 4px solid #0066cc; padding: 18px; border-radius: 4px;"><div style="font-size: 26px; font-weight: 700; color: #0066cc; margin: 0; line-height: 1.2;">$1</div></td></tr></table>')
  
  // Bold labels (The Pattern:, Your Takeaway:)
  html = html.replace(/\*\*(.*?)\*\*/gim, '<span style="font-weight: 700; color: #1a1a2e; font-size: 17px;">$1</span>')
  
  // Italic
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>')
  
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" style="color: #0066cc; text-decoration: none; font-weight: 600;">$1</a>')
  
  // Process newlines
  html = html.replace(/\n\n/gim, '</div><div style="font-size: 16px; line-height: 1.7; color: #333; margin: 8px 0;">')
  html = html.replace(/\n/gim, '<br>')
  
  // LAST: Convert our list item markers to actual HTML
  html = html.replace(/☆LISTITEM☆(.*?)☆ENDITEM☆/gim, '<li style="margin: 4px 0; font-size: 16px; line-height: 1.6; color: #333;">$1</li>')
  
  // Wrap consecutive list items in ul
  html = html.replace(/(<li style=".*?">.*?<\/li>(<br>)?)+/gim, '<ul style="margin: 8px 0 16px 0; padding-left: 24px; list-style-type: disc;">$&</ul>')
  
  // Clean up any remaining markers
  html = html.replace(/☆LISTITEM☆|☆ENDITEM☆/gim, '')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fafafa;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fafafa;">
        <tr>
          <td align="center" style="padding: 20px;">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px;">
              <!-- Header -->
              <tr>
                <td style="text-align: center; padding: 40px 40px 30px 40px; border-bottom: 2px solid #e8e8e8;">
                  <div style="font-size: 42px; margin: 0 0 12px 0;">🍵</div>
                  <h1 style="margin: 0 0 8px 0; font-size: 36px; font-weight: 700; color: #1a1a2e;">Steep</h1>
                  <p style="margin: 0; font-size: 16px; color: #666;">Your weekly digest</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <div style="font-size: 16px; line-height: 1.7; color: #333; margin: 8px 0;">
                    ${html}
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 30px 40px; border-top: 1px solid #e8e8e8; text-align: center;">
                  <p style="margin: 0 0 12px 0; font-size: 14px; color: #666;">You're receiving this because you saved content to Steep this week.</p>
                  <p style="margin: 0; font-size: 14px;"><a href="https://steep.news/dashboard" style="color: #0066cc; text-decoration: none; font-weight: 600;">View your dashboard →</a></p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}
