<template>
  <div class="dock-container">
    <nav class="dock">
      <router-link
        v-for="item in menuItems"
        :key="item.label"
        :to="item.to"
        class="dock-item"
        active-class="active"
      >
        <div class="dock-button">
          <div class="icon-container">
            <component :is="item.icon" class="dock-icon" />
          </div>
          <span class="dock-label">{{ item.label }}</span>
        </div>
      </router-link>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Package, FileText, CreditCard, User } from 'lucide-vue-next'

const menuItems = ref([
  { label: 'Остатки', icon: Package, to: '/remains' },
  { label: 'Накладные', icon: FileText, to: '/documents' },
  { label: 'Карточки', icon: CreditCard, to: '/cards' },
  { label: 'Профиль', icon: User, to: '/profile' },
])
</script>

<style scoped>
.dock-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
}

.dock {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: var(--spacing-8);
  padding: var(--spacing-6);
  background: var(--color-background-secondary);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-radius: var(--border-radius-12);
  border: 1px solid var(--color-border);
}

.dock-item {
  display: flex;
  align-items: center;
  text-decoration: none;
  cursor: pointer;
}

.dock-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-8) var(--spacing-16);
  background: transparent;
  border-radius: var(--border-radius-8);
  white-space: nowrap;
  transition:
    background-color var(--transition-fast) ease,
    color var(--transition-fast) ease;
}

/* Текст на десктопе */
.dock-label {
  color: var(--color-text-secondary);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
}

.icon-container {
  display: none;
}

.dock-item:hover .dock-button {
  background: var(--color-border-light);
}
.dock-item:hover .dock-label {
  color: var(--color-text-primary);
}

.dock-item.active .dock-button {
  background: var(--color-primary-subtle);
}
.dock-item.active .dock-label {
  color: var(--color-primary);
}

@media (max-width: 1050px) {
  .dock {
    border-radius: var(--border-radius-20);
  }

  .dock-button {
    padding: 0;
    width: 40px;
    height: 40px;
    border-radius: var(--border-radius-full);
  }

  .dock-label {
    display: none; /* Прячем текст */
  }

  .icon-container {
    display: flex; /* Показываем иконку */
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  .dock-icon {
    width: 20px;
    height: 20px;
    stroke: var(--color-text-secondary);
    stroke-width: 2;
    transition: stroke var(--transition-fast) ease;
  }

  .dock-item:hover .dock-icon {
    stroke: var(--color-text-primary);
  }

  .dock-item.active .dock-icon {
    stroke: var(--color-primary);
  }
}
</style>
