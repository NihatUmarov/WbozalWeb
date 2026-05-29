<template>
  <label class="toggle-switch" :class="{ 'toggle-switch--defect': variant === 'defect' }">
    <input
      type="checkbox"
      :checked="modelValue"
      @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    />
    <span class="toggle-switch__track"></span>
    <span class="toggle-switch__label">{{ label }}</span>
  </label>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean
  label: string
  variant?: 'default' | 'defect'
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>

<style scoped>
.toggle-switch {
  display: flex;
  align-items: center;
  gap: var(--spacing-12);
  cursor: pointer;
  user-select: none;
}

.toggle-switch input {
  display: none;
}

.toggle-switch__track {
  position: relative;
  width: 40px;
  height: 22px;
  background-color: var(--color-border);
  border-radius: var(--border-radius-full);
  transition: all var(--transition-base);
  cursor: pointer;
}

.toggle-switch__track::before {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  top: 2px;
  left: 2px;
  transition: all var(--transition-base);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.toggle-switch:active .toggle-switch__track::before {
  transform: scale(0.95);
  transition: transform var(--transition-fast);
}

.toggle-switch input:checked + .toggle-switch__track {
  background-color: var(--color-primary);
}

.toggle-switch--defect input:checked + .toggle-switch__track {
  background-color: var(--color-error);
}

.toggle-switch input:checked + .toggle-switch__track::before {
  transform: translateX(18px);
}

.toggle-switch__label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
}
</style>
