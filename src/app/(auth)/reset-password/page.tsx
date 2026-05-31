'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Lock, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function ResetPasswordPage() {
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  // Vérifie qu'une session de récupération est bien active
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setReady(!!data.session)
    })
  }, [supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Le mot de passe doit faire au moins 8 caractères')
      return
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setError(error.message)
        return
      }
      setSuccess(true)
      setTimeout(() => { window.location.href = '/dashboard' }, 1500)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div>
        <h2 className="text-3xl font-black text-white mb-2">Mot de passe changé ! ✅</h2>
        <p className="text-gray-400">Redirection vers ton dashboard...</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-3xl font-black text-white mb-2">Nouveau mot de passe 🔒</h2>
      <p className="text-gray-400 mb-8">Choisis un nouveau mot de passe sécurisé.</p>

      {!ready && (
        <div className="px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm mb-4">
          Lien invalide ou expiré. Refais une demande depuis « Mot de passe oublié ».
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="password"
          type="password"
          label="Nouveau mot de passe"
          placeholder="8 caractères minimum"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<Lock size={16} />}
          required
          autoComplete="new-password"
        />
        <Input
          id="confirm"
          type="password"
          label="Confirmer le mot de passe"
          placeholder="••••••••"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          icon={<Lock size={16} />}
          required
          autoComplete="new-password"
        />
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}
        <Button type="submit" size="lg" className="w-full mt-2" loading={loading} disabled={!ready}>
          Changer le mot de passe
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
