<template>
  <div class="main-layout">
    <!-- Твой любимый премиальный Header теперь тут в виде чистого компонента! -->
    <BaseHeader />

    <main class="main-content">
      <slot />
    </main>

    <TheToast ref="toastRef" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import BaseHeader from '@/components/ui/BaseHeader.vue'
import TheToast from '@/components/ui/TheToast.vue'

const toastRef = ref<InstanceType<typeof TheToast> | null>(null)
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
  background: var(--color-background);
  font-family: var(--font-family);
}

.main-content {
  padding: 110px var(--spacing-24) var(--spacing-40);
  width: 90%;
  max-width: 1800px;
  margin: 0 auto;
}

@media (max-width: 1050px) {
  .main-content {
    padding: 100px var(--spacing-16) var(--spacing-32);
    width: 100%;
  }
}
</style>
