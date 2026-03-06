import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check if user exists
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
      .single()

    // If user doesn't exist, create them
    if (!user) {
      const username = normalizedEmail.split('@')[0].replace(/[^a-z0-9]/g, '')
      const inboundEmail = `${username}@in.steep.news`

      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: normalizedEmail,
          name: username,
          steep_email: inboundEmail,
          plan: 'trial',
          digest_day: 'saturday',
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating user:', createError)
        return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
      }

      user = newUser
      console.log('New user created:', normalizedEmail)

      // Notify peter@steep.news of new signup
      try {
        const resend = new Resend(process.env.RESEND_API_KEY!)
        await resend.emails.send({
          from: 'Steep <digest@steep.news>',
          to: 'peter@steep.news',
          subject: `🎉 New Steep signup: ${normalizedEmail}`,
          html: `<p>New user signed up: <strong>${normalizedEmail}</strong></p><p>Inbound email: ${inboundEmail}</p>`,
        })
      } catch (e) {
        console.error('Failed to send admin notification:', e)
        // Don't fail the request if notification fails
      }
    }

    // Generate magic link token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Delete any existing unused tokens for this user
    await supabase
      .from('magic_links')
      .delete()
      .eq('user_id', user.id)
      .eq('used', false)

    // Insert new token
    const { error: tokenError } = await supabase
      .from('magic_links')
      .insert({
        user_id: user.id,
        token,
        expires_at: expiresAt.toISOString(),
        used: false,
      })

    if (tokenError) {
      console.error('Error creating magic link:', tokenError)
      return NextResponse.json({ error: 'Failed to create login link' }, { status: 500 })
    }

    // Send magic link email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://steep.news'
    const loginUrl = `${appUrl}/api/auth/verify?token=${token}`

    const resend = new Resend(process.env.RESEND_API_KEY!)
    const { error: emailError } = await resend.emails.send({
      from: 'Steep <digest@steep.news>',
      to: normalizedEmail,
      subject: '☕ Your Steep login link',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <h2 style="color: #1a1a2e;">☕ Welcome to Steep</h2>
          <p style="color: #333; font-size: 16px;">Click the button below to log in. This link expires in 1 hour.</p>
          <a href="${loginUrl}" style="display: inline-block; margin: 24px 0; padding: 14px 28px; background: #1a1a2e; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Log in to Steep →
          </a>
          <p style="color: #999; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    })

    if (emailError) {
      console.error('Error sending email:', emailError)
      return NextResponse.json({ error: 'Failed to send login email' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Login link sent! Check your email.',
    })

  } catch (error) {
    console.error('Send link error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
