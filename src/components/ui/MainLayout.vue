<template>
  <div class="main-layout">
    <BaseHeader />
    <main class="main-content">
      <slot />
    </main>
    <TheToast />
  </div>
</template>

<script setup lang="ts">
import BaseHeader from '@/components/ui/BaseHeader.vue'
import TheToast from '@/components/ui/TheToast.vue'
</script>
