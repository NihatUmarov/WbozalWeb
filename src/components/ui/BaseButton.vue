<template>
  <button class="base-btn" :disabled="loading || disabled" :class="{ 'is-loading': loading }">
    <div v-if="loading" class="spinner"></div>
    <span v-else class="btn-content">
      <slot></slot>
    </span>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  loading?: boolean
  disabled?: boolean
}>()
</script>

<style scoped>
.base-btn {
  position: relative;
  width: 100%;
  padding: 12px 24px;
  background: linear-gradient(180deg, #4f46e5 0%, #4338ca 100%);
  color: white;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.01em; /* Современный плотный шрифт */
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.05),
    0 4px 12px rgba(79, 70, 229, 0.2);
}

.base-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.05),
    0 8px 20px rgba(79, 70, 229, 0.3);
  filter: brightness(1.1);
}

.base-btn:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
}

.base-btn:disabled {
  opacity: 0.5;
  filter: grayscale(0.5);
  cursor: not-allowed;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 0.6s cubic-bezier(0.5, 0.1, 0.4, 0.9) infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
