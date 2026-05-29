<template>
  <div class="base-card" :style="{ maxWidth: typeof width === 'string' ? width : width + 'px' }">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
interface Props {
  width?: number | string
}
withDefaults(defineProps<Props>(), { width: 400 })
</script>

<style scoped>
.base-card {
  background: var(--color-surface);
  padding: var(--spacing-24);
  border-radius: var(--border-radius-16);
  width: 100%;
  /* Premium multi-layer shadow - Vercel/Linear style */
  box-shadow: var(--shadow-card);
  border: 1px solid var(--color-border);
  transition:
    box-shadow var(--transition-base),
    border-color var(--transition-base);
}

.base-card:hover {
  box-shadow: var(--shadow-card-hover);
  border-color: var(--color-border-light);
}

/* Subtle top gradient for depth */
.base-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: linear-gradient(180deg, rgba(99, 102, 241, 0.02) 0%, rgba(255, 255, 255, 0) 100%);
  pointer-events: none;
  border-radius: var(--border-radius-16) var(--border-radius-16) 0 0;
}
</style>
