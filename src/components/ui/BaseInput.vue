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
// Добавляем поддержку null | undefined в modelValue и пропс disabled
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
  width: 100%; /* Гарантирует правильное растягивание в сетке */
}

.base-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 6px;
  margin-left: 4px;
}

.input-wrapper {
  position: relative;
  transition: all 0.2s;
}

.base-input {
  width: 100%;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #0f172a;
  font-size: 15px;
  font-family: inherit;
  box-sizing: border-box;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.base-input::placeholder {
  color: #94a3b8;
}

.base-input:hover:not(:disabled) {
  border-color: #cbd5e1;
  background: #f1f5f9;
}

.base-input:focus:not(:disabled) {
  outline: none;
  background: #ffffff;
  border-color: #4f46e5;
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
}

/* Стили для заблокированного инпута (например, для токенов) */
.base-input:disabled {
  background: #f1f5f9;
  color: #94a3b8;
  border-color: #e2e8f0;
  cursor: not-allowed;
}
</style>
