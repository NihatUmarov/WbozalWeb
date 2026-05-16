<template>
  <Transition name="toast">
    <div v-if="visible" class="toast-wrapper">
      <!-- Динамически меняем класс в зависимости от типа: error, success, warning -->
      <div :class="['toast-content', toastType]">
        <div class="icon-circle">
          <!-- Динамическая иконка -->
          {{ icon }}
        </div>
        <span class="message">{{ message }}</span>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// Создаем тип для доступных вариантов
type ToastType = 'error' | 'success' | 'warning'

const visible = ref(false)
const message = ref('')
const toastType = ref<ToastType>('error') // по умолчанию пусть будет ошибка

// Вычисляем иконку в зависимости от типа тоста
const icon = computed(() => {
  if (toastType.value === 'success') return '✓'
  if (toastType.value === 'warning') return '⚠'
  return '!' // для error
})

// Теперь функция принимает еще и тип (по умолчанию 'success', если не передали)
const show = (text: string, type: ToastType = 'success', duration = 3000) => {
  message.value = text
  toastType.value = type
  visible.value = true

  setTimeout(() => {
    visible.value = false
  }, duration)
}

// Экспортируем функцию наружу
defineExpose({ show })
</script>

<style scoped>
.toast-wrapper {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  padding: 12px 20px;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  min-width: 300px;
  border: 1px solid #e2e8f0; /* Нейтральная рамка по умолчанию */
  transition: all 0.3s ease;
}

.icon-circle {
  width: 24px;
  height: 24px;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

/* --- СТИЛИ ДЛЯ РАЗНЫХ ТИПОВ --- */

/* 1. Ошибка (Красный) */
.toast-content.error {
  border-color: #fee2e2;
}
.toast-content.error .icon-circle {
  background: #ef4444;
}

/* 2. Успех (Зеленый) */
.toast-content.success {
  border-color: #dcfce7;
}
.toast-content.success .icon-circle {
  background: #22c55e;
}

/* 3. Предупреждение (Желто-оранжевый) */
.toast-content.warning {
  border-color: #fef3c7;
}
.toast-content.warning .icon-circle {
  background: #f59e0b;
}

.message {
  color: #1e293b;
  font-size: 14px;
  font-weight: 500;
}

/* АНИМАЦИЯ: Выезд снизу вверх */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(100px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}
</style>
