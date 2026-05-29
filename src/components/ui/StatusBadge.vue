<template>
  <span class="status-badge" :class="badgeClass">
    <span class="status-badge__dot" :class="dotClass"></span>
    <span class="status-badge__text"><slot></slot></span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  variant: 'success' | 'error' | 'warning' | 'info' | 'neutral'
}>()

const badgeClass = computed(() => `status-badge--${props.variant}`)
const dotClass = computed(() => `status-badge__dot--${props.variant}`)
</script>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  letter-spacing: 0.01em;
  transition: all var(--transition-fast);
}

.status-badge__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-badge__text {
  font-variant-numeric: tabular-nums;
}

/* Success - Ultra pastel */
.status-badge--success {
  background: var(--color-success-subtle);
  color: var(--color-success-text);
  border: 1px solid rgba(34, 197, 94, 0.1);
}
.status-badge__dot--success {
  background: var(--color-success);
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.15);
}

/* Error - Ultra pastel */
.status-badge--error {
  background: var(--color-error-subtle);
  color: var(--color-error-text);
  border: 1px solid rgba(239, 68, 68, 0.1);
}
.status-badge__dot--error {
  background: var(--color-error);
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.15);
}

/* Warning - Ultra pastel */
.status-badge--warning {
  background: var(--color-warning-subtle);
  color: var(--color-warning-text);
  border: 1px solid rgba(245, 158, 11, 0.1);
}
.status-badge__dot--warning {
  background: var(--color-warning);
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.15);
}

/* Info - Ultra pastel */
.status-badge--info {
  background: var(--color-info-subtle);
  color: var(--color-info-text);
  border: 1px solid rgba(59, 130, 246, 0.1);
}
.status-badge__dot--info {
  background: var(--color-info);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}

/* Neutral - Ultra pastel */
.status-badge--neutral {
  background: rgba(113, 113, 122, 0.06);
  color: var(--color-text-secondary);
  border: 1px solid rgba(113, 113, 122, 0.08);
}
.status-badge__dot--neutral {
  background: #71717a;
  box-shadow: 0 0 0 2px rgba(113, 113, 122, 0.12);
}
</style>
