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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    if (!userId) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 })
    }
    
    const offset = (page - 1) * limit
    
    const { count } = await supabase
      .from('saved_posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    
    const { data: posts, error } = await supabase
      .from('saved_posts')
      .select('*')
      .eq('user_id', userId)
      .order('captured_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (error) {
      console.error('Error fetching posts:', error)
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
    }
    
    return NextResponse.json({
      posts: posts || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasMore: offset + limit < (count || 0)
      }
    })
    
  } catch (error) {
    console.error('Posts API error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
