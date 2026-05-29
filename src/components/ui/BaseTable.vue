<template>
  <div class="table-card">
    <div v-if="loading" class="state-container">
      <div class="spinner"></div>
      <p>{{ loadingText }}</p>
    </div>

    <div v-else-if="items.length === 0" class="state-container">
      <span class="empty-icon">{{ emptyIcon }}</span>
      <p>{{ emptyText }}</p>
    </div>

    <div v-else class="table-responsive" :style="{ maxHeight: maxHeight }">
      <table class="modern-table">
        <thead>
          <tr>
            <th
              v-for="col in columns"
              :key="String(col.key)"
              :style="{ width: col.width, minWidth: col.minWidth || '120px' }"
              :class="{ sortable: col.sortable }"
              @click="col.sortable && handleSort(col.key)"
            >
              <div class="th-content">
                <span class="th-label">{{ col.label }}</span>
                <span v-if="col.sortable" class="sort-icon">
                  <span
                    :class="{
                      active: currentSort.key === String(col.key) && currentSort.order === 'asc',
                    }"
                    >▲</span
                  >
                  <span
                    :class="{
                      active: currentSort.key === String(col.key) && currentSort.order === 'desc',
                    }"
                    >▼</span
                  >
                </span>
              </div>

              <div v-if="col.filterable" class="filter-wrapper" @click.stop>
                <input
                  type="text"
                  :placeholder="`Поиск...`"
                  v-model="filters[String(col.key)]"
                  class="table-filter-input"
                />
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(item, index) in filteredAndSortedItems"
            :key="item.id || index"
            :class="rowClass ? rowClass(item) : ''"
          >
            <td v-for="col in columns" :key="String(col.key)">
              <slot :name="`cell(${String(col.key)})`" :item="item" :value="item[col.key]">
                {{ item[col.key] ?? '—' }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
import { ref, computed } from 'vue'

export interface TableColumn<T> {
  key: keyof T
  label: string
  sortable?: boolean
  filterable?: boolean
  width?: string
  minWidth?: string // Добавили для контроля сжатия колонок
}

const props = withDefaults(
  defineProps<{
    items: T[]
    columns: TableColumn<T>[]
    loading?: boolean
    loadingText?: string
    emptyText?: string
    emptyIcon?: string
    maxHeight?: string // Новый проп для гибкого контроля высоты
    rowClass?: (item: T) => string
  }>(),
  {
    loading: false,
    loadingText: 'Загрузка данных...',
    emptyText: 'Данные не найдены',
    emptyIcon: '📂',
    maxHeight: 'calc(100vh - 290px)', // Идеальная высота: вся высота экрана минус шапка сайта
  },
)

const currentSort = ref<{ key: string | null; order: 'asc' | 'desc' }>({ key: null, order: 'asc' })
const filters = ref<Record<string, string>>({})

const handleSort = (key: keyof T) => {
  const stringKey = String(key)
  if (currentSort.value.key === stringKey) {
    currentSort.value.order = currentSort.value.order === 'asc' ? 'desc' : 'asc'
  } else {
    currentSort.value.key = stringKey
    currentSort.value.order = 'asc'
  }
}

const filteredAndSortedItems = computed(() => {
  let result = [...props.items]

  // 1. Фильтрация
  Object.keys(filters.value).forEach((key) => {
    const searchTerm = filters.value[key]?.toLowerCase().trim()
    if (searchTerm) {
      result = result.filter((item) => {
        const value = item[key as keyof T]
        return String(value ?? '')
          .toLowerCase()
          .includes(searchTerm)
      })
    }
  })

  // 2. Сортировка
  const { key, order } = currentSort.value
  if (key) {
    result.sort((a, b) => {
      let valA = a[key as keyof T]
      let valB = b[key as keyof T]

      if (typeof valA === 'string') valA = valA.toLowerCase()
      if (typeof valB === 'string') valB = valB.toLowerCase()

      if (valA < valB) return order === 'asc' ? -1 : 1
      if (valA > valB) return order === 'asc' ? 1 : -1
      return 0
    })
  }

  return result
})
</script>

<style scoped>
.table-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  width: 100%;
}

/* СКРОЛЛБАРЫ ТЕПЕРЬ ТУТ: Ограничиваем высоту контейнера */
.table-responsive {
  width: 100%;
  overflow-x: auto;
  overflow-y: auto; /* Включаем вертикальный скролл внутри таблицы */
  -webkit-overflow-scrolling: touch;
}

.modern-table {
  width: 100%; /* Таблица пытается занять ширину контейнера */
  min-width: 100%; /* ГЛАВНОЕ: Гарантирует, что она не будет меньше 100% ширины */
  border-collapse: separate;
  border-spacing: 0;
  text-align: left;
  font-size: 14px;
}

/* ДЕЛАЕМ ШАПКУ ЛИПКОЙ (STICKY) */
.modern-table th {
  position: sticky;
  top: 0;
  z-index: 10; /* Чтобы строки при скролле уходили ПОД шапку */
  background: #f8fafc;
  padding: 12px 16px;
  color: #64748b;
  font-weight: 600;
  box-shadow: inset 0 -1px 0 #e2e8f0; /* Имитация border-bottom, так как обычный border пропадает при sticky */
  white-space: nowrap;
}

.modern-table td {
  padding: 12px 16px;
  color: var(--color-text-primary);
  border-bottom: 1px solid var(--color-border-light);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.modern-table th {
  font-variant-numeric: tabular-nums;
}

.modern-table tr:last-child td {
  border-bottom: none;
}

.th-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.th-label {
  overflow: hidden;
  text-overflow: ellipsis;
}

.sortable {
  cursor: pointer;
  user-select: none;
}

.sortable:hover {
  background: var(--color-background-secondary);
}

.sort-icon {
  display: inline-flex;
  flex-direction: column;
  font-size: 9px;
  color: #cbd5e1;
  line-height: 1;
}

.sort-icon .active {
  color: var(--color-primary);
}

/* РЕСТАЙЛИНГ ИНПУТОВ-ФИЛЬТРОВ */
.filter-wrapper {
  margin-top: 8px;
}

.table-filter-input {
  width: 100%;
  box-sizing: border-box;
  padding: 6px 10px;
  font-size: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-weight: 400;
  color: #334155;
  background-color: #ffffff;
  transition: all 0.15s ease;
}

.table-filter-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.1);
  background-color: var(--color-background);
}

/* Стили состояний */
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
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: var(--spacing-12);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.table-responsive::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.table-responsive::-webkit-scrollbar-track {
  background: #f1f5f9;
}
.table-responsive::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
.table-responsive::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
