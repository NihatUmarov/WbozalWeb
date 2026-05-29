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
  {
    variant: 'text',
    lines: 1,
  },
)

const skeletonClass = computed(() => ({
  [`skeleton--${props.variant}`]: true,
}))

const skeletonStyle = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
  height: typeof props.height === 'number' ? `${props.height}px` : props.height,
}))
</script>

<style scoped>
.skeleton {
  position: relative;
  overflow: hidden;
  background: var(--color-background-secondary);
  border-radius: var(--border-radius-4);
}

.skeleton__shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.4) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
}

/* Variants */
.skeleton--text {
  height: var(--font-size-md);
}

.skeleton--title {
  height: var(--font-size-2xl);
}

.skeleton--caption {
  height: var(--font-size-xs);
}

.skeleton--circular {
  border-radius: 50%;
}

.skeleton--rounded {
  border-radius: var(--border-radius-8);
}

.skeleton--rectangular {
  border-radius: var(--border-radius-4);
}

@keyframes skeleton-shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* Dark mode shimmer */
@media (prefers-color-scheme: dark) {
  .skeleton__shimmer {
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.08) 50%,
      transparent 100%
    );
  }
}
</style>
