<template>
  <Teleport to="body">
    <Transition name="sheet-fade">
      <div v-if="isOpen" class="sheet-overlay" @click="close"></div>
    </Transition>

    <Transition name="sheet-slide">
      <div
        v-if="isOpen"
        class="sheet-content"
        :style="{ '--sheet-width': widthMap[maxWidth] }"
        @click.stop
      >
        <div class="sheet-handle-bar" @click="close">
          <div class="sheet-line-handle"></div>
        </div>

        <div class="sheet-header">
          <div class="flex-1 w-full"><slot name="header"></slot></div>
          <button class="sheet-close" @click="close">✕</button>
        </div>

        <div class="sheet-body"><slot></slot></div>

        <div v-if="$slots.footer" class="sheet-footer"><slot name="footer"></slot></div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { watch, onUnmounted } from 'vue'

const props = withDefaults(
  defineProps<{
    isOpen: boolean
    maxWidth?: '2xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full'
  }>(),
  { maxWidth: '4xl' },
)

const emit = defineEmits<{ 'update:isOpen': [value: boolean] }>()
const close = () => emit('update:isOpen', false)

const widthMap = {
  '2xl': '672px',
  '4xl': '896px',
  '5xl': '1024px',
  '6xl': '1152px',
  '7xl': '1280px',
  full: '100%',
}

watch(
  () => props.isOpen,
  (val) => {
    document.body.style.overflow = val ? 'hidden' : ''
  },
)

onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>

<style scoped>
.sheet-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(15, 23, 42, 0.4);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  /* Жесткий z-index оверлея, перебивающий любые sticky-таблицы */
  z-index: 9998;
}
.sheet-content {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: var(--sheet-width);
  max-height: 92vh;
  background-color: var(--color-surface);
  /* Привели к общему стандарту радиусов */
  border-top-left-radius: var(--radius-12);
  border-top-right-radius: var(--radius-12);
  /* Пересадили на рабочий глобальный токен тени */
  box-shadow: var(--shadow-md);
  /* Шторка всегда гарантированно выше своего оверлея */
  z-index: 9999;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
}
.sheet-handle-bar {
  width: 100%;
  display: flex;
  justify-content: center;
  padding: var(--spacing-12) 0;
  cursor: pointer;
}
.sheet-line-handle {
  width: 48px;
  height: 4px;
  background-color: var(--color-border-dark);
  border-radius: var(--radius-full);
}
.sheet-header {
  padding: 0 var(--spacing-24) var(--spacing-12);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.sheet-close {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  background: var(--color-background-secondary);
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}
.sheet-close:hover {
  background-color: var(--color-error-subtle);
  color: var(--color-error-text);
}
.sheet-body {
  padding: var(--spacing-20) var(--spacing-24);
  overflow-y: auto;
  flex-grow: 1;
  background-color: var(--color-background-secondary);
  scrollbar-width: thin;
}
.sheet-footer {
  background-color: var(--color-surface);
  border-top: 1px solid var(--color-border);
  padding: var(--spacing-16) var(--spacing-24);
  display: flex;
  justify-content: flex-end;
}

.sheet-fade-enter-active,
.sheet-fade-leave-active {
  transition: opacity 0.2s ease;
}
.sheet-fade-enter-from,
.sheet-fade-leave-to {
  opacity: 0;
}
.sheet-slide-enter-active,
.sheet-slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.sheet-slide-enter-from,
.sheet-slide-leave-to {
  transform: translate(-50%, 100%);
}
</style>
