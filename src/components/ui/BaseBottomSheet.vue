<template>
  <Teleport to="body">
    <Transition name="bottom-sheet-fade">
      <div v-if="isOpen" class="sheet-overlay" @click="close"></div>
    </Transition>

    <Transition name="bottom-sheet-slide">
      <div v-if="isOpen" class="sheet-content" :class="maxWidthClass" @click.stop>
        <div class="sheet-handle-container" @click="close">
          <div class="sheet-handle"></div>
        </div>

        <div class="sheet-header">
          <div class="flex-1 w-full">
            <slot name="header"></slot>
          </div>
          <button class="sheet-close-btn" @click="close">✕</button>
        </div>

        <div class="sheet-body">
          <slot></slot>
        </div>

        <div v-if="$slots.footer" class="sheet-footer">
          <slot name="footer"></slot>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch, onUnmounted } from 'vue'

const props = withDefaults(
  defineProps<{
    isOpen: boolean
    // Добавили '7xl' в доступные типы
    maxWidth?: '2xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full'
  }>(),
  {
    maxWidth: '4xl',
  },
)

const emit = defineEmits<{
  'update:isOpen': [value: boolean]
}>()

const close = () => {
  emit('update:isOpen', false)
}

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  },
)

onUnmounted(() => {
  document.body.style.overflow = ''
})

const maxWidthClass = computed(() => {
  switch (props.maxWidth) {
    case '2xl':
      return 'sheet-max-w-2xl'
    case '5xl':
      return 'sheet-max-w-5xl'
    case '6xl':
      return 'sheet-max-w-6xl'
    case '7xl':
      return 'sheet-max-w-7xl' // <-- Маппинг для нового класса ширины
    case 'full':
      return 'sheet-max-w-full'
    case '4xl':
    default:
      return 'sheet-max-w-4xl'
  }
})
</script>

<style scoped>
/* ФОН (OVERLAY) - Жестко фиксируем поверх всего */
.sheet-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(15, 23, 42, 0.6); /* Полупрозрачный темный фон */
  backdrop-filter: blur(6px); /* Тот самый красивый блюр */
  -webkit-backdrop-filter: blur(6px);
  z-index: 99998; /* Выше всех элементов на сайте */
}

/* САМА ШТОРКА (CONTENT) */
.sheet-content {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%); /* Центрируем по горизонтали */
  width: 100%;
  max-height: 92vh; /* Максимальная высота - 92% от экрана */
  background-color: #ffffff; /* Белый фон карточки */
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.2);
  border-top-left-radius: 28px;
  border-top-right-radius: 28px;
  z-index: 99999; /* Поверх оверлея */
  display: flex;
  flex-direction: column;
}

/* Ширина шторки */
.sheet-max-w-2xl {
  max-width: 42rem;
} /* ~672px */
.sheet-max-w-4xl {
  max-width: 56rem;
} /* ~896px */
.sheet-max-w-5xl {
  max-width: 64rem;
} /* ~1024px */
.sheet-max-w-6xl {
  max-width: 72rem;
} /* ~1152px */
.sheet-max-w-7xl {
  max-width: 80rem;
} /* ~1280px (Широкий стандарт мониторов!) */

/* Для full даем небольшие отступы по бокам, чтобы на ультрашироких экранах не прилипало впритык */
.sheet-max-w-full {
  max-width: calc(100% - 32px);
}

/* Внутренние элементы шторки */
.sheet-handle-container {
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 14px 0;
  cursor: pointer;
  flex-shrink: 0;
}

.sheet-handle {
  width: 60px;
  height: 6px;
  background-color: #cbd5e1;
  border-radius: 9999px;
  transition: background-color 0.2s;
}

.sheet-handle-container:hover .sheet-handle {
  background-color: #94a3b8;
}

.sheet-header {
  padding: 0 28px 16px 28px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.sheet-close-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #f1f5f9;
  border: none;
  font-size: 16px;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-left: 16px;
  transition: all 0.2s;
}

.sheet-close-btn:hover {
  background-color: #fee2e2;
  color: #ef4444;
}

.sheet-body {
  padding: 28px;
  overflow-y: auto;
  flex-grow: 1;
  background-color: #f8fafc; /* Чуть сероватый фон для зоны с таблицей/формой */
}

.sheet-footer {
  background-color: #ffffff;
  border-top: 1px solid #e2e8f0;
  padding: 20px 28px;
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
}

/* АНИМАЦИИ */
.bottom-sheet-fade-enter-active,
.bottom-sheet-fade-leave-active {
  transition: opacity 0.3s ease;
}
.bottom-sheet-fade-enter-from,
.bottom-sheet-fade-leave-to {
  opacity: 0;
}

/* Анимация выезда снизу */
.bottom-sheet-slide-enter-active,
.bottom-sheet-slide-leave-active {
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.bottom-sheet-slide-enter-from,
.bottom-sheet-slide-leave-to {
  transform: translate(-50%, 100%);
}
</style>
