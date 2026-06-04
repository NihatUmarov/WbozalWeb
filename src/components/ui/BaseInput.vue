<template>
  <div class="base-input-group">
    <label v-if="label" class="base-label">{{ label }}</label>
    <div class="input-wrapper">
      <input
        :value="modelValue ?? ''"
        :type="type || 'text'"
        :placeholder="placeholder"
        :disabled="disabled"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        class="base-input"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string | null | undefined
  label?: string
  type?: string
  placeholder?: string
  disabled?: boolean
}>()

defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()
</script>

<style scoped>
.base-input-group {
  width: 100%;
}

.base-label {
  display: block;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-6);
  margin-left: var(--spacing-4);
}

.input-wrapper {
  position: relative;
  transition: all var(--transition-fast);
}

.base-input {
  width: 100%;
  padding: var(--spacing-12) var(--spacing-16);
  border-radius: var(--border-radius-12);
  border: 1px solid var(--color-border-dark);
  background: var(--color-background-secondary);
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
  font-family: inherit;
  box-sizing: border-box;
  transition: all var(--transition-fast) cubic-bezier(0.4, 0, 0.2, 1);
}

.base-input::placeholder {
  color: var(--color-text-tertiary);
}

.base-input:hover:not(:disabled) {
  border-color: var(--color-text-secondary);
  background: var(--color-surface);
}

.base-input:focus:not(:disabled) {
  outline: none;
  background: var(--color-surface);
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px var(--color-primary-subtle);
}

.base-input:disabled {
  background: var(--color-background);
  color: var(--color-text-tertiary);
  border-color: var(--color-border);
  cursor: not-allowed;
}
</style>
