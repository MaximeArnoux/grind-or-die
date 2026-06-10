'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  end: number
  duration?: number
  prefix?: string
  suffix?: string
  separator?: boolean // espace pour les milliers
  className?: string
}

export function CountUp({ end, duration = 1300, prefix = '', suffix = '', separator = false, className }: Props) {
  const [value, setValue] = useState(0)
  const rafRef = useRef(0)

  useEffect(() => {
    const start = performance.now()
    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setValue(Math.round(end * eased))
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [end, duration])

  const display = separator ? value.toLocaleString('fr-FR') : String(value)
  return <span className={className}>{prefix}{display}{suffix}</span>
}
