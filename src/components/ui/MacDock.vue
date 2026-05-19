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
        <div class="icon-wrapper">
          <span class="icon-placeholder">{{ item.icon }}</span>
          <span class="tooltip">{{ item.label }}</span>
        </div>
      </router-link>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const menuItems = ref([
  { label: 'Остатки', icon: '📦', to: '/remains' },
  { label: 'Накладные', icon: '📑', to: '/documents' },
  { label: 'Карточки', icon: '💳', to: '/cards' },
  { label: 'Профиль', icon: '👤', to: '/profile' },
])
</script>

<style scoped>
.dock-container {
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: visible;
}

.dock {
  display: flex;
  align-items: flex-start; /* Выравниваем по верхнему краю, так как растем вниз */
  gap: 12px;
  padding: 6px 12px;
  background: rgba(241, 245, 249, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid #e2e8f0;
}

.dock-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  cursor: pointer;
}

.icon-wrapper {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  font-size: 22px;

  /* Плавное увеличение */
  transition:
    transform 0.25s cubic-bezier(0.25, 1, 0.5, 1),
    box-shadow 0.2s ease,
    background-color 0.3s ease,
    border-color 0.3s ease;
  transform-origin: top center; /* Увеличивается строго СВЕРХУ ВНИЗ */
  border: 1px solid transparent;
}

/* Эффект увеличения: иконка растет вниз и смещается ниже */
.dock-item:hover .icon-wrapper {
  transform: scale(1.2) translateY(4px); /* Положительный Y уводит иконку вниз */
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  z-index: 1020; /* Чтобы при ховере карточка перекрывала соседние подсказки, если они пересекутся */
}

/* Новый вид активного состояния: мягкая подсветка вместо точки */
.dock-item.active .icon-wrapper {
  background: #f0f3ff; /* Легкий индиго оттенок */
  border-color: #a5b4fc; /* Выделение границ */
  box-shadow: inset 0 2px 4px rgba(99, 102, 241, 0.1);
}

/* Подсказка теперь снизу под иконкой */
.tooltip {
  position: absolute;
  bottom: -38px; /* Смещаем под иконку */
  left: 50%;
  transform: translateX(-50%) scale(0.9);
  background: rgba(20, 20, 20, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: white;
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
  z-index: 1010;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* При ховере подсказка красиво выпадает еще ниже */
@media (hover: hover) {
  .dock-item:hover .tooltip {
    opacity: 1;
    transform: translateX(-50%) scale(1) translateY(6px); /* Движение вниз */
  }
}
</style>
