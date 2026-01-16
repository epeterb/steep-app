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
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      )
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      )
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
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      )
    }

    // Notify admin of new signup
    await resend.emails.send({
      from: 'Steep <notifications@steep.news>',
      to: ADMIN_EMAIL,
      subject: `🎉 New Steep signup: ${name}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px;">
          <h2>New user signed up!</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Steep Email:</strong> ${steepEmail}</p>
          ${referrer ? `<p><strong>Referred by:</strong> ${referrer}</p>` : ''}
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
      `
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        steep_email: user.steep_email,
        plan: user.plan,
      }
    })

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}

async function generateUniqueEmail(name: string): Promise<string> {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 20)

  let candidate = `${base}@save.steep.news`
  let counter = 0

  while (true) {
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('steep_email', candidate)
      .single()

    if (!existing) {
      return candidate
    }

    counter++
    candidate = `${base}${counter}@save.steep.news`

    if (counter > 100) {
      const random = Math.random().toString(36).substring(2, 6)
      return `${base}${random}@save.steep.news`
    }
  }
}
