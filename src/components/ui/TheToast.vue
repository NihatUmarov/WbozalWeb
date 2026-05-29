<template>
  <TransitionGroup name="toast-list" tag="div" class="toast-list">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="toast-item"
      :class="[`toast-item--${toast.type}`]"
    >
      <div class="toast-item__content">
        <span class="toast-item__icon" :class="[`toast-item__icon--${toast.type}`]">{{
          toast.icon
        }}</span>
        <p class="toast-item__message">{{ toast.message }}</p>
      </div>
    </div>
  </TransitionGroup>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

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
  const icon = computed(() => {
    if (type === 'success') return '✓'
    if (type === 'warning') return '⚠'
    if (type === 'error') return '!'
    return 'i'
  })

  const newToast: Toast = {
    id: toastId++,
    message,
    type,
    icon: icon.value,
  }

  // ИСПРАВЛЕНИЕ 1: Добавляем в начало массива, чтобы новый тост всегда был самым нижним у основания экрана
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
  /* ИСПРАВЛЕНИЕ 2: Переносим контейнер вниз экрана */
  bottom: var(--spacing-24);
  left: 50%;
  transform: translateX(-50%);
  z-index: var(--z-toast);
  display: flex;
  /* ИСПРАВЛЕНИЕ 3: column-reverse заставляет список расти снизу вверх */
  flex-direction: column-reverse;
  gap: var(--spacing-12);
  pointer-events: none;
  align-items: center;
}

.toast-item {
  width: 100%;
  max-width: 320px;
  background: var(--glass-background);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--color-border-glass);
  border-radius: var(--border-radius-10);
  box-shadow: var(--shadow-glass);
  padding: var(--spacing-12);
  display: flex;
  align-items: center;
  pointer-events: auto;
  transition: all var(--transition-base) cubic-bezier(0.34, 1.56, 0.64, 1);
  /* ИСПРАВЛЕНИЕ 4: Точка трансформации теперь снизу по центру */
  transform-origin: bottom center;
}

.toast-item__content {
  display: flex;
  align-items: center;
  gap: var(--spacing-12);
  flex-grow: 1;
}

.toast-item__icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-sm);
  flex-shrink: 0;
  color: white;
}

.toast-item__message {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
  margin: 0;
  flex-grow: 1;
}

.toast-item__icon--success {
  background-color: var(--color-success);
}
.toast-item__icon--error {
  background-color: var(--color-error);
}
.toast-item__icon--warning {
  background-color: var(--color-warning);
}
.toast-item__icon--info {
  background-color: var(--color-info);
}

/* ИСПРАВЛЕНИЕ 5: Меняем анимацию появления */
.toast-list-enter-from,
.toast-list-leave-to {
  opacity: 0;
  /* Смещение 100% означает, что тост изначально спрятан ниже экрана и «выпрыгивает» вверх */
  transform: translateY(100%) scale(0.8);
}

.toast-list-leave-active {
  position: absolute;
}
</style>
