export type ToastType = 'success' | 'error' | 'info'

export interface ToastItem {
  id: string
  type: ToastType
  message: string
  exiting?: boolean
}

type Listener = (toasts: ToastItem[]) => void

let items: ToastItem[] = []
const listeners = new Set<Listener>()

function notify() {
  const snapshot = [...items]
  listeners.forEach(l => l(snapshot))
}

export function toast(type: ToastType, message: string, duration = 3500) {
  const id = Math.random().toString(36).slice(2, 9)
  items = [...items, { id, type, message }]
  notify()

  setTimeout(() => {
    items = items.map(t => t.id === id ? { ...t, exiting: true } : t)
    notify()
    setTimeout(() => {
      items = items.filter(t => t.id !== id)
      notify()
    }, 250)
  }, duration)
}

export function subscribeToToasts(listener: Listener): () => void {
  listeners.add(listener)
  listener([...items])
  return () => { listeners.delete(listener) }
}
