'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (username.length < 3) {
      setError('Le pseudo doit faire au moins 3 caractères')
      return
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Le pseudo ne peut contenir que des lettres, chiffres et _')
      return
    }
    if (password.length < 8) {
      setError('Le mot de passe doit faire au moins 8 caractères')
      return
    }

    setLoading(true)
    try {
      // 1. Check username availability BEFORE creating auth user
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.toLowerCase())
        .maybeSingle()

      if (existing) {
        setError('Ce pseudo est déjà pris')
        return
      }

      // 2. Create auth user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username: username.toLowerCase() },
          emailRedirectTo: `${window.location.origin}/auth/callback?username=${encodeURIComponent(username.toLowerCase())}`,
        },
      })

      if (signUpError) {
        if (signUpError.message.toLowerCase().includes('already registered') ||
            signUpError.message.toLowerCase().includes('already been registered')) {
          setError('Cet email est déjà utilisé')
        } else {
          setError(signUpError.message)
        }
        return
      }

      if (!data.user) {
        setError('Cet email est déjà utilisé ou en attente de confirmation. Vérifie ta boîte mail ou utilise un autre email.')
        return
      }

      if (data.session) {
        // Trigger handle_new_user already created the profile — go straight to dashboard
        window.location.href = '/dashboard'
        return
      }

      // Email confirmation enabled — profile will be created in /auth/callback after verification
      router.push('/verify')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-3xl font-black text-white mb-2">Rejoins le Grind 🔥</h2>
      <p className="text-gray-400 mb-8">Crée ton compte et commence à progresser.</p>

      <form onSubmit={handleRegister} className="space-y-4">
        <Input
          id="username"
          type="text"
          label="Pseudo"
          placeholder="monpseudo"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          icon={<User size={16} />}
          required
          autoComplete="username"
        />
        <Input
          id="email"
          type="email"
          label="Email"
          placeholder="ton@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail size={16} />}
          required
          autoComplete="email"
        />
        <Input
          id="password"
          type="password"
          label="Mot de passe"
          placeholder="8 caractères minimum"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<Lock size={16} />}
          required
          autoComplete="new-password"
        />
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}
        <Button type="submit" size="lg" className="w-full mt-2" loading={loading}>
          Créer mon compte
        </Button>
      </form>

      <p className="mt-4 text-xs text-center text-gray-600">
        En créant un compte, tu acceptes les conditions d&apos;utilisation.
      </p>
      <p className="mt-4 text-center text-sm text-gray-500">
        Déjà un compte ?{' '}
        <Link href="/login" className="text-violet-400 hover:text-violet-300 font-semibold">
          Se connecter
        </Link>
      </p>
    </div>
  )
}
