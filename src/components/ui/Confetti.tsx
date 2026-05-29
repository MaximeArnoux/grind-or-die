'use client'

import { useEffect, useRef } from 'react'

const COLORS = ['#7c3aed', '#a855f7', '#06b6d4', '#22c55e', '#f59e0b', '#f472b6', '#60a5fa']

interface Particle {
  x: number; y: number; vx: number; vy: number
  color: string; size: number; rotation: number; spin: number; life: number
}

interface Props {
  active: boolean
  onDone?: () => void
  origin?: { x?: number; y?: number }
}

export function Confetti({ active, onDone, origin }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!active) return
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const ox = (origin?.x ?? 0.5) * canvas.width
    const oy = (origin?.y ?? 0.4) * canvas.height

    const particles: Particle[] = Array.from({ length: 100 }, () => {
      const angle = Math.random() * Math.PI * 2
      const speed = Math.random() * 10 + 4
      return {
        x: ox, y: oy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: Math.random() * 7 + 4,
        rotation: Math.random() * 360,
        spin: (Math.random() - 0.5) * 12,
        life: 1,
      }
    })

    const ctx = canvas.getContext('2d')!
    const w = canvas.width
    const h = canvas.height

    function draw() {
      ctx.clearRect(0, 0, w, h)
      let alive = false

      for (const p of particles) {
        if (p.life <= 0) continue
        alive = true
        p.vy += 0.25
        p.x += p.vx
        p.y += p.vy
        p.rotation += p.spin
        p.life -= 0.012

        ctx.save()
        ctx.globalAlpha = Math.max(0, p.life)
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        ctx.restore()
      }

      if (alive) {
        rafRef.current = requestAnimationFrame(draw)
      } else {
        ctx.clearRect(0, 0, w, h)
        onDone?.()
      }
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [active, onDone, origin])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[200] pointer-events-none"
      style={{ display: active ? 'block' : 'none' }}
    />
  )
}
