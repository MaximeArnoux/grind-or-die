'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  value: number
  className?: string
  prefix?: string
  suffix?: string
  duration?: number
}

export function AnimatedNumber({ value, className, prefix = '', suffix = '', duration = 400 }: Props) {
  const [display, setDisplay] = useState(value)
  const [popping, setPopping] = useState(false)
  const prevRef = useRef(value)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (value === prevRef.current) return
    const from = prevRef.current
    const to = value
    prevRef.current = value

    setPopping(true)
    setTimeout(() => setPopping(false), 300)

    cancelAnimationFrame(rafRef.current)
    const start = performance.now()

    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setDisplay(Math.round(from + (to - from) * eased))
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value, duration])

  return (
    <span className={cn(popping ? 'animate-number-pop inline-block' : 'inline-block', className)}>
      {prefix}{display >= 0 ? `+${display}` : display}{suffix}
    </span>
  )
}
