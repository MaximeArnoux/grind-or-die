'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Moon, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function SleepReminder({ sleepLoggedToday }: { sleepLoggedToday: boolean }) {
  const router = useRouter()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (sleepLoggedToday) return

    // Heure + date Paris
    const parisStr = new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Paris' }) // "YYYY-MM-DD HH:mm:ss"
    const today = parisStr.slice(0, 10)
    const hour = parseInt(parisStr.slice(11, 13), 10)

    // Pas avant 6h du matin
    if (hour < 6) return

    // Déjà reporté aujourd'hui ?
    if (localStorage.getItem(`sleep-reminder-${today}`)) return

    setShow(true)
  }, [sleepLoggedToday])

  function dismiss() {
    const today = new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Paris' }).slice(0, 10)
    localStorage.setItem(`sleep-reminder-${today}`, '1')
    setShow(false)
  }

  function logNow() {
    dismiss()
    router.push('/ajouter?sleep=1')
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={dismiss} />
      <div className="relative z-10 w-full max-w-sm bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-6 text-center">
        <button onClick={dismiss} className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-white">
          <X size={18} />
        </button>

        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-indigo-500/15 flex items-center justify-center">
          <Moon size={26} className="text-indigo-400" />
        </div>

        <h2 className="text-lg font-black text-white mb-1">Bien dormi ? 😴</h2>
        <p className="text-sm text-gray-400 mb-5">
          Logge ta nuit pour commencer la journée. Ça prend 10 secondes.
        </p>

        <div className="flex flex-col gap-2">
          <Button onClick={logNow} className="w-full">
            <Moon size={16} /> Logger mon sommeil
          </Button>
          <button onClick={dismiss} className="text-sm text-gray-500 hover:text-gray-300 py-1.5 transition-colors">
            Plus tard
          </button>
        </div>
      </div>
    </div>
  )
}
