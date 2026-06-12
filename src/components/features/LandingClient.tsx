'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Zap, Trophy, Flame, Users, TrendingUp, Bell, ArrowDown, Star, ChevronRight } from 'lucide-react'

/* ── helpers ─────────────────────────────────────────────── */

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0)
  const { ref, visible } = useInView()
  useEffect(() => {
    if (!visible) return
    let start = 0
    const step = Math.ceil(target / 50)
    const id = setInterval(() => {
      start += step
      if (start >= target) { setVal(target); clearInterval(id) }
      else setVal(start)
    }, 28)
    return () => clearInterval(id)
  }, [visible, target])
  return <span ref={ref}>{val}{suffix}</span>
}

const FEATURES = [
  { icon: <Trophy size={20} className="text-yellow-400" />, color: 'from-yellow-500/10 to-orange-500/5', border: 'border-yellow-500/15', title: 'Classements', desc: 'Affronte tes amis et grimpe au classement chaque semaine.' },
  { icon: <Flame size={20} className="text-orange-400" />, color: 'from-orange-500/10 to-red-500/5', border: 'border-orange-500/15', title: 'Objectifs du jour', desc: 'Valide tes habitudes quotidiennes et gagne des points bonus.' },
  { icon: <Users size={20} className="text-violet-400" />, color: 'from-violet-500/10 to-purple-500/5', border: 'border-violet-500/15', title: 'Groupes privés', desc: 'Crée un groupe, invite tes potes, et restez disciplinés ensemble.' },
  { icon: <TrendingUp size={20} className="text-green-400" />, color: 'from-green-500/10 to-emerald-500/5', border: 'border-green-500/15', title: 'Suivi de progression', desc: 'Visualise ton évolution semaine après semaine.' },
  { icon: <Bell size={20} className="text-blue-400" />, color: 'from-blue-500/10 to-cyan-500/5', border: 'border-blue-500/15', title: 'Notifications', desc: 'Sois prévenu quand un pote te dépasse. Reprends ta place.' },
  { icon: <Zap size={20} className="text-yellow-300" />, color: 'from-yellow-400/10 to-amber-500/5', border: 'border-yellow-400/15', title: '+40 activités', desc: 'Sport, lecture, sommeil, nutrition… chaque action compte.' },
]

const CHIPS = ['🏋️ Musculation', '📚 Lecture', '🧘 Méditation', '🏃 Course', '💧 Hydratation', '😴 Sommeil', '🥗 Nutrition', '🎯 Focus']

const STATS = [
  { value: 40, suffix: '+', label: 'Activités' },
  { value: 100, suffix: '%', label: 'Gratuit' },
  { value: 7, suffix: 'j/7', label: 'Disponible' },
]

/* ── component ───────────────────────────────────────────── */

export function LandingClient() {
  const featuresRef = useInView(0.08)
  const statsRef = useInView(0.2)
  const ctaRef = useInView(0.2)

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden relative">

      {/* ── Background blobs ─────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="blob absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-violet-600/12 blur-[100px]" />
        <div className="blob-2 absolute top-1/3 -right-40 w-[400px] h-[400px] rounded-full bg-indigo-600/10 blur-[90px]" />
        <div className="blob-3 absolute bottom-1/4 left-1/4 w-[360px] h-[360px] rounded-full bg-purple-700/8 blur-[80px]" />
        {/* Fine grid overlay */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'linear-gradient(#a78bfa 1px, transparent 1px), linear-gradient(90deg, #a78bfa 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
      </div>

      {/* ── Header ───────────────────────────────────────── */}
      <header className="relative z-10 flex items-center justify-between px-5 sm:px-8 py-5 max-w-6xl mx-auto">
        <div className="float-logo flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Zap size={18} className="text-gray-950 fill-gray-950" />
          </div>
          <span className="font-black text-xl tracking-tight">
            GRIND <span className="text-gray-600 font-light">or</span> DIE
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-300 hover:text-white">
            Se connecter
          </Link>
          <Link href="/register" className="px-4 py-2 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 shadow-md shadow-violet-600/20">
            S&apos;inscrire
          </Link>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative z-10 max-w-4xl mx-auto px-5 sm:px-8 pt-14 pb-20 text-center">

        {/* Badge */}
        <div className="badge-pulse inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-semibold mb-7 slide-up-fade" style={{ animationDelay: '0.05s' }}>
          <Star size={11} className="fill-violet-400 text-violet-400" />
          L&apos;app de discipline entre amis
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl font-black leading-tight mb-5">
          <span className="block slide-up-fade" style={{ animationDelay: '0.15s' }}>Deviens la meilleure</span>
          <span className="block slide-up-fade" style={{ animationDelay: '0.28s' }}>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-300 to-indigo-400 animate-gradient-text">
              version de toi-même.
            </span>
          </span>
        </h1>

        {/* Sub */}
        <p className="slide-up-fade text-gray-400 text-lg max-w-xl mx-auto mb-8" style={{ animationDelay: '0.38s' }}>
          Track tes habitudes, gagne des points, défie tes amis.<br className="hidden sm:block" />
          Chaque action compte, chaque jour compte.
        </p>

        {/* CTAs */}
        <div className="slide-up-fade flex items-center justify-center gap-3 mb-10" style={{ animationDelay: '0.5s' }}>
          <Link href="/register" className="cta-glow flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-600/30 text-sm">
            Commencer gratuitement <ChevronRight size={16} />
          </Link>
          <Link href="/login" className="px-6 py-3.5 rounded-xl font-bold border border-gray-700 hover:border-gray-500 text-sm">
            J&apos;ai un compte
          </Link>
        </div>

        {/* Floating chips */}
        <div className="slide-up-fade flex flex-wrap justify-center gap-2 max-w-lg mx-auto" style={{ animationDelay: '0.62s' }}>
          {CHIPS.map((chip, i) => (
            <span
              key={chip}
              className="float-chip px-3 py-1 rounded-full bg-gray-800/70 border border-gray-700/60 text-xs text-gray-300 backdrop-blur-sm"
              style={{ animationDelay: `${i * 0.28}s` }}
            >
              {chip}
            </span>
          ))}
        </div>

        {/* Scroll arrow */}
        <div className="bounce-arrow mt-14 flex justify-center text-gray-600">
          <ArrowDown size={20} />
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────── */}
      <section className="relative z-10 max-w-2xl mx-auto px-5 sm:px-8 pb-20">
        <div ref={statsRef.ref} className={`grid grid-cols-3 gap-4 transition-all duration-700 ${statsRef.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {STATS.map((s, i) => (
            <div key={s.label} className="text-center bg-gray-900/60 border border-gray-800/60 rounded-2xl py-5 backdrop-blur-sm"
              style={{ transitionDelay: `${i * 100}ms` }}>
              <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-violet-400 to-indigo-400">
                {statsRef.visible ? <Counter target={s.value} suffix={s.suffix} /> : `0${s.suffix}`}
              </div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────── */}
      <section ref={featuresRef.ref} className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 pb-20">
        <div className={`text-center mb-10 transition-all duration-700 ${featuresRef.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <h2 className="text-2xl sm:text-3xl font-black mb-2">Tout ce qu&apos;il te faut</h2>
          <p className="text-gray-500 text-sm">Des outils pensés pour te faire progresser au quotidien.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={`bg-gradient-to-br ${f.color} border ${f.border} rounded-2xl p-5 card-depth backdrop-blur-sm transition-all duration-700 ${featuresRef.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${100 + i * 80}ms` }}
            >
              <div className="w-10 h-10 rounded-xl bg-gray-800/80 flex items-center justify-center mb-3 border border-gray-700/40">
                {f.icon}
              </div>
              <h3 className="font-bold mb-1">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────── */}
      <section ref={ctaRef.ref} className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8 pb-24">
        <div className={`relative rounded-3xl p-px transition-all duration-700 ${ctaRef.visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          {/* Animated border */}
          <div className="animated-gradient-border absolute inset-0 rounded-3xl opacity-40" />
          <div className="relative rounded-3xl bg-gray-950/95 p-10 text-center border border-transparent">
            {/* Glow inside */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-600/8 to-indigo-600/5" />
            <div className="relative">
              <div className="text-4xl mb-4">🔥</div>
              <h2 className="text-2xl sm:text-3xl font-black mb-3">Prêt à te dépasser ?</h2>
              <p className="text-gray-400 mb-7 max-w-sm mx-auto">
                Rejoins Grind or Die et commence ta série dès aujourd&apos;hui.
              </p>
              <Link
                href="/register"
                className="cta-glow inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-600/30"
              >
                Créer mon compte <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-gray-800/40 py-8 text-center text-xs text-gray-600">
        © 2026 Grind or Die. Tous droits réservés.
      </footer>
    </div>
  )
}
