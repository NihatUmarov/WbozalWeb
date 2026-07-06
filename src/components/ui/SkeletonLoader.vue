<template>
  <div class="skeleton" :class="skeletonClass" :style="skeletonStyle">
    <div class="skeleton__shimmer"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    variant?: 'text' | 'title' | 'caption' | 'circular' | 'rectangular' | 'rounded'
    width?: string | number
    height?: string | number
    lines?: number
  }>(),
  { variant: 'text', lines: 1 },
)

const skeletonClass = computed(() => ({ [`skeleton--${props.variant}`]: true }))
const skeletonStyle = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
  height: typeof props.height === 'number' ? `${props.height}px` : props.height,
}))
</script>
