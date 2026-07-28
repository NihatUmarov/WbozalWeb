<template>
  <Teleport to="body">
    <Transition :name="variant === 'sheet' ? 'sheet-fade' : 'modal-fade'">
      <div
        v-if="isOpen"
        :class="variant === 'sheet' ? 'sheet-backdrop' : 'modal-backdrop'"
        @click="close"
      ></div>
    </Transition>

    <Transition :name="variant === 'sheet' ? 'sheet-slide' : 'modal-zoom'">
      <div
        v-if="isOpen"
        :class="variant === 'sheet' ? 'sheet-content' : 'modal-wrapper-centered'"
        :style="wrapperStyle"
        @click.stop="variant === 'sheet' ? null : close()"
      >
        <div
          :class="variant === 'sheet' ? 'sheet-inner-container' : 'modal-window-content'"
          @click.stop
        >
          <div
            :class="
              variant === 'sheet'
                ? 'sheet-header flex items-center justify-between gap-12 py-10 px-16 border-b'
                : 'modal-custom-header'
            "
          >
            <div class="flex-1 w-full flex items-center gap-12">
              <span
                v-if="badge"
                :class="[
                  'badge text-xs px-6 py-2 shrink-0',
                  badge.variant === 'error' ? 'badge--error' : 'badge--success',
                ]"
              >
                {{ badge.text }}
              </span>
              <slot name="header"></slot>
            </div>
            <button class="ui-close-btn" @click="close">✕</button>
          </div>

          <div
            :class="[
              variant === 'sheet' ? 'sheet-body px-16 py-16' : 'modal-custom-body',
              'scrollable-content',
            ]"
          >
            <slot></slot>
          </div>

          <div
            v-if="$slots.footer"
            :class="
              variant === 'sheet'
                ? 'sheet-footer px-16 py-12 border-t flex justify-end gap-12'
                : 'modal-custom-footer'
            "
          >
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <div
    v-if="skeleton"
    :class="['skeleton', `skeleton--${skeleton.variant || 'text'}`]"
    :style="skeletonStyle"
  >
    <div class="skeleton__shimmer"></div>
  </div>
</template>

<script setup lang="ts">
import { watch, onUnmounted, computed } from 'vue'

interface Badge {
  text: string
  variant?: 'success' | 'error' | 'warning'
}

interface SkeletonOpts {
  variant?: 'text' | 'title' | 'caption' | 'circular' | 'rectangular' | 'rounded'
  width?: string | number
  height?: string | number
}

const props = withDefaults(
  defineProps<{
    isOpen?: boolean
    variant?: 'modal' | 'sheet'
    maxWidth?: 'sm' | 'md' | 'lg' | '2xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full'
    badge?: Badge
    skeleton?: SkeletonOpts
  }>(),
  { isOpen: false, variant: 'modal', maxWidth: 'md', skeleton: undefined },
)

const emit = defineEmits<{ (e: 'update:isOpen', value: boolean): void }>()
const close = () => emit('update:isOpen', false)

const widthMap: Record<NonNullable<typeof props.maxWidth>, string> = {
  sm: '400px',
  md: '520px',
  lg: '650px',
  '2xl': '850px',
  '4xl': '1000px',
  '5xl': '1140px',
  '6xl': '1152px',
  '7xl': '1400px',
  full: '100%',
}

const wrapperStyle = computed(() => {
  const width = widthMap[props.maxWidth]
  return props.variant === 'sheet' ? { '--sheet-width': width } : { '--modal-max-width': width }
})

watch(
  () => props.isOpen,
  (val) => {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = val ? 'hidden' : ''
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
})

const skeletonStyle = computed(() => {
  if (!props.skeleton) return {}
  const parse = (val?: string | number) => (typeof val === 'number' ? `${val}px` : val)
  return {
    width: parse(props.skeleton.width),
    height: parse(props.skeleton.height),
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
  background: var(--color-surface, #fff);
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
}

.scrollable-content {
  flex: 1 1 auto;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.scrollable-content::-webkit-scrollbar {
  width: 6px;
}
.scrollable-content::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.skeleton {
  background: var(--color-skeleton-bg, #e2e8f0);
  overflow: hidden;
  position: relative;
}
.skeleton--text {
  border-radius: 4px;
  height: 1em;
  width: 100%;
}
.skeleton--title {
  border-radius: 4px;
  height: 1.5em;
  width: 100%;
}
.skeleton--caption {
  border-radius: 4px;
  height: 0.75em;
  width: 100%;
}
.skeleton--circular {
  border-radius: 50%;
}
.skeleton--rectangular {
  border-radius: 0;
}
.skeleton--rounded {
  border-radius: 8px;
}
.skeleton__shimmer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
</style>
