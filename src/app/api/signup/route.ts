import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)
const ADMIN_EMAIL = 'peter@steep.news'

export async function POST(request: NextRequest) {
  try {
    const { email, name, referrer } = await request.json()

    if (!email || !name) {
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 })
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 })
    }

    const steepEmail = await generateUniqueEmail(name)

    const { data: user, error: createError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase().trim(),
        name: name.trim(),
        steep_email: steepEmail,
        plan: 'trial',
        plan_expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        referred_by: referrer || null
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating user:', createError)
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
    }

    // Send welcome email to new user
    const { error: welcomeError } = await resend.emails.send({
      from: 'Steep <digest@steep.news>',   // ← changed from notifications@
      to: email,
      subject: `Welcome to Steep ☕ — here's your forwarding address`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a1a2e;">
          <h1 style="font-size: 32px; margin-bottom: 4px;">☕ Steep</h1>
          <p style="color: #666; margin-bottom: 32px;">Your LinkedIn digest is ready to brew.</p>

          <p>Hi ${name},</p>
          <p>Welcome to Steep! Your account is active and your 14-day trial has started.</p>

          <div style="background: #f5f5f5; border-radius: 8px; padding: 24px; margin: 32px 0; text-align: center;">
            <p style="font-size: 13px; color: #666; margin: 0 0 8px 0;">YOUR STEEP FORWARDING ADDRESS</p>
            <p style="font-size: 20px; font-weight: 700; margin: 0; color: #1a1a2e;">${steepEmail}</p>
          </div>

          <p><strong>How to use it:</strong></p>
          <ol style="line-height: 2;">
            <li>See a great LinkedIn post? Hit <strong>Share → Send in a message</strong> (or forward it)</li>
            <li>Send it to the address above</li>
            <li>Every Saturday morning, get your digest in your inbox</li>
          </ol>

          <p style="margin-top: 32px;">To log in to your dashboard, visit <a href="https://steep.news/login" style="color: #0066cc;">steep.news/login</a> and enter this email.</p>

          <p style="color: #888; font-size: 13px; margin-top: 48px; border-top: 1px solid #eee; padding-top: 16px;">
            A Syndesi project · <a href="https://steep.news" style="color: #888;">steep.news</a>
          </p>
        </div>
      `
    })

    if (welcomeError) {
      console.error('Welcome email failed:', welcomeError)
      // Don't fail the signup — user was created, just log the error
    }

    // Notify admin
    const { error: adminError } = await resend.emails.send({
      from: 'Steep <digest@steep.news>',   // ← changed from notifications@
      to: ADMIN_EMAIL,
      subject: `New Steep signup: ${name}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>New signup 🎉</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Steep address:</strong> ${steepEmail}</p>
          ${referrer ? `<p><strong>Referred by:</strong> ${referrer}</p>` : ''}
        </div>
      `
    })

    if (adminError) {
      console.error('Admin notification failed:', adminError)
    }

    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, steep_email: user.steep_email }
    })

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

async function generateUniqueEmail(name: string): Promise<string> {
  const base = name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20)
  let candidate = `${base}@save.steep.news`
  let counter = 0

  while (true) {
    const { data: existing } = await supabase
      .from('users').select('id').eq('steep_email', candidate).single()
    if (!existing) return candidate
    counter++
    if (counter > 100) return `${base}${Math.random().toString(36).substring(2, 6)}@save.steep.news`
    candidate = `${base}${counter}@save.steep.news`
  }
}
