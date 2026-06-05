<template>
  <div class="table-container" :style="{ maxHeight: items.length > 0 ? maxHeight : 'auto' }">
    <div v-if="loading" class="table-state text-muted">
      <div class="table-spinner"></div>
      <p class="text-sm font-medium">{{ loadingText }}</p>
    </div>

    <div v-else-if="items.length === 0" class="table-state text-muted">
      <span class="empty-icon">{{ emptyIcon }}</span>
      <p class="text-sm font-medium">{{ emptyText }}</p>
    </div>

    <div v-else class="table-responsive">
      <table class="minimal-table">
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
                <span class="truncate">{{ col.label }}</span>
                <span v-if="col.sortable" class="sort-arrows">
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

              <div v-if="col.filterable" class="filter-box" @click.stop>
                <input
                  type="text"
                  placeholder="Поиск..."
                  v-model="filters[String(col.key)]"
                  class="input table-input"
                />
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(item, index) in filteredAndSortedItems"
            :key="typeof item.id === 'string' || typeof item.id === 'number' ? item.id : index"
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

  <Teleport to="body">
    <div v-if="showExcelModal" class="modal-overlay excel-overlay" @click="showExcelModal = false">
      <div class="excel-modal-content" @click.stop>
        <div class="excel-modal-header">
          <h3>Выгрузка данных в Excel</h3>
        </div>
        <p class="excel-modal-text">
          В таблице сейчас применены фильтры поиска. Выгрузить данные с учетом фильтрации или
          сохранить весь список целиком?
        </p>
        <div class="excel-modal-actions">
          <button @click="confirmExport(true)" class="btn btn-primary w-full">
            Применить фильтры ({{ filteredAndSortedItems.length }} стр.)
          </button>
          <button @click="confirmExport(false)" class="btn btn-secondary w-full">
            Выгрузить всё без фильтров ({{ items.length }} стр.)
          </button>
          <button @click="showExcelModal = false" class="excel-btn-cancel">Отмена</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts" generic="T extends Record<string, unknown>">
import { ref, computed } from 'vue'
import * as XLSX from 'xlsx'

export interface TableColumn<T> {
  key: keyof T
  label: string
  sortable?: boolean
  filterable?: boolean
  width?: string
  minWidth?: string
  exportFormatter?: (value: unknown, item: T) => string | number
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
const showExcelModal = ref(false)
let currentExportFileName = 'export_data'

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
      result = result.filter((item) =>
        String(item[key as keyof T] ?? '')
          .toLowerCase()
          .includes(searchTerm),
      )
    }
  })
  const { key, order } = currentSort.value
  if (key) {
    result.sort((a, b) => {
      const valA = String(a[key as keyof T] ?? '').toLowerCase()
      const valB = String(b[key as keyof T] ?? '').toLowerCase()
      return order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
    })
  }
  return result
})

const hasActiveFilters = computed(() => {
  return Object.values(filters.value).some((val) => val && val.trim() !== '')
})

const triggerExcelExport = (fileName: string) => {
  currentExportFileName = fileName
  if (hasActiveFilters.value) {
    showExcelModal.value = true
  } else {
    generateExcel(false)
  }
}

const confirmExport = (useFilters: boolean) => {
  showExcelModal.value = false
  generateExcel(useFilters)
}

const generateExcel = (useFilters: boolean) => {
  const dataToExport = useFilters ? filteredAndSortedItems.value : props.items
  if (!dataToExport.length) return alert('Нет данных для выгрузки')

  const excelRows = dataToExport.map((item: T) => {
    const row: Record<string, string | number | boolean> = {}
    props.columns.forEach((col) => {
      const rawValue = item[col.key]
      if (col.exportFormatter) {
        row[col.label] = col.exportFormatter(rawValue, item)
      } else if (typeof rawValue === 'boolean') {
        row[col.label] = rawValue ? 'Да' : 'Нет'
      } else if (typeof rawValue === 'string' || typeof rawValue === 'number') {
        row[col.label] = rawValue
      } else {
        row[col.label] = (rawValue as string) ?? '—'
      }
    })
    return row
  })

  const worksheet = XLSX.utils.json_to_sheet(excelRows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Лист 1')
  worksheet['!cols'] = props.columns.map((col) => ({ wch: Math.max(col.label.length + 4, 14) }))

  const dateStr = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(workbook, `${currentExportFileName}_${dateStr}.xlsx`)
}

defineExpose({ hasActiveFilters, filteredAndSortedItems, triggerExcelExport })
</script>

<style scoped>
.table-container {
  background: var(--color-surface);
  border-radius: var(--radius-12);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.table-responsive {
  width: 100%;
  overflow: auto;
  scrollbar-width: thin;
}
.minimal-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 13px;
}
.minimal-table th {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--color-background-secondary);
  padding: var(--spacing-8) var(--spacing-16);
  color: var(--color-text-secondary);
  font-weight: 600;
  border-bottom: 1px solid var(--color-border-dark);
  text-align: left;
}
.minimal-table td {
  padding: var(--spacing-8) var(--spacing-16);
  color: var(--color-text-primary);
  border-bottom: 1px solid var(--color-border-dark);
  vertical-align: middle;
}
.minimal-table tr:last-child td {
  border-bottom: none;
}
.minimal-table tbody tr:hover td {
  background: var(--color-background-secondary);
}

.th-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-8);
}
.sortable {
  cursor: pointer;
  user-select: none;
}
.sort-arrows {
  display: inline-flex;
  flex-direction: column;
  font-size: 9px;
  color: var(--color-text-tertiary);
  line-height: 1;
}
.sort-arrows .active {
  color: var(--color-primary);
}
.filter-box {
  margin-top: var(--spacing-4);
}
.table-input {
  padding: var(--spacing-4) var(--spacing-8);
  font-size: 12px;
  border-radius: var(--radius-6);
}

.table-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-40) var(--spacing-20);
  gap: var(--spacing-12);
}
.empty-icon {
  font-size: 32px;
}
.table-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--color-border-dark);
  border-top-color: var(--color-primary);
  border-radius: var(--radius-full);
  animation: table-spin 0.8s linear infinite;
}
@keyframes table-spin {
  to {
    transform: rotate(360deg);
  }
}

/* Навесили абсолютный z-index, чтобы модалка встала поверх шторок и оверлеев */
.excel-overlay {
  z-index: 100000 !important;
}

.excel-modal-content {
  background: var(--color-surface);
  padding: var(--spacing-24);
  border-radius: var(--radius-12);
  box-shadow: var(--shadow-md);
  max-width: 400px;
  width: 100%;
  border: 1px solid var(--color-border);
}
.excel-modal-text {
  color: var(--color-text-secondary);
  font-size: 13px;
  margin: var(--spacing-12) 0 var(--spacing-20);
  line-height: 1.5;
}
.excel-modal-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-8);
}
.excel-btn-cancel {
  background: transparent;
  border: none;
  padding: 10px;
  color: var(--color-text-secondary);
  font-size: 13px;
  cursor: pointer;
  font-weight: 500;
}
.excel-btn-cancel:hover {
  color: var(--color-text-primary);
}
/* Стили для заднего фона модального окна (Overlay) */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5); /* Полупрозрачный черный фон */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999; /* Чтобы модалка была поверх WMS интерфейса и ТСД таблиц */
}

/* Корректировка для контента, чтобы он не сливался */
.excel-modal-content {
  background: var(--color-surface);
  padding: var(--spacing-24);
  border-radius: var(--radius-12);
  box-shadow: var(--shadow-md);
  max-width: 400px;
  width: 100%;
  border: 1px solid var(--color-border);
  z-index: 10000;
}
:global(.modal-overlay) {
  position: fixed;
  inset: 0; /* Заменяет top:0; left:0; width:100vw; height:100vh; */
  background-color: rgba(15, 23, 42, 0.4); /* Стильный темно-синий с прозрачностью */
  backdrop-filter: blur(8px); /* Если переменная --glass-blur не подтянется, жесткий блюр спасет */
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9998;
}

:global(.excel-modal-content) {
  background: var(--color-surface);
  padding: var(--spacing-24);
  border-radius: var(--radius-12);
  box-shadow: var(--shadow-md);
  max-width: 400px;
  width: 100%;
  border: 1px solid var(--color-border);
}
</style>
