<template>
  <div class="social-links">
    <a
      v-for="link in links"
      :key="link.title"
      :href="link.url"
      class="social-icon"
      :title="link.title"
      target="_blank"
    >
      <img :src="link.icon" :alt="link.title" class="svg-icon" />
    </a>
  </div>
</template>

<script setup lang="ts">
import telegramIcon from '@/components/icons/telegram.svg'
import whatsappIcon from '@/components/icons/whatsapp.svg'
import supportIcon from '@/components/icons/max.svg'

const links = [
  { title: 'Telegram', url: 'https://t.me/your_link', icon: telegramIcon },
  { title: 'WhatsApp', url: 'https://wa.me/your_number', icon: whatsappIcon },
  { title: 'Support', url: '#', icon: supportIcon },
]
</script>

<style scoped>
.social-links {
  display: flex;
  gap: var(--spacing-12);
}

.social-icon {
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: var(--border-radius-12);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-medium);
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.svg-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
  transition: transform var(--transition-medium);
}

/* Эффект при наведении */
.social-icon:hover {
  background: var(--color-primary);
  border-color: var(--color-primary);
  transform: translateY(-3px);
  box-shadow: 0 8px 15px var(--color-shadow);
}

.social-icon:hover .svg-icon {
  transform: scale(1.1);
}
</style>
