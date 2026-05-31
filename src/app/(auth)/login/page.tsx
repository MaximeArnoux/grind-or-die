'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message === 'Invalid login credentials'
          ? 'Email ou mot de passe incorrect'
          : error.message)
        return
      }
      // Hard redirect so server reads the new session cookie
      window.location.href = '/dashboard'
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-3xl font-black text-white mb-2">Bon retour ! 👊</h2>
      <p className="text-gray-400 mb-8">Connecte-toi pour continuer ta série.</p>

      <form onSubmit={handleLogin} className="space-y-4">
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
        <div>
          <Input
            id="password"
            type="password"
            label="Mot de passe"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock size={16} />}
            required
            autoComplete="current-password"
          />
          <div className="flex justify-end mt-1.5">
            <Link href="/forgot-password" className="text-xs text-violet-400 hover:text-violet-300">
              Mot de passe oublié ?
            </Link>
          </div>
        </div>
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}
        <Button type="submit" size="lg" className="w-full mt-2" loading={loading}>
          Se connecter
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Pas encore de compte ?{' '}
        <Link href="/register" className="text-violet-400 hover:text-violet-300 font-semibold">
          Créer un compte
        </Link>
      </p>
    </div>
  )
}
