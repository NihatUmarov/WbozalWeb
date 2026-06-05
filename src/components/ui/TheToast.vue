<template>
  <TransitionGroup name="toast-fade" tag="div" class="toast-list">
    <div v-for="toast in toasts" :key="toast.id" class="toast-card glass-effect">
      <div class="toast-content">
        <span :class="['toast-icon', `toast-icon--${toast.type}`]">{{ toast.icon }}</span>
        <p class="toast-msg">{{ toast.message }}</p>
      </div>
    </div>
  </TransitionGroup>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  icon: string
}

const toasts = ref<Toast[]>([])
let toastId = 0

const show = (
  message: string,
  type: 'success' | 'error' | 'warning' | 'info' = 'info',
  duration = 3000,
) => {
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

defineExpose({ show })
</script>

<style scoped>
.toast-list {
  position: fixed;
  bottom: var(--spacing-24);
  left: 50%;
  transform: translateX(-50%);
  z-index: var(--z-toast);
  display: flex;
  flex-direction: column-reverse;
  gap: var(--spacing-8);
  pointer-events: none;
  align-items: center;
}
.toast-card {
  width: 100%;
  max-width: 320px;
  background: var(--glass-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-10);
  box-shadow: var(--shadow-glass);
  padding: var(--spacing-12) var(--spacing-16);
  pointer-events: auto;
  transform-origin: bottom center;
}
.toast-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-12);
}

.toast-icon {
  width: 20px;
  height: 20px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 11px;
  flex-shrink: 0;
  color: #fff;
}
.toast-icon--success {
  background-color: var(--color-success);
}
.toast-icon--error {
  background-color: var(--color-error);
}
.toast-icon--warning {
  background-color: var(--color-warning);
}
.toast-icon--info {
  background-color: var(--color-primary);
}

.toast-msg {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(100%) scale(0.9);
}
.toast-fade-leave-active {
  position: absolute;
}
</style>
