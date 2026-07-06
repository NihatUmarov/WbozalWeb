<template>
  <Teleport to="body">
    <TransitionGroup name="toast-fade" tag="div" class="toast-list" style="z-index: 99999">
      <div v-for="toast in toasts" :key="toast.id" class="toast-card glass-effect">
        <div class="toast-content">
          <span :class="['toast-icon', `toast-icon--${toast.type}`]">{{ toast.icon }}</span>
          <p class="toast-msg">{{ toast.message }}</p>
        </div>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast'
const { toasts } = useToast()
</script>

<style scoped>
/* Если стили .toast-list лежат в другом файле,
  этот блок переопределит позиционирование и заставит его быть поверх всего.
*/
.toast-list {
  position: fixed !important;
  /* Укажите ваше привычное расположение, если оно сбросилось, например: */
  top: 20px;
  right: 20px;

  /* Максимальный приоритет отображения */
  z-index: 99999 !important;

  /* Чтобы сквозь пустую область контейнера тостов можно было кликать по элементам шторки */
  pointer-events: none;
}

.toast-card {
  /* Возвращаем кликабельность самим карточкам уведомлений (например, если там будет крестик) */
  pointer-events: auto;
}
</style>
