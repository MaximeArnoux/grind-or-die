'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { pushSupported, getPushStatus, enablePush, disablePush } from '@/lib/push'

export function PushToggle() {
  const [status, setStatus] = useState<'granted' | 'denied' | 'default' | 'unsupported' | 'loading'>('loading')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    getPushStatus().then(setStatus)
  }, [])

  async function handleEnable() {
    setBusy(true); setMsg('')
    const r = await enablePush()
    setBusy(false)
    if (r.ok) { setStatus('granted'); setMsg('✅ Notifications activées !') }
    else setMsg(r.error ?? 'Erreur')
  }

  async function handleDisable() {
    setBusy(true); setMsg('')
    await disablePush()
    setBusy(false)
    setStatus('default')
    setMsg('Notifications désactivées')
  }

  return (
    <Card>
      <CardHeader><CardTitle>Notifications push</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-gray-400">
          Reçois une notification sur ton téléphone quand un membre de ton groupe ajoute une activité.
        </p>

        {status === 'unsupported' && (
          <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
            Ton navigateur ne supporte pas les notifications. Sur iPhone, ajoute d&apos;abord l&apos;app à ton écran d&apos;accueil.
          </p>
        )}

        {status === 'denied' && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
            Permission bloquée. Réactive les notifications dans les réglages de ton navigateur.
          </p>
        )}

        {(status === 'default' || status === 'loading') && (
          <Button onClick={handleEnable} loading={busy} disabled={status === 'loading'}>
            <Bell size={16} /> Activer les notifications
          </Button>
        )}

        {status === 'granted' && (
          <Button variant="secondary" onClick={handleDisable} loading={busy}>
            <BellOff size={16} /> Désactiver les notifications
          </Button>
        )}

        {msg && <p className="text-xs text-gray-400">{msg}</p>}
      </CardContent>
    </Card>
  )
}
