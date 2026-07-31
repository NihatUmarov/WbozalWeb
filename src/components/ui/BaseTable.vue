<template>
  <div class="base-table-root" :style="{ maxHeight }">
    <div v-if="loading" class="table-state absolute inset-0 z-[100] flex flex-col items-center justify-center bg-surface/70 backdrop-blur-[2px]">
      <div class="global-spin" />
      <p class="text-sm font-medium mt-8">{{ loadingText }}</p>
    </div>

    <div class="base-table-header">
      <div v-if="hasConfigurableColumns" class="table-settings-corner">
        <button class="settings-icon-btn" :class="{ 'settings-icon-btn--active': showSettings }" @click="showSettings = !showSettings">⚙️</button>
        <Transition name="fade-slide">
          <div v-if="showSettings" class="settings-popover card shadow-lg" v-click-outside="() => (showSettings = false)">
            <h4 class="text-xs font-bold uppercase text-muted tracking-wider m-0 mb-8">Колонки</h4>
            <div class="flex flex-col gap-4">
              <label v-for="opt in configOptions" :key="opt.key" class="toggle-row">
                <input type="checkbox" v-model="opt.model.value" />
                <span>{{ opt.label }}</span>
              </label>
            </div>
          </div>
        </Transition>
      </div>

      <table class="minimal-table w-full" style="table-layout: fixed">
        <colgroup>
          <col v-for="c in dynamicColumns" :key="'h-'+String(c.key)" :style="{ width: getColWidth(c) }" />
        </colgroup>
        <thead>
          <tr>
            <th v-for="(col, i) in dynamicColumns" :key="String(col.key)" :draggable="true" @dragstart="draggedIndex = i" @dragover.prevent="dragOverIndex = i" @drop="onDrop(i)" :class="{ sortable: col.sortable, 'drag-over': dragOverIndex === i }" :style="{ minWidth: col.minWidth || '60px', position: 'relative' }" @click="col.sortable !== false && handleSort(String(col.key))">
              <div class="th-content flex items-center justify-between w-full cursor-move">
                <span class="truncate text-sm font-semibold text-secondary">{{ col.label }}</span>
                <span v-if="sortKey === String(col.key)" class="sort-arrows ml-4 shrink-0">
                  <span :class="{ active: sortOrder === 'asc' }">▲</span>
                  <span :class="{ active: sortOrder === 'desc' }">▼</span>
                </span>
              </div>
              <div v-if="col.filterable" class="filter-box" @click.stop>
                <input type="text" placeholder="Поиск..." :value="filters[String(col.key)] || ''" @input="onFilterInput(String(col.key), $event)" class="input table-input w-full" />
              </div>
              <div class="resize-handle absolute right-0 top-0 bottom-0 w-[6px] cursor-col-resize z-10" @mousedown.stop.prevent="startResize($event, i)" />
            </th>
          </tr>
        </thead>
      </table>
    </div>

    <div class="base-table-scroll-container" ref="scrollContainer" @scroll.passive="onScroll">
      <div :style="{ height: `${totalHeight}px`, width: '1px', pointerEvents: 'none' }" />
      <div class="base-table-body-window" :style="{ transform: `translate3d(0, ${offsetTop}px, 0)` }">
        <table class="minimal-table w-full" style="table-layout: fixed">
          <colgroup>
            <col v-for="c in dynamicColumns" :key="'b-'+String(c.key)" :style="{ width: getColWidth(c) }" />
          </colgroup>
          <tbody>
            <tr v-if="!loading && !filteredAndSortedItems.length">
              <td :colspan="dynamicColumns.length" class="py-60 text-muted border-none">
                <div class="flex flex-col items-center justify-center">
                  <span class="text-3xl mb-12 block">{{ items.length ? '🔍' : emptyIcon }}</span>
                  <p class="text-base font-semibold">{{ items.length ? 'Ничего не найдено' : emptyText }}</p>
                </div>
              </td>
            </tr>
            <tr v-else v-for="(item, idx) in visibleItems" :key="getItemId(item, idx)" :class="[rowClass?.(item), 'row-clickable']" :style="{ height: `${rowHeight}px` }" @click="handleRowClick(item, $event)">
              <td v-for="col in dynamicColumns" :key="String(col.key)" class="truncate" :style="{ height: `${rowHeight}px` }">
                <slot :name="`cell(${String(col.key)})`" :item="item" :index="idx + startIndex" :value="getVal(item, col.key)">
                  {{ getVal(item, col.key) ?? '—' }}
                </slot>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showExcelModal" class="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-16" @click="showExcelModal = false">
          <div class="card w-full max-w-[400px] flex flex-col gap-20 p-24" @click.stop>
            <div class="flex flex-col gap-8"><h3 class="text-lg font-bold m-0">Экспорт в Excel</h3><p class="text-sm text-muted">У вас применены фильтры. Что выгрузить?</p></div>
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
import { h, defineComponent, type Directive } from 'vue'

export const AppBadge = defineComponent({
  props: { variant: String, text: [String, Number] },
  setup: (p) => () => h('span', { class: ['badge', `badge--${p.variant || 'info'}`] }, p.text)
})

export const AppTableCell = defineComponent({
  props: { value: [String, Number, Object, null], mono: Boolean, bold: Boolean, size: { type: String, default: 'sm' }, color: { type: String, default: 'primary' }, align: { type: String, default: 'start' }, bg: { type: String, default: 'none' }, border: Boolean, px: Number, py: Number },
  setup: (p) => () => h('div', {
    class: ['flex items-center min-w-0 truncate h-full', `text-${p.size}`, p.bold && 'font-bold', `text-${p.color}`, `justify-${p.align === 'center' ? 'center' : (p.align === 'end' ? 'end' : 'start')}`, p.bg !== 'none' && `bg-${p.bg}`, p.border && 'border-dark', p.px && `px-${p.px}`, p.py && `py-${p.py}`, p.mono && 'font-mono tabular-nums'],
    title: String(p.value ?? '')
  }, String(p.value ?? ''))
})

export interface TableColumn<T = Record<string, unknown>> {
  key: keyof T | string; label: string; sortable?: boolean; filterable?: boolean; width?: string; minWidth?: string; exportFormatter?: (v: unknown, item: T) => string | number
}

export interface TableExposed {
  triggerExcelExport: (n: string) => void
  setScrollTop: (v: number) => void
}
</script>

<script setup lang="ts" generic="T extends Record<string, any>">
import { ref, computed, watch, onMounted, onUnmounted, reactive, nextTick } from 'vue'
import * as XLSX from 'xlsx'
import { useViewSettings } from '@/composables/useViewSettings'

const props = withDefaults(defineProps<{
  items: T[]; columns: TableColumn<T>[]; loading?: boolean; loadingText?: string; emptyText?: string; emptyIcon?: string; maxHeight?: string; rowClass?: (item: T) => string; rowHeight?: number
}>(), { loading: false, loadingText: 'Загрузка...', emptyText: 'Нет данных', emptyIcon: '📂', maxHeight: 'calc(100vh - 250px)', rowHeight: 65 })

const emit = defineEmits<{ (e: 'rowClick', item: T): void }>()
const { showImage, showArt, showWbArt, showSize } = useViewSettings()

const scrollContainer = ref<HTMLElement | null>(null), scrollTop = ref(0), startIndex = ref(0), visibleCount = ref(30)
const onScroll = (e: Event) => {
  const t = e.target as HTMLElement
  scrollTop.value = t.scrollTop; startIndex.value = Math.max(0, Math.floor(t.scrollTop / props.rowHeight) - 5)
}

const updateMetrics = () => { if (scrollContainer.value) visibleCount.value = Math.ceil(scrollContainer.value.clientHeight / props.rowHeight) + 15 }
const getVal = (item: T, key: keyof T | string): unknown => (item as Record<string, unknown>)[key as string]
const getColWidth = (c: TableColumn<T>) => columnWidths[String(c.key)] || c.width || c.minWidth || '150px'

const filters = reactive<Record<string, string>>({}), sortKey = ref<string | null>(null), sortOrder = ref<'asc' | 'desc'>('asc')
const filteredAndSortedItems = computed(() => {
  if (!props.items) return []
  let res = [...props.items]
  const activeFilters = Object.entries(filters).filter(([_, v]) => v?.trim())
  if (activeFilters.length) res = res.filter(item => activeFilters.every(([k, q]) => String(getVal(item, k) ?? '').toLowerCase().includes(q.toLowerCase())))

  if (sortKey.value) {
    const k = sortKey.value, o = sortOrder.value
    res.sort((a, b) => {
      const vA = getVal(a, k) as string | number | null, vB = getVal(b, k) as string | number | null
      if (vA === vB) return 0; if (vA === null) return 1; if (vB === null) return -1
      return o === 'asc' ? (vA > vB ? 1 : -1) : (vA < vB ? 1 : -1)
    })
  }
  return res
})

const visibleItems = computed(() => filteredAndSortedItems.value.slice(startIndex.value, startIndex.value + visibleCount.value))
const offsetTop = computed(() => startIndex.value * props.rowHeight), totalHeight = computed(() => filteredAndSortedItems.value.length * props.rowHeight)
watch(() => filteredAndSortedItems.value.length, () => { if (scrollContainer.value) scrollContainer.value.scrollTop = 0; startIndex.value = 0 })

const handleSort = (k: string) => {
  if (sortKey.value === k) sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = k; sortOrder.value = 'asc' }
}

const showSettings = ref(false), dragOverIndex = ref<number | null>(null), draggedIndex = ref<number | null>(null)
const columnOrder = ref<TableColumn<T>[]>([]), columnWidths = reactive<Record<string, string>>({})
const hasConfigurableColumns = computed(() => props.columns.some(c => ['primaryImageURL', 'cArt', 'cArtWB', 'size'].includes(String(c.key))))

watch(() => props.columns, c => columnOrder.value = [...c], { immediate: true })
const dynamicColumns = computed(() => columnOrder.value.filter(c => {
  const k = String(c.key)
  return k === 'primaryImageURL' ? showImage.value : k === 'cArt' ? showArt.value : k === 'cArtWB' ? showWbArt.value : k === 'size' ? showSize.value : true
}))

const configOptions = [{ key: 'primaryImageURL', label: 'Фото', model: showImage }, { key: 'cArt', label: 'Артикул', model: showArt }, { key: 'cArtWB', label: 'Арт. МП', model: showWbArt }, { key: 'size', label: 'Размер', model: showSize }]
const onDrop = (i: number) => {
  if (draggedIndex.value !== null && draggedIndex.value !== i) {
    const arr = [...columnOrder.value], [m] = arr.splice(draggedIndex.value, 1); arr.splice(i, 0, m); columnOrder.value = arr
  }
  dragOverIndex.value = draggedIndex.value = null
}

const startResize = (e: MouseEvent, i: number) => {
  const k1 = String(dynamicColumns.value[i].key), k2 = String(dynamicColumns.value[i+1]?.key)
  if (!k2) return
  const ths = scrollContainer.value?.parentElement?.querySelectorAll('th')
  if (!ths) return
  const w1 = ths[i].offsetWidth, w2 = ths[i+1].offsetWidth, x = e.pageX
  const move = (me: MouseEvent) => { const d = me.pageX - x; columnWidths[k1] = `${Math.max(w1 + d, 60)}px`; columnWidths[k2] = `${Math.max(w2 - d, 60)}px` }
  const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up) }
  document.addEventListener('mousemove', move); document.addEventListener('mouseup', up)
}

let filterTimeout: ReturnType<typeof setTimeout>
const onFilterInput = (k: string, e: Event) => {
  const v = (e.target as HTMLInputElement).value
  clearTimeout(filterTimeout)
  filterTimeout = setTimeout(() => filters[k] = v, 150)
}

const showExcelModal = ref(false); let exportName = 'data'
const triggerExcelExport = (n: string) => { exportName = n; if (Object.values(filters).some(v => v?.trim())) showExcelModal.value = true; else generateExcel(false) }
const generateExcel = (f: boolean) => {
  const rows = (f ? filteredAndSortedItems.value : props.items).map(item => {
    const r: Record<string, string | number> = {}
    props.columns.forEach(c => {
      const val = getVal(item, c.key)
      r[c.label] = c.exportFormatter ? c.exportFormatter(val, item) : String(val ?? '—')
    })
    return r
  })
  const ws = XLSX.utils.json_to_sheet(rows), wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Export'); XLSX.writeFile(wb, `${exportName}_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

const getItemId = (item: T, i: number): string | number => {
  const v = item as Record<string, unknown>
  if (typeof v['id'] === 'string' || typeof v['id'] === 'number') return v['id'] as string | number
  if (typeof v['idName'] === 'string' || typeof v['idName'] === 'number') return v['idName'] as string | number
  return i
}
const handleRowClick = (item: T, e: MouseEvent) => { if (!['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName) && !(e.target as HTMLElement).closest('button')) emit('rowClick', item) }

interface ClickOutsideHTMLElement extends HTMLElement {
  _clickOutside?: (e: MouseEvent) => void
}

const vClickOutside: Directive<ClickOutsideHTMLElement, (e: MouseEvent) => void> = {
  mounted(el, b) {
    el._clickOutside = (e: MouseEvent) => { if (!(el === e.target || el.contains(e.target as Node))) b.value(e) }
    document.addEventListener('mousedown', el._clickOutside)
  },
  unmounted(el) { if (el._clickOutside) document.removeEventListener('mousedown', el._clickOutside) }
}

onMounted(() => { nextTick(updateMetrics); window.addEventListener('resize', updateMetrics) }); onUnmounted(() => window.removeEventListener('resize', updateMetrics))
defineExpose({ triggerExcelExport, setScrollTop: (v: number) => { if (scrollContainer.value) scrollContainer.value.scrollTop = v } })
</script>

<style scoped>
.base-table-root { display: flex; flex-direction: column; width: 100%; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-12); overflow: hidden; position: relative; }
.base-table-header { flex-shrink: 0; z-index: 50; background: var(--color-background-secondary); border-bottom: 1px solid var(--color-border-dark); }
.base-table-scroll-container { flex: 1; overflow: auto; position: relative; scrollbar-width: thin; }
.base-table-body-window { position: absolute; top: 0; left: 0; right: 0; will-change: transform; }
.table-settings-corner { position: absolute; top: 8px; right: 8px; z-index: 60; }
.settings-icon-btn { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; background: var(--color-background-secondary); border: 1px solid var(--color-border-dark); border-radius: 4px; cursor: pointer; opacity: 0.6; transition: 0.2s; }
.settings-icon-btn:hover, .settings-icon-btn--active { opacity: 1; background: var(--color-surface); border-color: var(--color-primary); }
.settings-popover { position: absolute; top: 100%; right: 0; width: 160px; padding: 12px; z-index: 100; margin-top: 6px; }
.toggle-row { display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 4px 0; font-size: 12px; }
.minimal-table th:last-child { padding-right: 40px !important; }
.sort-arrows span { opacity: 0.2; font-size: 10px; }
.sort-arrows span.active { opacity: 1; color: var(--color-primary); }
</style>
