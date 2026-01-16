import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/dashboard?error=invalid', request.url))
  }

  // Find magic link
  const { data: magicLink, error } = await supabase
    .from('magic_links')
    .select('*, users(*)')
    .eq('token', token)
    .eq('used', false)
    .single()

  if (error || !magicLink) {
    return NextResponse.redirect(new URL('/dashboard?error=invalid', request.url))
  }

  // Check expiration
  if (new Date(magicLink.expires_at) < new Date()) {
    return NextResponse.redirect(new URL('/dashboard?error=expired', request.url))
  }

  // Mark as used
  await supabase
    .from('magic_links')
    .update({ used: true })
    .eq('id', magicLink.id)

  // Redirect to dashboard with user email (will be stored in localStorage)
  const userEmail = encodeURIComponent(magicLink.users.email)
  return NextResponse.redirect(new URL(`/dashboard?auth=${userEmail}`, request.url))
}
