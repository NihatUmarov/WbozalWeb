<template>
  <MainLayout>
    <div class="cards-page-wrapper">
      <div class="cards-container">
        <div class="header-section">
          <h1 class="top-title">Карточки товаров (МультиШК)</h1>
        </div>

        <BaseTable
          :items="cards"
          :columns="columns"
          :loading="loading"
          empty-text="Карточек товаров не найдено"
          empty-icon="📇"
        >
          <template #cell(cArt)="{ item }">
            <span class="bold-text">{{ item.cArt || '—' }}</span>
          </template>

          <template #cell(cName)="{ item }">
            <div class="name-cell" :title="String(item.cName || '')">
              {{ item.cName || 'Без названия' }}
            </div>
          </template>

          <template #cell(barcodes)="{ item }">
            <div v-if="item.barcodes && item.barcodes.length > 0" class="barcodes-wrapper">
              <span v-for="(barcode, idx) in item.barcodes" :key="idx" class="barcode-badge">
                {{ barcode }}
              </span>
            </div>
            <span v-else class="text-muted">—</span>
          </template>

          <template #cell(irQuant)="{ item }">
            <span :class="['quant-cell', item.irQuant > 0 ? 'has-stock' : 'empty-stock']">
              {{ item.irQuant }} шт.
            </span>
          </template>

          <template #cell(iBronTask)="{ item }">
            <span class="reserve-cell">{{
              item.iBronTask > 0 ? `${item.iBronTask} шт.` : '—'
            }}</span>
          </template>

          <template #cell(defectQuant)="{ item }">
            <span :class="['defect-cell', item.defectQuant > 0 ? 'has-defect' : 'no-defect']">
              {{ item.defectQuant > 0 ? `${item.defectQuant} шт.` : '0' }}
            </span>
          </template>
        </BaseTable>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import MainLayout from '@/components/ui/MainLayout.vue'
import BaseTable, { type TableColumn } from '@/components/ui/BaseTable.vue'
import { cardsService } from '@/api/cardsService'
import type { CardItem } from '@/api/types'

const cards = ref<CardItem[]>([])
const loading = ref<boolean>(false)

// Конфигурация колонок (ключи строго совпадают с полями CardItem)
const columns: TableColumn<CardItem>[] = [
  { key: 'cArt', label: 'Артикул', sortable: true, filterable: true, width: '150px' },
  { key: 'cName', label: 'Название товара', sortable: true, filterable: true, minWidth: '300px' }, // <-- minWidth позволит ей тянуться на всю оставшуюся ширину
  { key: 'barcodes', label: 'Штрихкоды / Attribute1', filterable: true, width: '250px' },
  { key: 'irQuant', label: 'Доступно', sortable: true, width: '120px' },
  { key: 'iBronTask', label: 'В резерве', sortable: true, width: '120px' },
  { key: 'defectQuant', label: 'Брак', sortable: true, width: '110px' },
]

const fetchCards = async () => {
  loading.value = true
  try {
    cards.value = await cardsService.getCards()
  } catch (error) {
    console.error('Ошибка при загрузке карточек товаров:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchCards()
})
</script>

<style scoped>
.cards-page-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background-color: #f8fafc;
  padding-bottom: 140px;
  width: 100%; /* <-- ДОБАВИТЬ: заставляем обертку занять весь экран */
  box-sizing: border-box; /* <-- ДОБАВИТЬ: чтобы паддинги не ломали ширину */
}

/* Проверь, чтобы в родителе было вот так: */
.cards-container {
  width: 90%;
  margin: 0 auto; /* центрирует контейнер, если нужно */
}
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  width: 100%;
}
.top-title {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

/* Стили карточки */
.bold-text {
  font-weight: 600;
  color: #4f46e5 !important;
}
.name-cell {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Оформление бэйджиков для мультиШК */
.barcodes-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-width: 320px;
}
.barcode-badge {
  background-color: #f1f5f9;
  color: #475569;
  font-family: monospace;
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
  letter-spacing: 0.5px;
}

/* Стили колонок остатков */
.quant-cell {
  font-weight: 600;
}
.has-stock {
  color: #10b981; /* Зеленый, если есть на складе */
}
.empty-stock {
  color: #94a3b8; /* Серый ноль */
}

.reserve-cell {
  color: #f59e0b; /* Оранжевый резерв */
  font-weight: 500;
}

.defect-cell {
  font-weight: 600;
}
.has-defect {
  color: #ef4444; /* Красный, если на карточке реально висит брак */
  background: #fef2f2;
  padding: 2px 6px;
  border-radius: 4px;
}
.no-defect {
  color: #cbd5e1; /* Не бросающийся в глаза ноль брака */
}

.text-muted {
  color: #cbd5e1;
}
</style>
