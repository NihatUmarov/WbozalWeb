<template>
  <Teleport to="body">
    <Transition :name="isSheet ? 'sheet-fade' : 'modal-fade'">
      <div v-if="isOpen" class="dialog-backdrop" @click="close"></div>
    </Transition>

    <Transition :name="isSheet ? 'sheet-slide' : 'modal-zoom'">
      <div
        v-if="isOpen"
        :class="isSheet ? 'sheet-wrapper' : 'modal-wrapper-centered'"
        @click="isSheet ? null : close()"
      >
        <div
          class="dialog-content"
          :class="{ 'sheet-content': isSheet, 'modal-window-content': !isSheet }"
          :style="{ maxWidth: widthMap[maxWidth] || widthMap['md'] }"
          @click.stop
        >
          <div class="dialog-header flex items-center justify-between gap-12 py-10 px-16 border-b">
            <div class="flex items-center gap-12 flex-1">
              <span v-if="badge" :class="['badge text-xs', `badge--${badge.variant || 'success'}`]">
                {{ badge.text }}
              </span>
              <slot name="header"></slot>
            </div>
            <button class="ui-close-btn" @click="close">✕</button>
          </div>

          <div class="dialog-body p-16">
            <slot></slot>
          </div>

          <div v-if="$slots.footer" class="dialog-footer p-12 border-t flex justify-end gap-12">
            <slot name="footer"></slot>
          </div>
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
    variant?: 'modal' | 'sheet'
    maxWidth?: 'sm' | 'md' | 'lg' | '2xl' | '4xl' | '7xl' | 'full'
    badge?: { text: string; variant?: 'success' | 'error' | 'warning' }
  }>(),
  { variant: 'modal', maxWidth: 'md' },
)

const emit = defineEmits<{ 'update:isOpen': [value: boolean] }>()
const close = () => emit('update:isOpen', false)

const isSheet = computed(() => props.variant === 'sheet')

const widthMap: Record<string, string> = {
  sm: '400px',
  md: '520px',
  lg: '650px',
  '2xl': '850px',
  '4xl': '1000px',
  '7xl': '1400px',
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
