import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// GET - Fetch user settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      )
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !user) {
      console.error('Error fetching user:', error)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })

  } catch (error) {
    console.error('User settings GET error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}

// PUT - Update user settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, digest_day, name } = body

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      )
    }

    // Build update object
    const updates: any = {}
    
    if (digest_day !== undefined) {
      // Validate digest_day
      const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      if (!validDays.includes(digest_day.toLowerCase())) {
        return NextResponse.json(
          { error: 'Invalid digest_day. Must be a day of the week.' },
          { status: 400 }
        )
      }
      updates.digest_day = digest_day.toLowerCase()
    }

    if (name !== undefined) {
      updates.name = name
    }

    // Update user
    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating user:', error)
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      user 
    })

  } catch (error) {
    console.error('User settings PUT error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
