<template>
  <Teleport to="body">
    <Transition :name="isSheet ? 'sheet-fade' : 'modal-fade'">
      <div v-if="isOpen" :class="isSheet ? 'sheet-backdrop' : 'modal-backdrop'" @click="close" />
    </Transition>

    <Transition :name="isSheet ? 'sheet-slide' : 'modal-zoom'">
      <div
        v-if="isOpen"
        :class="isSheet ? 'sheet-content' : 'modal-wrapper-centered'"
        :style="wrapperStyle"
        @click.stop="isSheet ? null : close()"
      >
        <div :class="[isSheet ? 'sheet-inner-container' : 'modal-window-content', 'scrollable-content']" @click.stop>
          <!-- Header -->
          <div :class="['flex items-center justify-between gap-18 py-10 px-24 border-b', isSheet ? 'sheet-header' : 'modal-custom-header']">
            <div class="flex-1 flex items-center gap-18">
              <span v-if="badge" :class="['badge text-base px-12 py-6 shrink-0', `badge--${badge.variant || 'success'}`]">
                {{ badge.text }}
              </span>
              <slot name="header" />
            </div>
            <button class="ui-close-btn" @click="close">✕</button>
          </div>

          <!-- Body -->
          <div :class="[isSheet ? 'sheet-body px-24 py-16' : 'modal-custom-body', 'scrollable-content']">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" :class="[isSheet ? 'sheet-footer px-24 py-12 border-t flex justify-end gap-18' : 'modal-custom-footer']">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Skeleton Loader (Shared logic but visually independent) -->
  <div v-if="skeleton" :class="['skeleton', `skeleton--${skeleton.variant || 'text'}`]" :style="skeletonStyle">
    <div class="skeleton__shimmer" />
  </div>
</template>

<script setup lang="ts">
import { watch, onUnmounted, computed } from 'vue'

interface Props {
  isOpen?: boolean
  variant?: 'modal' | 'sheet'
  badge?: { text: string; variant?: 'success' | 'error' | 'warning' }
  maxWidth?: 'sm' | 'md' | 'lg' | '2xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full'
  skeleton?: {
    variant?: 'text' | 'title' | 'caption' | 'circular' | 'rectangular' | 'rounded'
    width?: string | number
    height?: string | number
  }
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  variant: 'modal',
  maxWidth: 'md'
})

const emit = defineEmits<{
  'update:isOpen': [value: boolean]
}>()

const close = () => emit('update:isOpen', false)
const isSheet = computed(() => props.variant === 'sheet')

const widthMap = {
  sm: '400px',
  md: '520px',
  lg: '650px',
  '2xl': '850px',
  '4xl': '1000px',
  '5xl': '1140px',
  '6xl': '1152px',
  '7xl': '1400px',
  full: '100%'
}

const wrapperStyle = computed(() => ({
  [isSheet.value ? '--sheet-width' : '--modal-max-width']: widthMap[props.maxWidth!]
}))

// Prevent body scroll when open
watch(() => props.isOpen, (v) => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = v ? 'hidden' : ''
  }
}, { immediate: true })

onUnmounted(() => {
  if (typeof document !== 'undefined') document.body.style.overflow = ''
})

const skeletonStyle = computed(() => {
  if (!props.skeleton) return {}
  const format = (v?: string | number) => typeof v === 'number' ? `${v}px` : v
  return {
    width: format(props.skeleton.width),
    height: format(props.skeleton.height)
  }
})
</script>

<style scoped>
.modal-window-content,
.sheet-inner-container {
  display: flex;
  flex-direction: column;
  max-height: 85vh;
  overflow: hidden;
}

.sheet-inner-container {
  max-height: 90vh;
  background: var(--color-surface);
  border-radius: 0 0 16px 16px;
}

.scrollable-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.scrollable-content::-webkit-scrollbar {
  width: 6px;
}

.scrollable-content::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 4px;
}

.skeleton {
  background: var(--color-skeleton-bg);
  overflow: hidden;
  position: relative;
}

.skeleton--text { border-radius: 4px; height: 1em; width: 100%; }
.skeleton--title { border-radius: 4px; height: 1.5em; width: 100%; }
.skeleton--caption { border-radius: 4px; height: 0.75em; width: 100%; }
.skeleton--circular { border-radius: 50%; }
.skeleton--rectangular { border-radius: 0; }
.skeleton--rounded { border-radius: 8px; }

.skeleton__shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
</style>
