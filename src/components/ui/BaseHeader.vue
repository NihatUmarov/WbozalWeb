<template>
  <div class="base-header">
    <div class="logo-section">
      <!-- Наш мощный логотип -->
      <h1 class="logo-primary">W<span class="accent-char">b</span>ozal</h1>
      <div class="logo-underline"></div>
    </div>

    <div class="text-section">
      <!-- Текст "Вход" появится здесь -->
      <h2 class="page-title">{{ title }}</h2>
      <p v-if="subtitle" class="page-subtitle">{{ subtitle }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// ОБЯЗАТЕЛЬНО: объявляем входящие данные
defineProps<{
  title: string
  subtitle?: string
}>()
</script>

<style scoped>
.base-header {
  text-align: center;
}

.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px; /* Немного увеличим отступ, чтобы не слиплось */
}

.logo-primary {
  font-size: 84px;
  font-weight: 950;
  color: #0f172a;
  letter-spacing: -4px;
  margin: 0;
  line-height: 0.9;
  animation: slideUp 0.6s ease-out;
}

.accent-char {
  color: #4f46e5;
  display: inline-block;
  transform: translateX(-2px);
}

.logo-underline {
  width: 60px;
  height: 4px;
  background: #4f46e5;
  margin-top: 15px;
  border-radius: 4px;
  opacity: 0.8;
}

.text-section {
  max-width: 440px;
  margin: 0 auto;
  animation: fadeIn 0.8s ease-out;
}

.page-title {
  font-size: 32px; /* Размер для текста "Вход" */
  font-weight: 900;
  color: #0f172a;
  margin-bottom: 8px;
  letter-spacing: -1px;
  text-transform: uppercase;
}

.page-subtitle {
  font-size: 15px;
  color: #64748b;
  line-height: 1.5;
}

/* Анимации */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@media (max-width: 600px) {
  .logo-primary {
    font-size: 60px;
  }
}
</style>
