<template>
  <div class="table-container" :style="{ maxHeight: items.length > 0 ? maxHeight : 'auto' }">
    <div v-if="loading" class="table-state text-muted">
      <div class="global-spin"></div>
      <p class="text-sm font-medium">{{ loadingText }}</p>
    </div>

    <div v-else-if="items.length === 0" class="table-state text-muted">
      <span class="empty-icon">{{ emptyIcon }}</span>
      <p class="text-sm font-medium">{{ emptyText }}</p>
    </div>

    <div v-else class="table-responsive">
      <table class="minimal-table resizable-table">
        <thead>
          <tr>
            <th
              v-for="col in dynamicColumns"
              :key="String(col.key)"
              :style="{
                width: columnWidths[String(col.key)] || col.width || 'auto',
                minWidth: col.minWidth || '60px',
              }"
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

              <div
                class="resize-handle"
                @mousedown.stop.prevent="startResize($event, String(col.key))"
              ></div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(item, index) in filteredAndSortedItems"
            :key="getItemId(item, index)"
            :class="[rowClass ? rowClass(item) : '', { 'row-clickable': 'idName' in item }]"
            @click="handleRowClick(item, $event)"
          >
            <td v-for="col in dynamicColumns" :key="String(col.key)" class="truncate-cell">
              <slot :name="`cell(${String(col.key)})`" :item="item" :value="item[col.key]">
                <template v-if="col.key === 'primaryImageURL'">
                  <div class="table-avatar-container" @click.stop>
                    <img
                      v-if="item.primaryImageURL"
                      :src="String(item.primaryImageURL)"
                      class="table-product-avatar"
                      alt="Товар"
                    />
                    <div v-else class="table-product-avatar-placeholder">📦</div>
                  </div>
                </template>
                <template v-else-if="col.key === 'size'">
                  <span
                    v-if="item.size"
                    class="text-xs font-semibold text-primary bg-secondary border-dark px-6 py-4 rounded-6 uppercase block text-center truncate"
                    >{{ item.size }}</span
                  >
                  <span v-else class="text-muted text-xs font-medium block text-center">─</span>
                </template>
                <template v-else-if="col.key === 'cArt' || col.key === 'cArtWB'">
                  <span
                    class="font-mono text-xs font-semibold text-primary bg-secondary border-dark px-6 py-4 rounded-6 block text-center truncate"
                    >{{ item[col.key] ?? '—' }}</span
                  >
                </template>
                <template v-else>
                  <span class="truncate block">{{ item[col.key] ?? '—' }}</span>
                </template>
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
import * as XLSX from 'xlsx'
import { useViewSettings } from '@/composables/useViewSettings'
import { cardsService, type CardDetailItem } from '@/api/cardsService'

export interface TableColumn<T> {
  key: keyof T
  label: string
  sortable?: boolean
  filterable?: boolean
  width?: string
  minWidth?: string
  exportFormatter?: (value: T[keyof T], item: T) => string | number
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

const { showImage, showArt, showWbArt, showSize } = useViewSettings()

const isSheetOpen = ref(false)
const isDetailsLoading = ref(false)
const details = ref<CardDetailItem | null>(null)
const activePhoto = ref<string | null>(null)

// Логика ручного изменения ширины (Resize)
const columnWidths = ref<Record<string, string>>({})

const startResize = (event: MouseEvent, columnKey: string) => {
  const thElement = (event.target as HTMLElement).parentElement
  if (!thElement) return

  const startWidth = thElement.offsetWidth
  const startX = event.pageX

  const onMouseMove = (moveEvent: MouseEvent) => {
    const deltaX = moveEvent.pageX - startX
    const newWidth = Math.max(startWidth + deltaX, 50) // Минимальная ширина 50px
    columnWidths.value[columnKey] = `${newWidth}px`
  }

  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    document.body.style.cursor = ''
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
  document.body.style.cursor = 'col-resize'
}

const getItemId = (item: T, index: number) => {
  if ('id' in item && (typeof item.id === 'string' || typeof item.id === 'number')) return item.id
  if ('idName' in item && typeof item.idName === 'number') return item.idName
  return index
}

const handleRowClick = async (item: T, event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (
    target.tagName === 'BUTTON' ||
    target.tagName === 'INPUT' ||
    target.tagName === 'SELECT' ||
    target.tagName === 'TEXTAREA' ||
    target.closest('button') ||
    target.closest('.btn')
  )
    return
  if ('idName' in item && typeof item.idName === 'number') {
    details.value = null
    activePhoto.value = null
    isSheetOpen.value = true
    isDetailsLoading.value = true
    try {
      details.value = await cardsService.getCardById(item.idName)
    } finally {
      isDetailsLoading.value = false
    }
  }
}

const dynamicColumns = computed(() =>
  props.columns.filter((col) => {
    if (col.key === 'primaryImageURL' && !showImage.value) return false
    if (col.key === 'cArt' && !showArt.value) return false
    if (col.key === 'cArtWB' && !showWbArt.value) return false
    if (col.key === 'size' && !showSize.value) return false
    return true
  }),
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

  // 1. Логика фильтрации (оставляем без изменений)
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
      const rawA = a[key as keyof T]
      const rawB = b[key as keyof T]

      const valA = rawA !== null && rawA !== undefined ? rawA : ''
      const valB = rawB !== null && rawB !== undefined ? rawB : ''

      if (typeof valA === 'number' && typeof valB === 'number') {
        return order === 'asc' ? valA - valB : valB - valA
      }

      const strA = String(valA).toLowerCase()
      const strB = String(valB).toLowerCase()

      return order === 'asc'
        ? strA.localeCompare(strB, undefined, { numeric: true, sensitivity: 'base' })
        : strB.localeCompare(strA, undefined, { numeric: true, sensitivity: 'base' })
    })
  }

  return result
})

const hasActiveFilters = computed(() =>
  Object.values(filters.value).some((val) => val && val.trim() !== ''),
)

const triggerExcelExport = (fileName: string) => {
  currentExportFileName = fileName
  if (hasActiveFilters.value) showExcelModal.value = true
  else generateExcel(false)
}

const generateExcel = (useFilters: boolean) => {
  const dataToExport = useFilters ? filteredAndSortedItems.value : props.items
  if (!dataToExport.length) return
  const excelRows = dataToExport.map((item: T) => {
    const row: Record<string, string | number | boolean> = {}
    props.columns.forEach((col) => {
      const rawValue = item[col.key]
      if (col.exportFormatter) row[col.label] = col.exportFormatter(rawValue, item)
      else if (typeof rawValue === 'boolean') row[col.label] = rawValue ? 'Да' : 'Нет'
      else if (typeof rawValue === 'string' || typeof rawValue === 'number')
        row[col.label] = rawValue
      else row[col.label] = (rawValue as string) ?? '—'
    })
    return row
  })
  const worksheet = XLSX.utils.json_to_sheet(excelRows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Лист 1')
  worksheet['!cols'] = props.columns.map((col) => ({ wch: Math.max(col.label.length + 4, 14) }))
  XLSX.writeFile(workbook, `${currentExportFileName}_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

defineExpose({ hasActiveFilters, filteredAndSortedItems, triggerExcelExport })
</script>

<style scoped>
/* Новые и измененные стили для таблицы */
.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.resizable-table {
  table-layout: fixed; /* Позволяет колонкам четко слушаться заданных ширин */
  width: 100%;
  border-collapse: collapse;
}

.resizable-table th {
  position: relative; /* Важно для позиционирования ресайзера */
  user-select: none;
}

/* Ползунок ресайза */
.resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 6px;
  cursor: col-resize;
  z-index: 10;
  transition: background-color 0.2s;
}

.resize-handle:hover,
body.col-resize .resize-handle {
  background-color: rgba(var(--primary-rgb), 0.3); /* Подсветка при наведении */
}

/* Обеспечиваем красивый перенос или скрытие длинного текста в ячейках */
.truncate-cell {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 0; /* Технический хак для работы truncate внутри table-layout: fixed */
}
</style>
