'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) {
        setError(error.message)
        return
      }
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div>
        <h2 className="text-3xl font-black text-white mb-2">Email envoyé ! 📩</h2>
        <p className="text-gray-400 mb-8">
          Si un compte existe avec <span className="text-white font-medium">{email}</span>, tu vas recevoir un lien pour réinitialiser ton mot de passe. Pense à vérifier tes spams.
        </p>
        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 font-semibold">
          <ArrowLeft size={16} /> Retour à la connexion
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-3xl font-black text-white mb-2">Mot de passe oublié ?</h2>
      <p className="text-gray-400 mb-8">Entre ton email, on t&apos;envoie un lien de réinitialisation.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
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
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}
        <Button type="submit" size="lg" className="w-full mt-2" loading={loading}>
          Envoyer le lien
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-violet-400 hover:text-violet-300 font-semibold">
          <ArrowLeft size={14} /> Retour à la connexion
        </Link>
      </p>
    </div>
  )
}
