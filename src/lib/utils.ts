import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, isToday, isYesterday, startOfWeek, endOfWeek, parseISO, subDays, addDays } from 'date-fns'
import { fr } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Converts a UTC date string to a Date object with Paris local time values
export function toParisDate(dateStr: string | Date): Date {
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  return new Date(d.toLocaleString('sv-SE', { timeZone: 'Europe/Paris' }))
}

// Convertit une Date contenant l'heure murale de Paris (interprétée comme locale)
// en instant UTC réel
export function parisWallToUTC(wall: Date): Date {
  const utcGuess = Date.UTC(
    wall.getFullYear(), wall.getMonth(), wall.getDate(),
    wall.getHours(), wall.getMinutes(), wall.getSeconds()
  )
  const tzStr = new Date(utcGuess).toLocaleString('en-US', { timeZone: 'Europe/Paris' })
  const utcStr = new Date(utcGuess).toLocaleString('en-US', { timeZone: 'UTC' })
  const offset = new Date(tzStr).getTime() - new Date(utcStr).getTime()
  return new Date(utcGuess - offset)
}

// Instant UTC réel pour le début de la semaine Paris courante (lundi 00:00 Paris)
export function parisWeekStartISO(): string {
  const nowParis = new Date(new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Paris' }))
  const wsWall = startOfWeek(nowParis, { weekStartsOn: 1 })
  return parisWallToUTC(wsWall).toISOString()
}

// Plage UTC + libellé pour une semaine Paris, décalée de `weeksAgo` semaines dans le passé
export function parisWeekRange(weeksAgo: number): { startISO: string; endISO: string; label: string } {
  const nowParis = new Date(new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Paris' }))
  const wsWall = startOfWeek(subDays(nowParis, weeksAgo * 7), { weekStartsOn: 1 })
  const weWall = addDays(wsWall, 7) // borne de fin exclusive = lundi suivant
  const lastDay = addDays(wsWall, 6)
  return {
    startISO: parisWallToUTC(wsWall).toISOString(),
    endISO: parisWallToUTC(weWall).toISOString(),
    label: `Semaine du ${format(wsWall, 'd MMM', { locale: fr })} au ${format(lastDay, 'd MMM', { locale: fr })}`,
  }
}

export function formatPoints(points: number): string {
  if (points > 0) return `+${points}`
  return `${points}`
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  if (isToday(d)) return 'Aujourd\'hui'
  if (isYesterday(d)) return 'Hier'
  return format(d, 'dd MMM', { locale: fr })
}

export function formatDateFull(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'EEEE dd MMMM yyyy', { locale: fr })
}

export function formatTimeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)

  if (minutes < 1) return 'À l\'instant'
  if (minutes < 60) return `Il y a ${minutes}min`
  if (hours < 24) return `Il y a ${hours}h`
  return formatDate(d)
}

export function getWeekRange(): { start: Date; end: Date } {
  const now = new Date()
  return {
    start: startOfWeek(now, { weekStartsOn: 1 }),
    end: endOfWeek(now, { weekStartsOn: 1 }),
  }
}

export function getDayName(date: Date): string {
  return format(date, 'EEE', { locale: fr })
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}

export function getRankSuffix(rank: number): string {
  if (rank === 1) return 'er'
  return 'ème'
}

export function computeStreak(logs: { logged_at: string }[]): number {
  if (!logs || logs.length === 0) return 0
  const nowParis = new Date(new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Paris' }))
  const todayKey = format(nowParis, 'yyyy-MM-dd')
  const yesterdayKey = format(subDays(nowParis, 1), 'yyyy-MM-dd')
  const logDates = new Set(logs.map(l => format(toParisDate(l.logged_at), 'yyyy-MM-dd')))
  // Start from today if logged today, otherwise from yesterday (streak still alive)
  let cursor = logDates.has(todayKey) ? nowParis : logDates.has(yesterdayKey) ? subDays(nowParis, 1) : null
  if (!cursor) return 0
  let streak = 0
  while (logDates.has(format(cursor, 'yyyy-MM-dd'))) {
    streak++
    cursor = subDays(cursor, 1)
  }
  return streak
}

export function getStreakEmoji(streak: number): string {
  if (streak >= 30) return '🔥'
  if (streak >= 14) return '⚡'
  if (streak >= 7) return '💪'
  return '🌱'
}

export function getPointsColor(points: number): string {
  if (points > 0) return 'text-green-400'
  if (points < 0) return 'text-red-400'
  return 'text-gray-400'
}

export function getBadgeVariant(type: string): 'positive' | 'negative' | 'bonus' {
  if (type === 'positive') return 'positive'
  if (type === 'negative') return 'negative'
  return 'bonus'
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.substring(0, length) + '...'
}
