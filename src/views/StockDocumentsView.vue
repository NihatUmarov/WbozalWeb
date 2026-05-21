<template>
  <MainLayout>
    <div class="documents-page-wrapper">
      <div class="documents-container">
        <div class="header-section">
          <h1 class="top-title">Накладные</h1>

          <label class="archive-toggle">
            <input type="checkbox" v-model="filterArchive" @change="fetchDocuments" />
            <span class="toggle-slider"></span>
            <span class="toggle-label">Архивные записи</span>
          </label>
        </div>

        <div class="tabs-container">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            :class="['tab-button', { active: currentModel === tab.value }]"
            @click="changeTab(tab.value)"
          >
            <span class="tab-icon">{{ tab.icon }}</span>
            <span class="tab-text">{{ tab.label }}</span>
          </button>
        </div>

        <BaseTable :items="documents" :columns="columns" :loading="loading">
          <template #cell(id)="{ value }">
            <span class="bold-text">#{{ value }}</span>
          </template>

          <template #cell(date)="{ value }">
            {{ formatDate(String(value)) }}
          </template>

          <template #cell(status)="{ value }">
            <span :class="['status-badge', getStatusClass(String(value))]">
              {{ value || 'Нет статуса' }}
            </span>
          </template>

          <template #cell(quantityFact)="{ value }">
            <span v-if="currentModel === 'RET'">—</span>
            <span v-else :class="['quant-cell', Number(value) > 0 ? 'has-stock' : 'empty-stock']">
              {{ Number(value) > 0 ? `${value} шт.` : '0' }}
            </span>
          </template>

          <template #cell(quantityDefect)="{ value }">
            <span :class="['defect-cell', Number(value) > 0 ? 'has-defect' : 'no-defect']">
              {{ Number(value) > 0 ? `${value} шт.` : '0' }}
            </span>
          </template>
        </BaseTable>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import MainLayout from '@/components/ui/MainLayout.vue'
import BaseTable, { type TableColumn } from '@/components/ui/BaseTable.vue'
import { stockService } from '@/api/stockService'
import type { StockDocument } from '@/api/types'

type DocModel = 'FBO' | 'ORD' | 'DEF' | 'RET'

const currentModel = ref<DocModel>('FBO')
const filterArchive = ref<boolean>(false)
const documents = ref<StockDocument[]>([])
const loading = ref<boolean>(false)

const tabs = [
  { label: 'Приходы', value: 'FBO' as const, icon: '📥' },
  { label: 'Отгрузки', value: 'ORD' as const, icon: '📤' },
  { label: 'Брак', value: 'DEF' as const, icon: '⚠️' },
  { label: 'Возвраты', value: 'RET' as const, icon: '🔄' },
]

// Колонки таблицы реактивные, так как заголовки меняются от табов
const columns = computed<TableColumn<StockDocument>[]>(() => [
  { key: 'id', label: '№ документа', sortable: true, filterable: true },
  { key: 'date', label: 'Дата создания', sortable: true },
  { key: 'status', label: 'Статус', sortable: true, filterable: true },
  {
    key: 'quantity',
    label: currentModel.value === 'FBO' ? 'Ожидаемое кол-во' : 'Кол-во',
    sortable: true,
  },
  { key: 'quantityFact', label: 'Факт. принято', sortable: true },
  { key: 'quantityDefect', label: 'Брак', sortable: true },
])

const fetchDocuments = async () => {
  loading.value = true
  try {
    documents.value = await stockService.getDocuments({
      model: currentModel.value,
      archive: filterArchive.value,
    })
  } catch (error) {
    console.error('Ошибка при загрузке документов:', error)
  } finally {
    loading.value = false
  }
}

const changeTab = (modelValue: DocModel) => {
  currentModel.value = modelValue
  fetchDocuments()
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getStatusClass = (status: string) => {
  const s = String(status || '').toLowerCase()
  if (s.includes('архив')) return 'status-archive'
  if (s.includes('работе') || s.includes('готов')) return 'status-progress'
  if (s.includes('новы') || s.includes('создан')) return 'status-new'
  return 'status-default'
}

onMounted(() => {
  fetchDocuments()
})
</script>

<style scoped>
.documents-page-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background-color: #f8fafc;
  padding-bottom: 140px;
  width: 100%;
  box-sizing: border-box;
}
.documents-container {
  width: 90%; /* Сделали 90% как на странице карточек */
  margin: 0 auto;
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
.archive-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}
.archive-toggle input {
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
input:checked + .toggle-slider {
  background-color: #34c759;
}
input:checked + .toggle-slider::before {
  transform: translateX(20px);
}
.toggle-label {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}
.tabs-container {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  background: #f1f5f9;
  padding: 4px;
  border-radius: 10px;
  width: fit-content;
  border: 1px solid #e2e8f0;
}
.tab-button {
  display: flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: transparent;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.tab-button:hover {
  color: #1e293b;
}
.tab-button.active {
  background: white;
  color: #1e293b;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

/* Специфичные стили ячеек для накладных */
.bold-text {
  font-weight: 600;
  color: #4f46e5 !important;
}

/* Кастомные стили счетчиков (как на странице карточек) */
.quant-cell {
  font-weight: 600;
}
.has-stock {
  color: #10b981; /* Зеленый, если количество принято */
}
.empty-stock {
  color: #94a3b8; /* Спокойный серый ноль */
}

.defect-cell {
  font-weight: 600;
}
.has-defect {
  color: #ef4444 !important; /* Яркий красный текст */
  background: #fef2f2; /* Бэйджик-подложка */
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
}
.no-defect {
  color: #cbd5e1; /* Неброский ноль брака */
}

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}
.status-progress {
  background: #f0fdf4;
  color: #16a34a;
}
.status-archive {
  background: #f1f5f9;
  color: #64748b;
}
.status-new {
  background: #eff6ff;
  color: #2563eb;
}
.status-default {
  background: #f8fafc;
  color: #334155;
}
</style>
