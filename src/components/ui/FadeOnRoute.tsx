'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

// Rejoue l'animation CSS .page-fade à chaque changement de route (clé = pathname).
// Aucune logique lourde : juste un remount du wrapper.
export function FadeOnRoute({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  return (
    <div key={pathname} className="page-fade">
      {children}
    </div>
  )
}
