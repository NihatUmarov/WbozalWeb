<template>
  <div class="table-card" :style="{ maxHeight: items.length > 0 ? maxHeight : 'auto' }">
    <div v-if="loading" class="state-container">
      <div class="spinner"></div>
      <p>{{ loadingText }}</p>
    </div>

    <div v-else-if="items.length === 0" class="state-container">
      <span class="empty-icon">{{ emptyIcon }}</span>
      <p>{{ emptyText }}</p>
    </div>

    <div v-else class="table-responsive">
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
  minWidth?: string
}

const props = withDefaults(
  defineProps<{
    items: T[]
    columns: TableColumn<T>[]
    loading?: boolean
    loadingText?: string
    emptyText?: string
    emptyIcon?: string
    maxHeight?: string
    rowClass?: (item: T) => string
  }>(),
  {
    loading: false,
    loadingText: 'Загрузка данных...',
    emptyText: 'Данные не найдены',
    emptyIcon: '📂',
    maxHeight: 'calc(100vh - 290px)',
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
/* Внешняя карточка */
.table-card {
  background: var(--color-surface);
  border-radius: var(--border-radius-12);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Контейнер таблицы */
.table-responsive {
  width: 100%;
  flex: 1;
  overflow-x: auto;
  overflow-y: auto; /* Включаем вертикальный скролл */
  -webkit-overflow-scrolling: touch;

  /* Настройки скролла для Firefox */
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

/* ИСПРАВЛЕНО: Кастомный аккуратный ползунок для Chrome, Safari, Edge */
.table-responsive::-webkit-scrollbar {
  width: 6px; /* Тонкий скроллбар, чтобы не мозолил глаза */
  height: 6px;
}

.table-responsive::-webkit-scrollbar-track {
  background: transparent; /* Полностью прозрачный трек */
}

.table-responsive::-webkit-scrollbar-thumb {
  background-color: #cbd5e1; /* Приятный серый цвет бегунка */
  border-radius: 3px;
}

.table-responsive::-webkit-scrollbar-thumb:hover {
  background-color: #94a3b8; /* Чуть темнее при наведении */
}

.modern-table {
  width: 100%;
  min-width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  text-align: left;
  font-size: var(--font-size-base);
}

/* ШАПКА: ЖЕСТКО ФИКСИРУЕМ И ЗАЛИВАЕМ СПЛОШНЫМ ЦВЕТОМ */
.modern-table th {
  position: sticky;
  top: 0;
  z-index: 100 !important; /* Поверх всего контента */
  background-color: #f4f5f7 !important;
  padding: var(--spacing-8) var(--spacing-16);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-semibold);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.05),
    inset 0 -1px 0 var(--color-border-dark);
  white-space: nowrap;
}

/* ЯЧЕЙКИ: ТОЖЕ НЕПРОЗРАЧНЫЕ */
.modern-table td {
  padding: var(--spacing-6) var(--spacing-16);
  color: var(--color-text-primary);
  background-color: #ffffff !important;
  border-bottom: 1px solid var(--color-border-light);
  vertical-align: middle;
  font-variant-numeric: tabular-nums;
}

.modern-table tr:last-child td {
  border-bottom: none;
}

/* ХОВЕР: МЕНЯЕМ ЦВЕТ ФОНА, А НЕ ПРОЗРАЧНОСТЬ */
.modern-table tbody tr:hover td {
  background-color: #f9fafb !important;
}

.th-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-8);
}

.th-label {
  overflow: hidden;
  text-overflow: ellipsis;
}

.sortable {
  cursor: pointer;
  user-select: none;
}

.sort-icon {
  display: inline-flex;
  flex-direction: column;
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  line-height: 1;
}

.sort-icon .active {
  color: var(--color-primary);
}

.filter-wrapper {
  margin-top: var(--spacing-4);
}

.table-filter-input {
  width: 100%;
  box-sizing: border-box;
  padding: var(--spacing-4) var(--spacing-8);
  font-size: var(--font-size-sm);
  border: 1px solid var(--color-border-dark);
  border-radius: var(--border-radius-6);
  font-weight: var(--font-weight-normal);
  color: var(--color-text-primary);
  background-color: #ffffff !important;
  transition: all var(--transition-fast) ease;
}

.table-filter-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-subtle);
}

.state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-48) var(--spacing-20);
  color: var(--color-text-secondary);
  background-color: #ffffff;
}

.empty-icon {
  font-size: var(--font-size-4xl);
  margin-bottom: var(--spacing-12);
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: var(--border-radius-full);
  animation: spin 0.8s linear infinite;
  margin-bottom: var(--spacing-12);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
