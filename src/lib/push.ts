import { savePushSubscription, removePushSubscription } from '@/app/(app)/push/actions'

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

export function pushSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export async function getPushStatus(): Promise<'granted' | 'denied' | 'default' | 'unsupported'> {
  if (!pushSupported()) return 'unsupported'
  return Notification.permission as 'granted' | 'denied' | 'default'
}

export async function enablePush(): Promise<{ ok: boolean; error?: string }> {
  if (!pushSupported()) return { ok: false, error: 'Notifications non supportées sur cet appareil' }
  if (!VAPID_PUBLIC) return { ok: false, error: 'Configuration manquante' }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return { ok: false, error: 'Permission refusée' }

  const reg = await navigator.serviceWorker.register('/sw.js')
  await navigator.serviceWorker.ready

  const existing = await reg.pushManager.getSubscription()
  const sub = existing ?? await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
  })

  const result = await savePushSubscription(JSON.parse(JSON.stringify(sub)))
  if (result.error) return { ok: false, error: result.error }
  return { ok: true }
}

export async function disablePush(): Promise<{ ok: boolean }> {
  if (!pushSupported()) return { ok: false }
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  if (sub) {
    await removePushSubscription(sub.endpoint)
    await sub.unsubscribe()
  }
  return { ok: true }
}
