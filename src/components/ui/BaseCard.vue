<template>
  <div class="base-card" :style="{ maxWidth: width + 'px' }">
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
  background: #ffffff;
  padding: 32px;
  border-radius: 24px;
  width: 100%;
  /* Многослойная тень для эффекта глубины */
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.03),
    0 2px 4px rgba(0, 0, 0, 0.02),
    0 12px 24px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(226, 232, 240, 0.8);
}

/* Добавим легкий градиент на фон карточки */
.base-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100px;
  background: linear-gradient(180deg, rgba(79, 70, 229, 0.03) 0%, rgba(255, 255, 255, 0) 100%);
  pointer-events: none;
  border-radius: 24px 24px 0 0;
}
</style>
