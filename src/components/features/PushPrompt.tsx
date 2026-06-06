'use client'

import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { pushSupported, enablePush } from '@/lib/push'

export function PushPrompt() {
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!pushSupported()) return
    if (Notification.permission !== 'default') return

    // Seulement en mode PWA (standalone = installée sur l'écran d'accueil)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator && (navigator as any).standalone === true)

    if (!isStandalone) return

    // Délai court pour laisser l'app se charger
    const t = setTimeout(() => setVisible(true), 1500)
    return () => clearTimeout(t)
  }, [])

  async function handleAllow() {
    setLoading(true)
    await enablePush()
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-10">
      <div className="bg-gray-900 border border-violet-500/30 rounded-2xl p-6 shadow-2xl w-full max-w-xs flex items-start gap-4">
        <div className="w-9 h-9 rounded-xl bg-violet-600/20 flex items-center justify-center shrink-0">
          <Bell size={18} className="text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">Active les notifications</p>
          <p className="text-xs text-gray-400 mt-0.5">Reçois un rappel chaque soir pour logger tes activités.</p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleAllow}
              disabled={loading}
              className="flex-1 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? '...' : 'Autoriser'}
            </button>
            <button
              onClick={() => setVisible(false)}
              className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs transition-colors"
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
