<template>
  <div
    class="table-container"
    :style="{ maxHeight: maxHeight }"
    ref="scrollContainer"
    style="overflow: auto; position: relative"
    @scroll="onScroll"
  >
    <!-- Лоадер -->
    <div
      v-if="loading"
      class="table-state absolute inset-0 bg-surface/80 z-50 flex flex-col items-center justify-center"
      style="backdrop-filter: blur(2px); background: rgba(255, 255, 255, 0.7);"
    >
      <div class="global-spin"></div>
      <p class="text-sm font-medium mt-8">{{ loadingText }}</p>
    </div>

    <div class="table-responsive" style="width: 100%; min-width: 100%">

      <!-- КНОПКА НАСТРОЕК -->
      <div v-if="hasConfigurableColumns" class="table-settings-corner">
        <button
          class="settings-icon-btn"
          :class="{ 'settings-icon-btn--active': showSettings }"
          @click="showSettings = !showSettings"
        >⚙️</button>
        <Transition name="fade-slide">
          <div v-if="showSettings" class="settings-popover card shadow-lg" v-click-outside="() => (showSettings = false)">
            <div class="flex flex-col gap-12">
              <h4 class="text-[10px] font-bold uppercase text-muted tracking-wider m-0">Колонки</h4>
              <div class="flex flex-col gap-4">
                <label v-for="opt in configOptions" :key="opt.key" class="toggle-row">
                  <input type="checkbox" v-model="opt.model.value" />
                  <span>{{ opt.label }}</span>
                </label>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <table
        class="minimal-table resizable-table"
        style="table-layout: fixed; width: 100%; border-collapse: separate; border-spacing: 0"
      >
        <colgroup>
          <col v-for="col in dynamicColumns" :key="String(col.key)" :style="{ width: columnWidths[String(col.key)] || col.width || 'auto' }" />
        </colgroup>

        <thead style="position: sticky; top: 0; z-index: 40; background: #fff; box-shadow: 0 1px 0 #e2e8f0">
          <tr>
            <th
              v-for="(col, index) in dynamicColumns"
              :key="String(col.key)"
              :draggable="true"
              @dragstart="onDragStart(index, $event)"
              @dragover.prevent="dragOverIndex = index"
              @drop="onDrop(index)"
              :class="{ sortable: col.sortable, 'drag-over': dragOverIndex === index }"
              :style="{ minWidth: col.minWidth || '60px', position: 'relative', userSelect: 'none' }"
              @click="col.sortable !== false && handleSort(String(col.key))"
            >
              <div class="th-content flex items-center justify-between w-full cursor-move">
                <span class="truncate">{{ col.label }}</span>
                <span v-if="sortKey === String(col.key)" class="sort-arrows ml-4 shrink-0">
                  <span :class="{ active: sortOrder === 'asc' }">▲</span>
                  <span :class="{ active: sortOrder === 'desc' }">▼</span>
                </span>
              </div>
              <div v-if="col.filterable" class="filter-box" @click.stop>
                <input type="text" placeholder="Поиск..." :value="filters[String(col.key)] || ''" @input="onFilterInput(String(col.key), $event)" class="input table-input w-full" />
              </div>
              <div class="resize-handle absolute right-0 top-0 bottom-0 w-[6px] cursor-col-resize z-10" @mousedown.stop.prevent="startResize($event, index)"></div>
            </th>
          </tr>
        </thead>

        <tbody :style="virtualStyles">
          <!-- Пустые состояния -->
          <tr v-if="!loading && items.length === 0">
            <td :colspan="dynamicColumns.length" class="py-60 text-muted" style="border: none">
              <div class="flex flex-col items-center justify-center sticky left-0" :style="{ width: `${viewportWidth}px` }">
                <span class="text-3xl mb-12 block">{{ emptyIcon }}</span>
                <p class="text-base font-semibold">{{ emptyText }}</p>
              </div>
            </td>
          </tr>
          <tr v-else-if="!loading && filteredAndSortedItems.length === 0">
            <td :colspan="dynamicColumns.length" class="py-60 text-muted" style="border: none">
              <div class="flex flex-col items-center justify-center sticky left-0" :style="{ width: `${viewportWidth}px` }">
                <span class="text-3xl mb-12 block">🔍</span>
                <p class="text-base font-semibold">Ничего не найдено</p>
              </div>
            </td>
          </tr>

          <!-- Реальные строки -->
          <tr
            v-else
            v-for="(item, index) in visibleItems"
            :key="getItemId(item, index)"
            :class="[rowClass ? rowClass(item) : '', 'row-clickable']"
            :style="{ height: `${rowHeight}px`, maxHeight: `${rowHeight}px` }"
            @click="handleRowClick(item, $event)"
          >
            <td v-for="col in dynamicColumns" :key="String(col.key)" class="truncate" :style="{ height: `${rowHeight}px` }">
              <slot :name="`cell(${String(col.key)})`" :item="item" :index="index + startIndex" :value="getVal(item, col.key)">
                {{ getVal(item, col.key) ?? '—' }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Excel Confirm -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showExcelModal" class="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-16" @click="showExcelModal = false">
          <div class="card w-full max-w-[400px] flex flex-col gap-20 p-24" @click.stop>
            <div class="flex flex-col gap-8">
              <h3 class="text-lg font-bold m-0">Экспорт в Excel</h3>
              <p class="text-sm text-muted">У вас применены фильтры. Что выгрузить?</p>
            </div>
            <div class="flex justify-end gap-12">
              <button class="btn btn-secondary flex-1" @click="generateExcel(false); showExcelModal = false">Все данные</button>
              <button class="btn btn-primary flex-1" @click="generateExcel(true); showExcelModal = false">С фильтрами</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script lang="ts">
import { h, defineComponent, computed as vueComputed } from 'vue'

export const AppBadge = defineComponent({
  props: { variant: String, text: [String, Number] },
  setup(p) { return () => h('span', { class: ['badge', `badge--${p.variant || 'info'}`] }, p.text) }
})

export const AppTableCell = defineComponent({
  props: { value: [String, Number, Object, null], mono: Boolean, bold: Boolean, size: { type: String, default: 'sm' }, color: { type: String, default: 'primary' }, align: { type: String, default: 'start' }, bg: { type: String, default: 'none' }, border: Boolean, px: Number, py: Number },
  setup(p) {
    const cls = vueComputed(() => [
      'flex items-center min-w-0 truncate',
      `text-${p.size}`, p.bold ? 'font-bold' : '', `text-${p.color}`, `justify-${p.align === 'center' ? 'center' : (p.align === 'end' ? 'end' : 'start')}`,
      p.bg !== 'none' ? `bg-${p.bg}` : '', p.border ? 'border-dark' : '',
      p.px ? `px-${p.px}` : '', p.py ? `py-${p.py}` : '',
      p.mono ? 'font-mono tabular-nums' : ''
    ])
    return () => h('div', { class: cls.value, title: p.value != null ? String(p.value) : '' }, p.value != null ? String(p.value) : '')
  }
})

export interface TableColumn<T = Record<string, unknown>> {
  key: keyof T | string; label: string; sortable?: boolean; filterable?: boolean; width?: string; minWidth?: string; exportFormatter?: (v: unknown, item: T) => string | number
}
</script>

<script setup lang="ts" generic="T extends Record<string, unknown>">
import { ref, computed, watch, onMounted, onUnmounted, reactive, nextTick, type DirectiveBinding } from 'vue'
import * as XLSX from 'xlsx'
import { useViewSettings } from '@/composables/useViewSettings'

const props = withDefaults(defineProps<{
  items: T[]; columns: TableColumn<T>[]; loading?: boolean; loadingText?: string; emptyText?: string; emptyIcon?: string; maxHeight?: string; rowClass?: (item: T) => string; rowHeight?: number
}>(), {
  loading: false, loadingText: 'Загрузка...', emptyText: 'Нет данных', emptyIcon: '📂', maxHeight: 'calc(100vh - 280px)', rowHeight: 80
})

const emit = defineEmits<{ (e: 'rowClick', item: T): void }>()
const { showImage, showArt, showWbArt, showSize } = useViewSettings()

const scrollContainer = ref<HTMLElement | null>(null)
const scrollTop = ref(0)
const viewportHeight = ref(800)
const viewportWidth = ref(1000)

const startIndex = ref(0)
const endIndex = ref(100)

const syncViewport = () => {
  const items = filteredAndSortedItems.value
  if (!items.length) { startIndex.value = 0; endIndex.value = 100; return }
  const currentScroll = scrollContainer.value?.scrollTop || 0
  const currentViewHeight = scrollContainer.value?.clientHeight || 800
  const startRow = Math.floor(currentScroll / props.rowHeight)
  const rowsInView = Math.ceil(currentViewHeight / props.rowHeight)
  const buffer = 40
  startIndex.value = Math.max(0, startRow - buffer)
  endIndex.value = Math.min(items.length, startRow + rowsInView + buffer)
  scrollTop.value = currentScroll
}

const onScroll = () => { window.requestAnimationFrame(syncViewport) }

const updateViewportMetrics = () => {
  if (scrollContainer.value) {
    viewportHeight.value = scrollContainer.value.clientHeight
    viewportWidth.value = scrollContainer.value.clientWidth
    syncViewport()
  }
}

// ФИЛЬТРАЦИЯ И СОРТИРОВКА
const filters = reactive<Record<string, string>>({})
const sortKey = ref<string | null>(null)
const sortOrder = ref<'asc' | 'desc'>('asc')

const getVal = (item: T, key: keyof T | string): unknown => (item as Record<string, unknown>)[key as string]

const filteredAndSortedItems = computed(() => {
  if (!props.items) return []
  let res = [...props.items]
  const activeFilters = Object.entries(filters).filter(([_, v]) => v && v.trim() !== '')

  if (activeFilters.length) {
    res = res.filter(item => activeFilters.every(([k, q]) => {
      const query = q.toLowerCase()
      const val = getVal(item, k)
      if (k === 'barcodes' || k === 'barcode') {
        const raw = item as Record<string, unknown>
        const bcs = Array.isArray(raw.barcodes) ? (raw.barcodes as string[]) : [String(raw.barcode || '')]
        return bcs.some(b => String(b || '').toLowerCase().includes(query))
      }
      return String(val ?? '').toLowerCase().includes(query)
    }))
  }

  if (sortKey.value) {
    const key = sortKey.value; const order = sortOrder.value
    res.sort((a, b) => {
      const vA = getVal(a, key), vB = getVal(b, key)
      if (vA === vB) return 0
      if (vA == null) return 1
      if (vB == null) return -1
      const mod = order === 'asc' ? 1 : -1
      if (typeof vA === 'number' && typeof vB === 'number') return (vA - vB) * mod
      return String(vA) > String(vB) ? mod : -mod
    })
  }
  return res
})

const visibleItems = computed(() => filteredAndSortedItems.value.slice(startIndex.value, endIndex.value))

const virtualStyles = computed(() => {
  const total = filteredAndSortedItems.value.length
  const top = startIndex.value * props.rowHeight
  const bottom = Math.max(0, (total - endIndex.value) * props.rowHeight)
  return { paddingTop: `${top}px`, paddingBottom: `${bottom}px`, display: 'table-row-group' }
})

watch(() => filteredAndSortedItems.value.length, (newLen, oldLen) => {
  if (newLen < oldLen && scrollContainer.value) scrollContainer.value.scrollTop = 0
  syncViewport()
})

const handleSort = (k: string) => {
  if (sortKey.value === k) sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = k; sortOrder.value = 'asc' }
}

// UI LOGIC (SETTINGS, DnD, RESIZE)
const showSettings = ref(false); const dragOverIndex = ref<number | null>(null); let draggedIndex: number | null = null
const columnOrder = ref<TableColumn<T>[]>([]); const columnWidths = reactive<Record<string, string>>({})
const hasConfigurableColumns = computed(() => props.columns.some(c => ['primaryImageURL', 'cArt', 'cArtWB', 'size'].includes(String(c.key))))

watch(() => props.columns, (c) => { columnOrder.value = [...c] }, { immediate: true })
const dynamicColumns = computed(() => columnOrder.value.filter(c => {
  const k = String(c.key)
  if (k === 'primaryImageURL') return showImage.value
  if (k === 'cArt') return showArt.value
  if (k === 'cArtWB') return showWbArt.value
  if (k === 'size') return showSize.value
  return true
}))

const configOptions = [
  { key: 'primaryImageURL', label: 'Фото', model: showImage },
  { key: 'cArt', label: 'Артикул', model: showArt },
  { key: 'cArtWB', label: 'Арт. МП', model: showWbArt },
  { key: 'size', label: 'Размер', model: showSize }
]

const onDragStart = (i: number, e: DragEvent) => { draggedIndex = i; if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move' }
const onDrop = (i: number) => {
  if (draggedIndex !== null && draggedIndex !== i) {
    const arr = [...columnOrder.value]; const [m] = arr.splice(draggedIndex, 1); arr.splice(i, 0, m); columnOrder.value = arr
  }
  dragOverIndex.value = null; draggedIndex = null
}

const startResize = (e: MouseEvent, i: number) => {
  const k1 = String(dynamicColumns.value[i].key), k2 = String(dynamicColumns.value[i+1]?.key)
  if (!k2) return
  const ths = scrollContainer.value?.querySelectorAll('th'); if (!ths) return
  const w1 = ths[i].offsetWidth, w2 = ths[i+1].offsetWidth, x = e.pageX
  const move = (me: MouseEvent) => {
    const d = me.pageX - x
    columnWidths[k1] = `${Math.max(w1 + d, 60)}px`; columnWidths[k2] = `${Math.max(w2 - d, 60)}px`
  }
  const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up) }
  document.addEventListener('mousemove', move); document.addEventListener('mouseup', up)
}

const filterTimeouts = new Map<string, ReturnType<typeof setTimeout>>()
const onFilterInput = (k: string, e: Event) => {
  const v = (e.target as HTMLInputElement).value
  if (filterTimeouts.has(k)) clearTimeout(filterTimeouts.get(k)!)
  filterTimeouts.set(k, setTimeout(() => { filters[k] = v; filterTimeouts.delete(k) }, 120))
}

const showExcelModal = ref(false); let currentExportName = 'data'
const triggerExcelExport = (n: string) => {
  currentExportName = n
  if (Object.values(filters).some(v => v && v.trim() !== '')) showExcelModal.value = true
  else generateExcel(false)
}
const generateExcel = (f: boolean) => {
  const data = f ? filteredAndSortedItems.value : props.items
  const rows = data.map(item => {
    const r: Record<string, string | number> = {}
    props.columns.forEach(c => r[c.label] = c.exportFormatter ? c.exportFormatter(getVal(item, c.key), item) : String(getVal(item, c.key) ?? '—'))
    return r
  })
  const ws = XLSX.utils.json_to_sheet(rows), wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Export')
  XLSX.writeFile(wb, `${currentExportName}_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

const getItemId = (item: T, i: number) => {
  const raw = item as Record<string, unknown>
  return (raw.id as string | number) || (raw.idName as string | number) || (raw.idOzonProduct as string | number) || (raw.idChrt as string | number) || i
}
const handleRowClick = (item: T, e: MouseEvent) => {
  if (['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName) || (e.target as HTMLElement).closest('button')) return
  emit('rowClick', item)
}

const vClickOutside = {
  mounted(el: HTMLElement & { _clickOutside?: (e: Event) => void }, b: DirectiveBinding) {
    el._clickOutside = (e: Event) => { if (!(el === e.target || el.contains(e.target as Node))) (b.value as (e: Event) => void)(e) }
    document.addEventListener('mousedown', el._clickOutside)
  },
  unmounted(el: HTMLElement & { _clickOutside?: (e: Event) => void }) {
    if (el._clickOutside) document.removeEventListener('mousedown', el._clickOutside)
  }
}

onMounted(async () => { await nextTick(); updateViewportMetrics(); window.addEventListener('resize', updateViewportMetrics) })
onUnmounted(() => window.removeEventListener('resize', updateViewportMetrics))

defineExpose({ triggerExcelExport, getScrollTop: () => scrollContainer.value?.scrollTop || 0, setScrollTop: (v: number) => { if (scrollContainer.value) scrollContainer.value.scrollTop = v } })
</script>

<style scoped>
.table-settings-corner { position: absolute; top: 8px; right: 8px; z-index: 60; }
.settings-icon-btn { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; background: var(--color-background-secondary); border: 1px solid var(--color-border-dark); border-radius: 4px; cursor: pointer; opacity: 0.6; transition: 0.2s; }
.settings-icon-btn:hover, .settings-icon-btn--active { opacity: 1; background: #fff; border-color: var(--color-primary); }
.settings-popover { position: absolute; top: 100%; right: 0; width: 160px; padding: 12px; z-index: 100; margin-top: 6px; }
.toggle-row { display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 4px 0; font-size: 12px; }
.minimal-table th:last-child { padding-right: 40px !important; }
.sort-arrows span { opacity: 0.2; font-size: 10px; }
.sort-arrows span.active { opacity: 1; color: var(--color-primary); }
</style>
