import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Find user
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (!user) {
      // Don't reveal if user exists or not
      return NextResponse.json({ 
        success: true, 
        message: 'If an account exists, a login link has been sent.' 
      })
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Save magic link
    const { error: insertError } = await supabase
      .from('magic_links')
      .insert({
        user_id: user.id,
        token,
        expires_at: expiresAt.toISOString()
      })

    if (insertError) {
      console.error('Error creating magic link:', insertError)
      return NextResponse.json({ error: 'Failed to create login link' }, { status: 500 })
    }

    // Send email
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify?token=${token}`
    const { error: emailError } = await resend.emails.send({
      from: 'Steep <login@steep.news>',
      to: user.email,
      subject: '☕ Your Steep login link',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="font-size: 24px; margin-bottom: 20px;">☕ Steep</h1>
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            Hi ${user.name},
          </p>
          <p style="font-size: 16px; color: #333; margin-bottom: 30px;">
            Click the button below to log in to your Steep dashboard:
          </p>
          <a href="${loginUrl}" style="display: inline-block; background: #1a1a2e; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Log in to Steep →
          </a>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            This link expires in 15 minutes. If you didn't request this, you can ignore this email.
          </p>
        </div>
      `
    })

    if (emailError) {
      console.error('Error sending email:', emailError)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Login link sent! Check your email.' 
    })

  } catch (error) {
    console.error('Send link error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
