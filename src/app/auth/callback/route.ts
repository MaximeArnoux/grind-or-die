import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const username = searchParams.get('username')
  const next = searchParams.get('next')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)

    // Flux de réinitialisation de mot de passe : session établie → page reset
    if (next) {
      return NextResponse.redirect(`${origin}${next}`)
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      if (!existingProfile) {
        const finalUsername = username
          ?? (user.user_metadata?.username as string | undefined)?.toLowerCase()
          ?? user.email?.split('@')[0]?.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 15)
          ?? 'user'
        const usernameWithSuffix = `${finalUsername}${Math.floor(Math.random() * 9999)}`

        const { error: profileError } = await supabase
          .from('profiles')
          .insert({ id: user.id, username: username ?? usernameWithSuffix })

        if (profileError && profileError.code === '23505') {
          // Username conflict — use suffixed version
          await supabase.from('profiles').insert({ id: user.id, username: usernameWithSuffix })
        }

        await supabase.from('user_streaks').upsert(
          { user_id: user.id },
          { onConflict: 'user_id', ignoreDuplicates: true }
        )
      }
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
