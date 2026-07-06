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
      <table class="minimal-table">
        <thead>
          <tr>
            <th
              v-for="col in dynamicColumns"
              :key="String(col.key)"
              :style="{ width: col.width, minWidth: col.minWidth || '80px' }"
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
            :class="[rowClass ? rowClass(item) : '', { 'row-clickable': 'idName' in item }]"
            @click="handleRowClick(item, $event)"
          >
            <td v-for="col in dynamicColumns" :key="String(col.key)">
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
                    class="text-xs font-semibold text-primary bg-secondary border-dark px-6 py-4 rounded-6 uppercase"
                  >
                    {{ item.size }}
                  </span>
                  <span v-else class="text-muted text-xs font-medium">─</span>
                </template>

                <template v-else-if="col.key === 'cArt' || col.key === 'cArtWB'">
                  <span
                    class="font-mono text-xs font-semibold text-primary bg-secondary border-dark px-6 py-4 rounded-6"
                  >
                    {{ item[col.key] ?? '—' }}
                  </span>
                </template>

                <template v-else>
                  {{ item[col.key] ?? '—' }}
                </template>
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <BaseModal v-model:isOpen="isSheetOpen" maxWidth="5xl">
    <template #header>
      <div v-if="isDetailsLoading" class="flex flex-col gap-4 w-[280px]">
        <SkeletonLoader variant="title" width="100%" />
        <SkeletonLoader variant="text" width="50%" />
      </div>
      <div v-else-if="details" class="detail-header-info">
        <h2 class="detail-title">{{ details.cName || 'Карточка товара' }}</h2>
        <span class="detail-art"
          >Артикул товара:
          <strong class="text-primary font-mono">{{ details.cArt || '—' }}</strong></span
        >
      </div>
    </template>

    <div class="card-detail-container">
      <div v-if="isDetailsLoading" class="detail-main-grid">
        <div class="gallery-side">
          <SkeletonLoader variant="rectangular" height="340px" width="100%" />
          <div class="flex gap-8 mt-12">
            <SkeletonLoader variant="rounded" height="64px" width="52px" v-for="i in 3" :key="i" />
          </div>
        </div>
        <div class="flex flex-col gap-16">
          <SkeletonLoader variant="rectangular" height="64px" />
          <SkeletonLoader variant="rectangular" height="120px" v-for="i in 2" :key="i" />
        </div>
      </div>

      <div v-else-if="details" class="detail-main-grid">
        <div class="gallery-side">
          <div class="main-preview-box">
            <img
              v-if="activePhoto || details.primaryImageURL"
              :src="activePhoto || details.primaryImageURL!"
              class="main-preview-img"
              alt="Preview"
            />
            <div v-else class="no-photo-placeholder">📦 Нет изображений</div>
          </div>
          <div v-if="allPhotos.length > 1" class="thumbnails-row">
            <div
              v-for="(img, idx) in allPhotos"
              :key="idx"
              :class="['thumb-box', { active: activePhoto === img || (!activePhoto && idx === 0) }]"
              @click="activePhoto = img"
            >
              <img :src="img" alt="thumb" />
            </div>
          </div>
        </div>

        <div class="info-side">
          <div class="stocks-summary-grid">
            <div class="badge badge--success product-stock-tile">
              <span class="text-xs opacity-85">Доступный остаток</span>
              <strong class="text-sm tabular-nums">{{ details.irQuant }} шт.</strong>
            </div>
            <div class="badge badge--info product-stock-tile">
              <span class="text-xs opacity-85">Зарезервировано</span>
              <strong class="text-sm tabular-nums">{{ details.iBronTask }} шт.</strong>
            </div>
            <div class="badge badge--error product-stock-tile">
              <span class="text-xs opacity-85">Брак / Дефекты</span>
              <strong class="text-sm tabular-nums">{{ details.defectQuant }} шт.</strong>
            </div>
          </div>

          <div class="info-section">
            <h3 class="section-heading">Общая информация</h3>
            <div class="property-list-grid">
              <div class="property-item">
                <span class="property-label">Цвет изделия</span
                ><span class="property-value">{{ details.color || '—' }}</span>
              </div>
              <div class="property-item">
                <span class="property-label">Размерный ряд</span
                ><span class="property-value font-mono">{{ details.size || '—' }}</span>
              </div>
              <div class="property-item">
                <span class="property-label">Страна производства</span
                ><span class="property-value">{{ details.country || '—' }}</span>
              </div>
              <div class="property-item">
                <span class="property-label">Системный ID (WMS)</span
                ><span class="property-value font-mono text-muted">{{ details.idName }}</span>
              </div>
            </div>
          </div>

          <div class="info-section">
            <h3 class="section-heading">Логистические параметры ед. товара</h3>
            <div class="property-list-grid grid-col-2">
              <div class="property-item">
                <span class="property-label">Длина упаковки</span
                ><span class="property-value font-mono">{{
                  details.length ? `${details.length} мм` : '—'
                }}</span>
              </div>
              <div class="property-item">
                <span class="property-label">Ширина упаковки</span
                ><span class="property-value font-mono">{{
                  details.width ? `${details.width} мм` : '—'
                }}</span>
              </div>
              <div class="property-item">
                <span class="property-label">Высота упаковки</span
                ><span class="property-value font-mono">{{
                  details.height ? `${details.height} мм` : '—'
                }}</span>
              </div>
              <div class="property-item">
                <span class="property-label">Общий объем</span
                ><span class="property-value font-mono text-primary font-bold">{{
                  details.volumeLiter ? `${details.volumeLiter} л` : '—'
                }}</span>
              </div>
            </div>
          </div>

          <div class="info-section">
            <h3 class="section-heading">Зарегистрированные штрихкоды</h3>
            <div v-if="details.barcodes && details.barcodes.length" class="barcodes-wrap-list">
              <span v-for="bc in details.barcodes" :key="bc" class="barcode-badge"
                ><span class="bc-icon">📋</span> {{ bc }}</span
              >
            </div>
            <div v-else class="no-barcodes-text">Действующие штрихкоды отсутствуют</div>
          </div>
        </div>
      </div>
    </div>
  </BaseModal>

  <BaseModal v-model:isOpen="showExcelModal" maxWidth="sm">
    <template #header>
      <h3 class="m-0 text-lg font-bold">Выгрузка данных в Excel</h3>
    </template>
    <p class="excel-modal-text">
      В таблице сейчас применены фильтры поиска. Выгрузить данные с учетом фильтрации или сохранить
      весь список целиком?
    </p>
    <template #footer>
      <div class="flex flex-col gap-8 w-full">
        <button @click="confirmExport(true)" class="btn btn-primary w-full">
          Применить фильтры ({{ filteredAndSortedItems.length }} стр.)
        </button>
        <button @click="confirmExport(false)" class="btn btn-secondary w-full">
          Выгрузить всё без фильтров ({{ items.length }} стр.)
        </button>
        <button @click="showExcelModal = false" class="btn btn-link text-center pt-4">
          Отмена
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts" generic="T extends Record<string, unknown>">
import { ref, computed } from 'vue'
import * as XLSX from 'xlsx'
import { useViewSettings } from '@/composables/useViewSettings'
import { cardsService, type CardDetailItem } from '@/api/cardsService'
import BaseModal from '@/components/ui/BaseModal.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'

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

// Инжектируем наши 4 независимых флага видимости
const { showImage, showArt, showWbArt, showSize } = useViewSettings()

const isSheetOpen = ref(false)
const isDetailsLoading = ref(false)
const details = ref<CardDetailItem | null>(null)
const activePhoto = ref<string | null>(null)

const allPhotos = computed(() => {
  if (!details.value) return []
  const list: string[] = []
  if (details.value.primaryImageURL) list.push(details.value.primaryImageURL)
  if (details.value.photos && details.value.photos.length) {
    details.value.photos.forEach((p) => {
      if (p && !list.includes(p)) list.push(p)
    })
  }
  return list
})

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
    } catch (err) {
      console.error('Ошибка при получении деталей карточки:', err)
      isSheetOpen.value = false
    } finally {
      isDetailsLoading.value = false
    }
  }
}

// ЧИСТАЯ ФИЛЬТРАЦИЯ КОЛОНОК БЕЗ ЗАМЕЩЕНИЙ
const dynamicColumns = computed(() => {
  return props.columns.filter((col) => {
    if (col.key === 'primaryImageURL' && !showImage.value) return false
    if (col.key === 'cArt' && !showArt.value) return false
    if (col.key === 'cArtWB' && !showWbArt.value) return false
    if (col.key === 'size' && !showSize.value) return false
    return true
  })
})

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

const hasActiveFilters = computed(() =>
  Object.values(filters.value).some((val) => val && val.trim() !== ''),
)

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
