<template>
  <div
    class="table-container"
    :style="{ maxHeight: maxHeight }"
    ref="scrollContainer"
    style="overflow-y: auto; overflow-x: auto; position: relative"
  >
    <!-- Глобальный лоадер -->
    <div
      v-if="loading"
      class="table-state text-muted"
      style="padding: 40px 20px; text-align: center"
    >
      <div class="global-spin"></div>
      <p class="text-sm font-medium">{{ loadingText }}</p>
    </div>

    <!-- Таблица -->
    <div v-else class="table-responsive" style="position: relative; width: 100%">
      <table
        class="minimal-table resizable-table"
        :style="{
          tableLayout: 'fixed',
          width: '100%',
          minWidth: '100%',
        }"
      >
        <colgroup>
          <col
            v-for="col in dynamicColumns"
            :key="'col-' + String(col.key)"
            :style="{ width: columnWidths[String(col.key)] || col.width || 'auto' }"
          />
        </colgroup>

        <!-- Шапка -->
        <thead
          style="
            position: sticky;
            top: 0;
            z-index: 30;
            background-color: var(--bg-primary, #fff);
            box-shadow: 0 1px 0 var(--border-color, #e2e8f0);
          "
        >
          <tr>
            <th
              v-for="(col, index) in dynamicColumns"
              :key="String(col.key)"
              :draggable="true"
              @dragstart="onDragStart(index, $event)"
              @dragover.prevent="onDragOver(index)"
              @drop="onDrop(index)"
              @dragenter.prevent
              :class="{ sortable: col.sortable, 'drag-over': dragOverIndex === index }"
              :style="{
                minWidth: col.minWidth || '60px',
                position: 'relative',
                userSelect: 'none',
              }"
              @click="col.sortable && handleSort(col.key)"
            >
              <div
                class="th-content cursor-move"
                style="
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  width: 100%;
                "
              >
                <span class="truncate">{{ col.label }}</span>
                <span v-if="col.sortable" class="sort-arrows" style="margin-left: 4px; shrink: 0">
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

              <!-- Поиск -->
              <div v-if="col.filterable" class="filter-box" @click.stop>
                <input
                  type="text"
                  placeholder="Поиск..."
                  :value="filters[String(col.key)] || ''"
                  @input="onFilterInput(String(col.key), $event)"
                  class="input table-input"
                  style="width: 100%"
                />
              </div>

              <!-- Ресайзер колонок -->
              <div
                class="resize-handle"
                @mousedown.stop.prevent="startResize($event, index)"
                style="
                  position: absolute;
                  right: 0;
                  top: 0;
                  bottom: 0;
                  width: 6px;
                  cursor: col-resize;
                  z-index: 10;
                "
              ></div>
            </th>
          </tr>
        </thead>

        <tbody>
          <!-- СЛУЧАЙ 1: В базе пусто -->
          <tr v-if="items.length === 0">
            <td :colspan="dynamicColumns.length" class="text-center" style="padding: 40px 20px">
              <div
                style="
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                "
                class="text-muted"
              >
                <span class="empty-icon" style="font-size: 24px; margin-bottom: 8px">{{
                  emptyIcon
                }}</span>
                <p class="text-sm font-medium">{{ emptyText }}</p>
              </div>
            </td>
          </tr>

          <!-- СЛУЧАЙ 2: Поиск выдал 0 результатов -->
          <tr v-else-if="filteredAndSortedItems.length === 0">
            <td :colspan="dynamicColumns.length" class="text-center" style="padding: 40px 20px">
              <div
                style="
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                "
                class="text-muted"
              >
                <span class="empty-icon" style="font-size: 24px; margin-bottom: 8px">🔍</span>
                <p class="text-sm font-medium">Ничего не найдено по вашему запросу</p>
              </div>
            </td>
          </tr>

          <!-- СЛУЧАЙ 3: Вывод строк пачками -->
          <tr
            v-else
            v-for="(item, index) in limitedItems"
            :key="getItemId(item, index)"
            :class="[rowClass ? rowClass(item) : '', 'row-clickable']"
            :style="{ height: rowHeight + 'px' }"
            @click="handleRowClick(item, $event)"
          >
            <td
              v-for="col in dynamicColumns"
              :key="String(col.key)"
              class="truncate-cell overflow-hidden"
            >
              <slot
                :name="`cell(${String(col.key)})`"
                :item="item"
                :value="getCellValue(item, col.key)"
              >
                <span class="truncate block">{{ getCellValue(item, col.key) ?? '—' }}</span>
              </slot>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- НЕВИДИМЫЙ ЯКОРЬ ДЛЯ СЛЕЖКИ ЗА СКРОЛЛОМ -->
      <div
        ref="loadMoreTrigger"
        style="
          height: 10px;
          width: 100%;
          position: absolute;
          bottom: 0;
          left: 0;
          pointer-events: none;
        "
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends Record<string, unknown>">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import * as XLSX from 'xlsx'
import { useViewSettings } from '@/composables/useViewSettings'

export interface TableColumn<T> {
  key: keyof T | string | number | symbol
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
    rowHeight?: number
  }>(),
  {
    loading: false,
    loadingText: 'Загрузка данных...',
    emptyText: 'Данные не найдены',
    emptyIcon: '📂',
    maxHeight: 'calc(100vh - 290px)',
    rowHeight: 64,
  },
)

const emit = defineEmits<{ (e: 'rowClick', item: T): void }>()
const { showImage, showArt, showWbArt, showSize } = useViewSettings()

const getCellValue = (item: T, key: keyof T | string | number | symbol): unknown => {
  return (item as Record<string, unknown>)[key as string]
}

const columnOrder = ref<TableColumn<T>[]>([])
const columnWidths = ref<Record<string, string>>({})

watch(
  () => props.columns,
  (newCols) => {
    const currentKeys = columnOrder.value.map((c) => String(c.key)).join(',')
    const newKeys = newCols.map((c) => String(c.key)).join(',')
    if (currentKeys !== newKeys || columnOrder.value.length === 0) {
      columnOrder.value = [...newCols]
    }
  },
  { immediate: true, deep: true },
)

const dynamicColumns = computed(() => {
  return columnOrder.value.filter((col) => {
    const keyStr = String(col.key)
    if (keyStr === 'primaryImageURL' && !showImage.value) return false
    if (keyStr === 'cArt' && !showArt.value) return false
    if (keyStr === 'cArtWB' && !showWbArt.value) return false
    if (keyStr === 'size' && !showSize.value) return false
    return true
  })
})

const dragOverIndex = ref<number | null>(null)
let draggedIndex: number | null = null

const onDragStart = (index: number, event: DragEvent) => {
  draggedIndex = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

const onDragOver = (index: number) => {
  dragOverIndex.value = index
}

const onDrop = (index: number) => {
  if (draggedIndex !== null && draggedIndex !== index) {
    const targetArray = [...columnOrder.value]
    const [movedItem] = targetArray.splice(draggedIndex, 1)
    targetArray.splice(index, 0, movedItem)
    columnOrder.value = targetArray
  }
  dragOverIndex.value = null
  draggedIndex = null
}

const scrollContainer = ref<HTMLElement | null>(null)

const startResize = (event: MouseEvent, colIndex: number) => {
  const currentKey = String(dynamicColumns.value[colIndex].key)
  const nextCol = dynamicColumns.value[colIndex + 1]
  if (!nextCol) return

  const nextKey = String(nextCol.key)
  const thElements = scrollContainer.value?.querySelectorAll('th')
  if (!thElements) return

  const currentTh = thElements[colIndex]
  const nextTh = thElements[colIndex + 1]

  const startWidthCurrent = currentTh.getBoundingClientRect().width
  const startWidthNext = nextTh.getBoundingClientRect().width
  const startX = event.pageX

  const onMouseMove = (moveEvent: MouseEvent) => {
    requestAnimationFrame(() => {
      const deltaX = moveEvent.pageX - startX
      const newWidthCurrent = Math.max(startWidthCurrent + deltaX, 60)
      const newWidthNext = Math.max(startWidthNext - deltaX, 60)

      columnWidths.value[currentKey] = `${newWidthCurrent}px`
      columnWidths.value[nextKey] = `${newWidthNext}px`
    })
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

const filters = ref<Record<string, string>>({})
let filterTimeout: ReturnType<typeof setTimeout>

const onFilterInput = (key: string, event: Event) => {
  const target = event.target as HTMLInputElement
  clearTimeout(filterTimeout)
  filterTimeout = setTimeout(() => {
    filters.value = { ...filters.value, [key]: target.value }
    displayLimit.value = 50
  }, 150)
}

const currentSort = ref<{ key: string | null; order: 'asc' | 'desc' }>({ key: null, order: 'asc' })

const handleSort = (key: keyof T | string | number | symbol) => {
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
  const filterKeys = Object.keys(filters.value)

  if (filterKeys.length > 0) {
    result = result.filter((item) => {
      for (const key of filterKeys) {
        const searchTerm = filters.value[key]?.toLowerCase().trim()
        if (!searchTerm) continue

        if (key === 'barcodes' || key === 'barcode') {
          const bcArray = Array.isArray(item.barcodes) ? item.barcodes : []
          const bcString = String(item.barcode || '')
          const match =
            bcArray.some((val: unknown) =>
              String(val ?? '')
                .toLowerCase()
                .includes(searchTerm),
            ) || bcString.toLowerCase().includes(searchTerm)
          if (!match) return false
        } else {
          const value = getCellValue(item, key)
          if (Array.isArray(value)) {
            if (
              !value.some((val: unknown) =>
                String(val ?? '')
                  .toLowerCase()
                  .includes(searchTerm),
              )
            )
              return false
          } else {
            if (
              !String(value ?? '')
                .toLowerCase()
                .includes(searchTerm)
            )
              return false
          }
        }
      }
      return true
    })
  }

  const { key, order } = currentSort.value
  if (key) {
    result.sort((a, b) => {
      const rawA = getCellValue(a, key) ?? ''
      const rawB = getCellValue(b, key) ?? ''
      if (typeof rawA === 'number' && typeof rawB === 'number') {
        return order === 'asc' ? rawA - rawB : rawB - rawA
      }
      return order === 'asc'
        ? String(rawA).localeCompare(String(rawB), undefined, { numeric: true })
        : String(rawB).localeCompare(String(rawA), undefined, { numeric: true })
    })
  }

  return result
})

// --- УМНАЯ ФОНОВАЯ АВТОЗАГРУЗКА ---
const displayLimit = ref(50)
const loadMoreTrigger = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null
let autoLoadTimeout: ReturnType<typeof setTimeout> | null = null

const limitedItems = computed(() => {
  return filteredAndSortedItems.value.slice(0, displayLimit.value)
})

// Функция, которая мягко догружает данные порциями в фоновом режиме
const startBackgroundLoading = () => {
  if (autoLoadTimeout) clearTimeout(autoLoadTimeout)

  // Если еще есть что рендерить
  if (displayLimit.value < filteredAndSortedItems.value.length) {
    // Ждем 100мс, чтобы дать браузеру передохнуть и обработать клики/ввод юзера
    autoLoadTimeout = setTimeout(() => {
      displayLimit.value = Math.min(displayLimit.value + 100, filteredAndSortedItems.value.length)
      startBackgroundLoading() // Рекурсивно зовем следующую пачку
    }, 100)
  }
}

// Инициализируем наблюдатель (на случай, если пользователь сам быстро проскроллит вниз)
onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      const trigger = entries[0]
      if (trigger.isIntersecting) {
        if (displayLimit.value < filteredAndSortedItems.value.length) {
          displayLimit.value = Math.min(
            displayLimit.value + 150,
            filteredAndSortedItems.value.length,
          )
        }
      }
    },
    {
      rootMargin: '200px',
    },
  )

  if (loadMoreTrigger.value) {
    observer.observe(loadMoreTrigger.value)
  }

  // Запускаем фоновый догруз сразу после монтирования таблицы
  startBackgroundLoading()
})

onUnmounted(() => {
  if (observer) observer.disconnect()
  if (autoLoadTimeout) clearTimeout(autoLoadTimeout)
})

watch(loadMoreTrigger, (newVal) => {
  if (observer) {
    observer.disconnect()
    if (newVal) observer.observe(newVal)
  }
})

// Если исходные данные изменились (прилетел новый список с сервера)
watch(
  () => props.items,
  () => {
    displayLimit.value = 50
    // Снова запускаем фоновый догруз для нового списка
    startBackgroundLoading()
  },
)

const getItemId = (item: T, index: number) => {
  if ('id' in item) return item.id as string | number
  if ('idName' in item) return item.idName as string | number
  return index
}

const handleRowClick = (item: T, event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (
    ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName) ||
    target.closest('button') ||
    target.closest('.btn')
  ) {
    return
  }
  emit('rowClick', item)
}

const showExcelModal = ref(false)
const hasActiveFilters = computed(() =>
  Object.values(filters.value).some((val) => val && val.trim() !== ''),
)
let currentExportFileName = 'export_data'

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
      const rawValue = getCellValue(item, col.key)
      if (col.exportFormatter) row[col.label] = col.exportFormatter(rawValue, item)
      else if (typeof rawValue === 'boolean') row[col.label] = rawValue ? 'Да' : 'Нет'
      else row[col.label] = (rawValue as string | number) ?? '—'
    })
    return row
  })
  const worksheet = XLSX.utils.json_to_sheet(excelRows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Export')
  XLSX.writeFile(workbook, `${currentExportFileName}_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

defineExpose({ hasActiveFilters, filteredAndSortedItems, triggerExcelExport })
</script>
