import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, isToday, isYesterday, startOfWeek, endOfWeek, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
  const d = typeof date === 'string' ? parseISO(date) : date
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
