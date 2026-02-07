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
    
    // Filter parameters
    const search = searchParams.get('search')
    const dateFilter = searchParams.get('date_filter')
    const authorFilter = searchParams.get('author')

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      )
    }

    // Build query
    let query = supabase
      .from('saved_posts')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)

    // Apply search filter (searches content and author name)
    if (search) {
      query = query.or(`content.ilike.%${search}%,author_name.ilike.%${search}%`)
    }

    // Apply author filter
    if (authorFilter) {
      query = query.ilike('author_name', `%${authorFilter}%`)
    }

    // Apply date filter
    if (dateFilter && dateFilter !== 'all') {
      const now = new Date()
      let dateFrom: Date | null = null

      switch (dateFilter) {
        case 'today':
          dateFrom = new Date(now.setHours(0, 0, 0, 0))
          break
        case 'week':
          dateFrom = new Date(now.setDate(now.getDate() - 7))
          break
        case 'month':
          dateFrom = new Date(now.setMonth(now.getMonth() - 1))
          break
        case 'year':
          dateFrom = new Date(now.setFullYear(now.getFullYear() - 1))
          break
      }

      if (dateFrom) {
        query = query.gte('captured_at', dateFrom.toISOString())
      }
    }

    // Apply pagination
    const offset = (page - 1) * limit
    query = query
      .order('captured_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: posts, error, count } = await query

    if (error) {
      console.error('Error fetching posts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch posts' },
        { status: 500 }
      )
    }

    const total = count || 0
    const totalPages = Math.ceil(total / limit)
    const hasMore = page < totalPages

    return NextResponse.json({
      posts: posts || [],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore
      }
    })

  } catch (error) {
    console.error('Posts list error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
