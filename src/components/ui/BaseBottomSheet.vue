<template>
  <Teleport to="body">
    <Transition name="sheet-fade">
      <div v-if="isOpen" class="sheet-backdrop" @click="close"></div>
    </Transition>

    <Transition name="sheet-slide">
      <div
        v-if="isOpen"
        class="sheet-content"
        :style="{ '--sheet-width': widthMap[maxWidth] }"
        @click.stop
      >
        <div class="sheet-header flex items-center justify-between gap-12 py-10 px-16 border-b">
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

        <div class="sheet-body px-16 py-16">
          <slot></slot>
        </div>

        <div v-if="$slots.footer" class="sheet-footer px-16 py-12 border-t flex justify-end gap-12">
          <slot name="footer"></slot>
        </div>
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
    badge?: {
      text: string
      variant?: 'success' | 'error' | 'warning'
    }
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
