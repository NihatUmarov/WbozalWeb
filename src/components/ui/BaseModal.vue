<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="isOpen" class="modal-backdrop" @click="close"></div>
    </Transition>

    <Transition name="modal-zoom">
      <div v-if="isOpen" class="modal-wrapper-centered" @click="close">
        <div
          class="modal-window-content"
          :style="{ '--modal-max-width': widthMap[maxWidth] }"
          @click.stop
        >
          <div class="modal-custom-header">
            <div class="flex-grow-1"><slot name="header"></slot></div>
            <button class="ui-close-btn" @click="close">✕</button>
          </div>

          <div class="modal-custom-body">
            <slot></slot>
          </div>

          <div v-if="$slots.footer" class="modal-custom-footer">
            <slot name="footer"></slot>
          </div>
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
    maxWidth?: 'sm' | 'md' | 'lg' | '2xl' | '4xl' | '5xl' | '7xl' | 'full'
  }>(),
  { maxWidth: 'md' },
)

const emit = defineEmits<{ 'update:isOpen': [value: boolean] }>()
const close = () => emit('update:isOpen', false)

const widthMap = {
  sm: '400px',
  md: '520px',
  lg: '650px',
  '2xl': '850px',
  '4xl': '1000px',
  '5xl': '1140px',
  '7xl': '1400px',
  full: '95%',
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
