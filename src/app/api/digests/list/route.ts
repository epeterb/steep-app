import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

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

    // Fetch all digests for this user, ordered by most recent first
    const { data: digests, error } = await supabase
      .from('weekly_digests')
      .select('*')
      .eq('user_id', userId)
      .order('week_start', { ascending: false })

    if (error) {
      console.error('Error fetching digests:', error)
      return NextResponse.json(
        { error: 'Failed to fetch digests' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      digests: digests || [],
      count: digests?.length || 0
    })

  } catch (error) {
    console.error('Digests list error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
