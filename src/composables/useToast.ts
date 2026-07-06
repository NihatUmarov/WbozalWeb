// src/composables/useToast.ts
import { ref } from 'vue'

export interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  icon: string
}

// Глобальный стейт, доступный всем импортам
const toasts = ref<Toast[]>([])
let toastId = 0

export function useToast() {
  const show = (message: string, type: Toast['type'] = 'info', duration = 3000) => {
    const icons = { success: '✓', warning: '⚠', error: '!', info: 'i' }

    const newToast: Toast = {
      id: toastId++,
      message,
      type,
      icon: icons[type],
    }

    toasts.value.unshift(newToast)

    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== newToast.id)
    }, duration)
  }

  // Удобные обертки, чтобы не писать тип строкой
  return {
    toasts,
    show,
    success: (msg: string, dur?: number) => show(msg, 'success', dur),
    error: (msg: string, dur?: number) => show(msg, 'error', dur),
    warning: (msg: string, dur?: number) => show(msg, 'warning', dur),
    info: (msg: string, dur?: number) => show(msg, 'info', dur),
  }
}
