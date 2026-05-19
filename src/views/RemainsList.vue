<template>
  <MainLayout>
    <div class="documents-page-wrapper">
      <div class="documents-container">
        <div class="header-section">
          <h1 class="top-title">Остатки товаров</h1>

          <!-- НАШ КРУТОЙ ТОГГЛ БРАКА -->
          <label class="defect-toggle">
            <input type="checkbox" v-model="filterDefect" @change="fetchRemains" />
            <span class="toggle-slider"></span>
            <span class="toggle-label">Показать только брак</span>
          </label>
        </div>

        <!-- НАША КРУТАЯ ТАБЛИЦА -->
        <BaseTable
          :items="remains"
          :columns="columns"
          :loading="loading"
          empty-text="Остатков не найдено"
          empty-icon="📦"
          :row-class="(item) => (item.isDefect ? 'row-defect' : '')"
        >
          <!-- Кастомизируем колонку артикула -->
          <template #cell(cArt)="{ value }">
            <span class="bold-text">{{ value || '—' }}</span>
          </template>

          <!-- Кастомизируем штрихкод -->
          <template #cell(barcode)="{ value }">
            <span class="barcode-text">{{ value || '—' }}</span>
          </template>

          <!-- Кастомизируем имя (обрезаем) -->
          <template #cell(cName)="{ value }">
            <div class="name-cell" :title="String(value || '')">{{ value || 'Без названия' }}</div>
          </template>

          <!-- Доступно -->
          <template #cell(irQuant)="{ value }">
            <span class="quant-cell">{{ value }}</span>
          </template>

          <!-- В резерве -->
          <template #cell(iBronTask)="{ value }">
            <span class="reserve-cell">{{ value ? value : '—' }}</span>
          </template>

          <!-- Статус -->
          <template #cell(isDefect)="{ value }">
            <span :class="['status-badge', value ? 'status-defect' : 'status-ok']">
              {{ value ? 'Брак' : 'Ок' }}
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
import { remainsService } from '@/api/remainsService'
import type { RemainItem } from '@/api/types'

const remains = ref<RemainItem[]>([])
const loading = ref<boolean>(false)

// Переменная для фильтра брака (по умолчанию false — не брак)
const filterDefect = ref<boolean>(false)

const columns: TableColumn<RemainItem>[] = [
  { key: 'cArt', label: 'Артикул', sortable: true, filterable: true },
  { key: 'barcode', label: 'Штрихкод', sortable: true, filterable: true },
  { key: 'cName', label: 'Название', sortable: true, filterable: true },
  { key: 'irQuant', label: 'Доступно (шт.)', sortable: true },
  { key: 'iBronTask', label: 'В резерве', sortable: true },
  { key: 'isDefect', label: 'Состояние', sortable: true },
]

const fetchRemains = async () => {
  loading.value = true
  try {
    // Передаем текущее состояние тоггла в сервис
    remains.value = await remainsService.getRemains(filterDefect.value)
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

onMounted(() => fetchRemains())
</script>

<style scoped>
.documents-page-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background-color: #f8fafc;
  padding-bottom: 140px;
}
.documents-container {
  width: 100%;
  max-width: 95%;
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

/* СТИЛИ ДЛЯ ТОГГЛА БРАКА (Классы переименованы под контекст) */
.defect-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}
.defect-toggle input {
  display: none;
}
.toggle-slider {
  position: relative;
  width: 44px;
  height: 24px;
  background-color: #e2e8f0;
  border-radius: 12px;
  transition: background-color 0.2s;
  flex-shrink: 0;
}
.toggle-slider::before {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  top: 2px;
  left: 2px;
  transition: transform 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
/* При включении тоггла красим его в красный, так как это Брак */
input:checked + .toggle-slider {
  background-color: #ef4444;
}
input:checked + .toggle-slider::before {
  transform: translateX(20px);
}
.toggle-label {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

/* СТИЛИ ТАБЛИЦЫ */
.bold-text {
  font-weight: 600;
  color: #4f46e5 !important;
}
.barcode-text {
  font-family: monospace;
  color: #64748b;
  letter-spacing: 0.5px;
}
.name-cell {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.quant-cell {
  font-weight: 600;
  color: #10b981;
}
.reserve-cell {
  color: #f59e0b;
}
:deep(.row-defect) td {
  background-color: #fef2f2;
}
.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}
.status-ok {
  background: #f0fdf4;
  color: #16a34a;
}
.status-defect {
  background: #fee2e2;
  color: #ef4444;
}
</style>
