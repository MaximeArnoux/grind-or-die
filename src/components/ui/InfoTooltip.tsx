'use client'

import { useState } from 'react'
import { Info } from 'lucide-react'

export function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)

  return (
    <span className="relative inline-flex shrink-0">
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen(v => !v) }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="text-gray-600 hover:text-gray-300 transition-colors cursor-help flex items-center"
      >
        <Info size={13} />
      </span>
      {open && (
        <span
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 w-44 px-2.5 py-1.5 rounded-lg bg-gray-950 border border-gray-700 text-[11px] text-gray-200 text-center shadow-xl pointer-events-none"
        >
          {text}
        </span>
      )}
    </span>
  )
}
