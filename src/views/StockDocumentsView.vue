<template>
  <MainLayout>
    <div class="documents-page-wrapper">
      <div class="documents-container">
        <!-- Заголовок и фильтр Архива -->
        <div class="header-section">
          <h1 class="top-title">Накладные</h1>

          <label class="archive-toggle">
            <input type="checkbox" v-model="filterArchive" @change="fetchDocuments" />
            <span class="toggle-slider"></span>
            <span class="toggle-label">Архивные записи</span>
          </label>
        </div>

        <!-- Вкладки типов накладных -->
        <div class="tabs-container">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            :class="['tab-button', { active: currentModel === tab.value }]"
            @click="changeTab(tab.value)"
          >
            <span class="tab-icon">{{ tab.icon }}</span>
            {{ tab.label }}
          </button>
        </div>

        <!-- Контентная часть (Таблица / Загрузка) -->
        <div class="table-card">
          <div v-if="loading" class="state-container">
            <div class="spinner"></div>
            <p>Загрузка документов...</p>
          </div>

          <div v-else-if="documents.length === 0" class="state-container">
            <span class="empty-icon">📂</span>
            <p>Документы не найдены</p>
          </div>

          <div v-else class="table-responsive">
            <table class="modern-table">
              <thead>
                <tr>
                  <th>№ документа</th>
                  <th>Дата создания</th>
                  <th>Статус</th>
                  <th>{{ columnsLabel.qty }}</th>
                  <th>{{ columnsLabel.qtyFact }}</th>
                  <th>Брак</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="doc in documents" :key="doc.id">
                  <td class="bold-text">#{{ doc.id }}</td>
                  <td>{{ formatDate(doc.date) }}</td>
                  <td>
                    <span :class="['status-badge', getStatusClass(doc.status)]">
                      {{ doc.status || 'Нет статуса' }}
                    </span>
                  </td>
                  <td>{{ doc.quantity }}</td>
                  <td>{{ currentModel === 'RET' ? '—' : doc.quantityFact }}</td>
                  <td :class="{ 'has-defect': doc.quantityDefect > 0 }">
                    {{ doc.quantityDefect }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import MainLayout from '@/components/ui/MainLayout.vue'

// Импорты из твоей общей папки api по алиасам
import { stockService } from '@/api/stockService'
import type { StockDocument } from '@/api/types'

// Определяем тип для моделей, чтобы не дублировать код
type DocModel = 'FBO' | 'ORD' | 'DEF' | 'RET'

// Состояния фильтрации
const currentModel = ref<DocModel>('FBO')
const filterArchive = ref<boolean>(false)
const documents = ref<StockDocument[]>([])
const loading = ref<boolean>(false)

// Доступные вкладки
const tabs = [
  { label: 'Приходы', value: 'FBO' as const, icon: '📥' },
  { label: 'Отгрузки', value: 'ORD' as const, icon: '📤' },
  { label: 'Брак', value: 'DEF' as const, icon: '⚠️' },
  { label: 'Возвраты', value: 'RET' as const, icon: '🔄' },
]

// Динамические названия колонок таблицы
const columnsLabel = computed(() => {
  if (currentModel.value === 'FBO') {
    return { qty: 'Ожидаемое кол-во', qtyFact: 'Факт. принято' }
  }
  if (currentModel.value === 'RET') {
    return { qty: 'Количество', qtyFact: '—' }
  }
  return { qty: 'Кол-во', qtyFact: 'Факт. принято' }
})

// Запрос данных
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

// Избавились от any, теперь тут строгая типизация
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
    second: '2-digit',
  })
}

const getStatusClass = (status: string) => {
  const s = status.toLowerCase()
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
  padding-bottom: 120px; /* Отступ, чтобы MacDock не перекрывал таблицу */
}

.documents-container {
  width: 100%;
  max-width: 1100px;
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

/* Стили премиального тумблера архива */
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

/* Вкладки типов документов */
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
}

.tab-button:hover {
  color: #1e293b;
}

.tab-button.active {
  background: white;
  color: #1e293b;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

/* Стилизация таблицы и карточки */
.table-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  width: 100%;
}

.table-responsive {
  overflow-x: auto;
}

.modern-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 14px;
}

.modern-table th {
  background: #f8fafc;
  padding: 14px 18px;
  color: #64748b;
  font-weight: 600;
  border-bottom: 1px solid #e2e8f0;
}

.modern-table td {
  padding: 14px 18px;
  color: #334155;
  border-bottom: 1px solid #f1f5f9;
}

.modern-table tr:last-child td {
  border-bottom: none;
}

.bold-text {
  font-weight: 600;
  color: #4f46e5 !important;
}

.has-defect {
  color: #ef4444 !important;
  font-weight: 600;
}

/* Статусы */
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

/* Состояния UI */
.state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #64748b;
}

.empty-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #e2e8f0;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
