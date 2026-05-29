<template>
  <div class="form-layout">
    <h1 class="form-layout__title">{{ title }}</h1>

    <div v-if="loading" class="form-layout__loading">
      <p>{{ loadingText }}</p>
    </div>

    <div v-else class="form-layout__content">
      <slot name="actions"></slot>

      <BaseCard v-if="showCard" width="700" class="form-layout__card">
        <div class="form-layout__card-content">
          <slot></slot>
        </div>
      </BaseCard>
      <slot name="default"></slot>

      <div v-if="$slots.footer" class="form-layout__footer">
        <hr class="form-layout__divider" />
        <slot name="footer"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import BaseCard from './BaseCard.vue'

withDefaults(
  defineProps<{
    title: string
    loading?: boolean
    loadingText?: string
    showCard?: boolean
  }>(),
  {
    loading: false,
    loadingText: 'Загрузка...',
    showCard: true,
  },
)
</script>

<style scoped>
.form-layout {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-20);
  background-color: var(--color-background);
  min-height: 85vh;
}

.form-layout__title {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-32);
  letter-spacing: var(--letter-spacing-tight);
}

.form-layout__loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
}

.form-layout__content {
  width: 100%;
  max-width: 700px;
  display: flex;
  flex-direction: column;
}

.form-layout__card {
  box-shadow: var(--shadow-xl) !important;
  border: 1px solid var(--color-border) !important;
}

.form-layout__card-content {
  display: flex;
  flex-direction: column;
}

.form-layout__footer {
  margin-top: var(--spacing-32);
  text-align: center;
}

.form-layout__divider {
  border: 0;
  height: 1px;
  background: var(--color-border);
  margin: var(--spacing-20) 0;
}

@media (max-width: 640px) {
  .form-layout {
    padding: var(--spacing-16);
  }
}
</style>
