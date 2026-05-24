import type { ReactNode } from 'react'
import { Zap } from 'lucide-react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Left - Branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-gray-950 via-violet-950/30 to-gray-950 border-r border-gray-800/50 p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-violet-600/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
              <Zap size={22} className="text-gray-950 fill-gray-950" />
            </div>
            <span className="font-black text-2xl tracking-tight text-white">
              GRIND <span className="text-gray-500 font-light">or</span> DIE
            </span>
          </div>
        </div>
        <div className="relative space-y-6">
          <h1 className="text-4xl font-black text-white leading-tight">
            Deviens la meilleure<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
              version de toi-même.
            </span>
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed max-w-md">
            Track tes habitudes, gagne des points, défie tes amis.
            Chaque action compte. Chaque jour compte.
          </p>
          <div className="flex gap-6">
            <div className="text-center">
              <div className="text-2xl font-black text-white">+60</div>
              <div className="text-xs text-gray-500">Activités</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-white">10</div>
              <div className="text-xs text-gray-500">Max par groupe</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-violet-400">∞</div>
              <div className="text-xs text-gray-500">Progression</div>
            </div>
          </div>
        </div>
        <div className="relative">
          <p className="text-xs text-gray-700">© 2025 Grind or Die. Tous droits réservés.</p>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
              <Zap size={18} className="text-gray-950 fill-gray-950" />
            </div>
            <span className="font-black text-xl tracking-tight text-white">
              GRIND <span className="text-gray-500 font-light">or</span> DIE
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
