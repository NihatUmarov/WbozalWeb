<template>
  <div class="dock-container" :class="{ 'is-mobile-collapsed': !isExpanded }">
    <!-- Кнопка триггера для мобилки (показывается только когда не помещается) -->
    <button class="dock-toggle-btn" @click="isExpanded = !isExpanded">
      <span>{{ isExpanded ? '✕ Меню' : '☰ Меню' }}</span>
    </button>

    <nav class="dock" :class="{ 'is-vertical': isExpanded }">
      <div
        v-for="item in menuItems"
        :key="item.label"
        class="dock-item"
        @click="isExpanded = false"
      >
        <div class="icon-wrapper">
          <span class="icon-placeholder">{{ item.icon }}</span>
          <span class="tooltip">{{ item.label }}</span>
        </div>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const isExpanded = ref(false)

const menuItems = ref([
  { label: 'Остатки', icon: '📦' },
  { label: 'Накладные', icon: '📑' },
  { label: 'Карточки', icon: '💳' },
  { label: 'Профиль', icon: '👤' },
])
</script>

<style scoped>
.dock-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.dock-toggle-btn {
  display: none;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 8px 14px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  color: #334155;
}

.dock {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(15px) saturate(180%);
  -webkit-backdrop-filter: blur(15px) saturate(180%);
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.dock-item {
  position: relative;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: pointer;
}

.dock-item:hover {
  transform: scale(1.12);
}

.icon-wrapper {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  font-size: 18px;
}

.tooltip {
  position: absolute;
  bottom: -38px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.85);
  color: white;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition:
    opacity 0.2s,
    transform 0.2s;
  z-index: 10;
}

.dock-item:hover .tooltip {
  opacity: 1;
}

/* Стили для адаптива, если всё не помещается в строку */
@media (max-width: 900px) {
  .dock-toggle-btn {
    display: block;
  }

  .dock {
    display: none;
    position: absolute;
    top: 70px;
    left: 50%;
    transform: translateX(-50%);
    flex-direction: column;
    gap: 12px;
    padding: 12px;
    background: white;
    border: 1px solid #e2e8f0;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  }

  .dock.is-vertical {
    display: flex;
  }

  .tooltip {
    position: static;
    transform: none;
    opacity: 1;
    pointer-events: auto;
    background: transparent;
    color: #334155;
    padding: 0;
    font-size: 13px;
    font-weight: 500;
  }

  .dock-item {
    display: flex;
    align-items: center;
    width: 140px;
  }

  .dock-item :deep(.icon-wrapper) {
    box-shadow: none;
    background: transparent;
  }

  .dock-item:hover {
    transform: none;
    background: #f1f5f9;
    border-radius: 8px;
  }
}
</style>
