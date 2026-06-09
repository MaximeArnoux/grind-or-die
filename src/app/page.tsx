import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Zap, Trophy, Flame, Users, TrendingUp, Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function LandingPage() {
  // Si déjà connecté → direct au dashboard
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  const features = [
    { icon: <Trophy size={20} className="text-yellow-400" />, title: 'Classements', desc: 'Affronte tes amis et grimpe au classement chaque semaine.' },
    { icon: <Flame size={20} className="text-orange-400" />, title: 'Objectifs du jour', desc: 'Valide tes habitudes quotidiennes et gagne des points bonus.' },
    { icon: <Users size={20} className="text-violet-400" />, title: 'Groupes privés', desc: 'Crée un groupe, invite tes potes, et restez disciplinés ensemble.' },
    { icon: <TrendingUp size={20} className="text-green-400" />, title: 'Suivi de progression', desc: 'Visualise ton évolution semaine après semaine.' },
    { icon: <Bell size={20} className="text-blue-400" />, title: 'Notifications', desc: 'Sois prévenu quand un pote te dépasse. Reprends ta place.' },
    { icon: <Zap size={20} className="text-yellow-400" />, title: '+40 activités', desc: 'Sport, lecture, sommeil, nutrition… chaque action compte.' },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-5 sm:px-8 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Zap size={18} className="text-gray-950 fill-gray-950" />
          </div>
          <span className="font-black text-xl tracking-tight">GRIND <span className="text-gray-600 font-light">or</span> DIE</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-300 hover:text-white transition-colors">
            Se connecter
          </Link>
          <Link href="/register" className="px-4 py-2 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 transition-colors">
            S&apos;inscrire
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-5 sm:px-8 pt-16 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold mb-6">
          🔥 L&apos;app de discipline entre amis
        </div>
        <h1 className="text-4xl sm:text-6xl font-black leading-tight mb-5">
          Deviens la meilleure<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
            version de toi-même.
          </span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">
          Track tes habitudes, gagne des points, défie tes amis. Chaque action compte, chaque jour compte.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/register" className="px-6 py-3.5 rounded-xl font-bold bg-violet-600 hover:bg-violet-500 transition-colors shadow-lg shadow-violet-600/30">
            Commencer gratuitement
          </Link>
          <Link href="/login" className="px-6 py-3.5 rounded-xl font-bold border border-gray-700 hover:border-gray-500 transition-colors">
            J&apos;ai déjà un compte
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 pb-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center mb-3">{f.icon}</div>
              <h3 className="font-bold mb-1">{f.title}</h3>
              <p className="text-sm text-gray-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="max-w-3xl mx-auto px-5 sm:px-8 pb-24 text-center">
        <div className="bg-gradient-to-br from-violet-600/20 to-indigo-600/10 border border-violet-500/20 rounded-3xl p-10">
          <h2 className="text-2xl sm:text-3xl font-black mb-3">Prêt à te dépasser ?</h2>
          <p className="text-gray-400 mb-6">Rejoins Grind or Die et commence ta série dès aujourd&apos;hui.</p>
          <Link href="/register" className="inline-block px-8 py-3.5 rounded-xl font-bold bg-violet-600 hover:bg-violet-500 transition-colors shadow-lg shadow-violet-600/30">
            Créer mon compte
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-800/50 py-8 text-center text-xs text-gray-600">
        © 2026 Grind or Die. Tous droits réservés.
      </footer>
    </div>
  )
}
