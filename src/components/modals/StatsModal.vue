<template>
  <BaseDialog :is-open="isOpen" @update:is-open="$emit('update:isOpen', $event)" variant="modal" max-width="6xl">
    <template #header>
      <div class="flex items-center justify-between w-full pr-10 md:pr-40">
        <div class="flex items-center gap-12 md:gap-24">
          <h2 class="text-xl md:text-2xl font-extrabold m-0 tracking-tight text-primary">Статистика продаж</h2>
          <div class="flex items-center bg-secondary/50 border border-dark rounded-8 p-1">
            <button
              v-for="opt in sourceOptions"
              :key="opt.value"
              type="button"
              class="btn btn-xs h-28 transition-all px-12"
              :class="filterSource === opt.value ? 'btn-primary' : 'btn-secondary border-none bg-transparent'"
              @click="filterSource = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <div class="flex flex-col gap-12 py-2">
      <!-- Line Chart Section -->
      <div class="card p-16 md:p-20 bg-white relative overflow-hidden flex flex-col gap-12">
        <div class="flex items-center justify-between">
          <div class="flex flex-col">
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted mb-2">Динамика отгрузок</span>
            <div class="h-1.5 w-16 bg-primary rounded-full"></div>
          </div>
          <div class="flex items-center gap-8">
            <AppBadge variant="info" :text="`Всего: ${totalPeriodCount} шт.`" />
          </div>
        </div>

        <!-- 8 Buttons for Day Selection -->
        <div class="flex items-center bg-secondary/50 border border-dark rounded-10 p-1 gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            class="btn btn-xs h-36 flex-1 flex flex-col items-center justify-center min-w-[80px]"
            :class="selectedDate === null ? 'btn-primary shadow-sm' : 'btn-secondary border-none bg-transparent text-muted'"
            @click="selectedDate = null"
          >
            <span class="text-[9px] uppercase font-bold opacity-70 leading-tight">Период</span>
            <span class="text-[12px] font-extrabold leading-tight">7 Дней</span>
          </button>

          <div class="w-px h-16 bg-dark/50 self-center"></div>

          <button
            v-for="day in graphData"
            :key="day.date"
            type="button"
            class="btn btn-xs h-36 flex-1 flex flex-col items-center justify-center min-w-[50px]"
            :class="selectedDate === day.date ? 'btn-primary shadow-sm' : 'btn-secondary border-none bg-transparent text-muted'"
            @click="selectedDate = day.date"
          >
            <span class="text-[9px] font-bold uppercase opacity-70 leading-tight">{{ day.weekday }}</span>
            <span class="text-[13px] font-extrabold leading-tight">{{ day.dayNum }}</span>
          </button>
        </div>

        <!-- SVG Line Chart -->
        <div class="relative h-[140px] w-full mt-4 group">
          <svg viewBox="0 0 800 150" class="w-full h-full overflow-visible" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="var(--color-primary)" stop-opacity="0.1" />
                <stop offset="100%" stop-color="var(--color-primary)" stop-opacity="0" />
              </linearGradient>
            </defs>
            <path :d="chartAreaPath" fill="url(#chartGradient)" />
            <path :d="chartLinePath" fill="none" stroke="var(--color-primary)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
            <g v-for="(p, i) in chartPoints" :key="i">
              <circle
                :cx="p.x" :cy="p.y" r="5"
                class="cursor-pointer transition-all hover:r-7"
                :fill="selectedDate === p.date ? 'var(--color-primary)' : 'var(--color-surface)'"
                :stroke="selectedDate === p.date ? 'var(--color-surface)' : 'var(--color-primary)'"
                stroke-width="2"
                @click="selectedDate = p.date"
              />
              <text
                v-if="p.count > 0"
                :x="p.x" :y="p.y - 12"
                text-anchor="middle"
                class="text-[11px] font-bold fill-primary pointer-events-none"
              >
                {{ p.count }}
              </text>
            </g>
          </svg>
        </div>
      </div>

      <!-- Table Section -->
      <div class="flex flex-col gap-8">
        <div class="flex items-center justify-between px-2">
          <h3 class="text-base font-bold m-0 text-primary">
            {{ selectedDate ? `Продажи за ${getDisplayDate(selectedDate)}` : 'Топ товаров за неделю' }}
          </h3>

          <button class="btn btn-secondary btn-xs h-32 flex items-center gap-8" @click="exportToExcel">
            <img src="@/components/icons/office-exel.svg" alt="Excel" style="width: 16px; height: 16px; object-fit: contain;" />
            <span class="text-[12px]">Excel Отчет</span>
          </button>
        </div>

        <div class="card no-padding overflow-hidden min-h-[350px]">
          <BaseTable
            :items="aggregatedTableData"
            :columns="tableColumns"
            :loading="loading"
            :row-height="60"
            max-height="400px"
          >
            <template #cell(photo)="{ item }">
              <div class="w-[30px] h-[45px] flex items-center justify-center bg-secondary rounded-4 overflow-hidden mx-auto border border-dark/10">
                <img v-if="item.primaryImageURL" :src="item.primaryImageURL" alt="P" class="object-contain w-full h-full" />
                <div v-else class="text-[8px] text-muted">No</div>
              </div>
            </template>
            <template #cell(product)="{ item }">
              <div class="flex flex-col min-w-0 py-2">
                <span class="text-sm font-semibold text-primary truncate" :title="item.cName">{{ item.cName }}</span>
                <div class="flex items-center gap-6 mt-4">
                  <div class="flex items-center gap-2 bg-secondary border border-dark px-6 py-2 rounded-4 font-mono text-[10px]">
                    <span class="text-muted">ID:</span>
                    <span class="font-bold text-primary">{{ item.idName }}</span>
                  </div>
                  <div class="flex items-center gap-2 bg-secondary border border-dark px-6 py-2 rounded-4 font-mono text-[10px]">
                    <span class="text-muted">Арт:</span>
                    <span class="font-bold text-primary">{{ item.cArt }}</span>
                  </div>
                </div>
              </div>
            </template>
            <template #cell(source)="{ item }">
              <div class="flex gap-4">
                <div v-if="item.sources.includes('WB')" class="px-6 py-2 rounded-4 bg-[#7c3aed]/10 text-[#7c3aed] border border-[#7c3aed]/20 text-[9px] font-black">WB</div>
                <div v-if="item.sources.includes('OZON')" class="px-6 py-2 rounded-4 bg-[#005bff]/10 text-[#005bff] border border-[#005bff]/20 text-[9px] font-black">OZON</div>
              </div>
            </template>
            <template #cell(count)="{ value }">
              <div class="flex justify-center">
                <AppBadge variant="success" :text="`${value} шт.`" />
              </div>
            </template>
          </BaseTable>
        </div>
      </div>
    </div>






    <template #footer>
      <button class="btn btn-secondary px-24" @click="$emit('update:isOpen', false)">Закрыть</button>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseDialog from '@/components/ui/UnifiedUI.vue'
import BaseTable, { AppBadge, type TableColumn } from '@/components/ui/BaseTable.vue'
import { productService } from '@/api/productService'
import type { MarketplaceStatResponse, SummaryStat, MarketplaceStat } from '@/api/types'
import { useAsync } from '@/composables/useAsync'
import * as XLSX from 'xlsx'

const props = defineProps<{ isOpen: boolean }>()
defineEmits<{ (e: 'update:isOpen', val: boolean): void }>()

interface AggregatedStat {
  idName: number
  cName: string
  cArt: string
  primaryImageURL: string | null
  count: number
  sources: string[]
}

const { loading, run } = useAsync()
const stats = ref<MarketplaceStatResponse | null>(null)
const filterSource = ref<'ALL' | 'WB' | 'OZON'>('ALL')
const selectedDate = ref<string | null>(null)

const sourceOptions = [
  { label: 'Все МП', value: 'ALL' },
  { label: 'Wildberries', value: 'WB' },
  { label: 'Ozon', value: 'OZON' }
]

const tableColumns = computed((): TableColumn<AggregatedStat>[] => [
  { key: 'photo', label: 'Фото', width: '50px' },
  { key: 'product', label: 'Товар (WMS)', minWidth: '300px' },
  { key: 'source', label: 'МП', width: '100px' },
  { key: 'count', label: 'Кол-во', width: '120px', align: 'center', sortable: true }
])

const filteredDaily = computed(() => {
  if (!stats.value) return []
  const data = stats.value.daily
  if (filterSource.value === 'ALL') return data
  return data.filter(s => s.source === filterSource.value)
})

const totalPeriodCount = computed(() => {
  if (!stats.value) return 0
  const data = filterSource.value === 'ALL' ? stats.value.summary : stats.value.summary.filter(s => s.source === filterSource.value)
  return data.reduce((acc, s) => acc + s.count, 0)
})

const graphData = computed(() => {
  const map = new Map<string, number>()
  const days = 7

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    map.set(d.toISOString().split('T')[0], 0)
  }

  filteredDaily.value.forEach(s => {
    const d = s.date.split('T')[0]
    if (map.has(d)) map.set(d, (map.get(d) || 0) + s.count)
  })

  const entries = Array.from(map.entries()).map(([date, count]) => ({
    date,
    count,
    dayNum: new Date(date).getDate(),
    weekday: new Intl.DateTimeFormat('ru-RU', { weekday: 'short' }).format(new Date(date))
  }))

  const max = Math.max(...entries.map(e => e.count), 1)
  return entries.map(e => ({ ...e, percent: (e.count / max) * 100 }))
})

// Line Chart SVG Calculations
const chartPoints = computed(() => {
  const data = graphData.value
  const width = 800 // Virtual width
  const height = 150 // Virtual height
  const padding = 40

  return data.map((d, i) => {
    const x = padding + (i * (width - 2 * padding) / (data.length - 1))
    const y = height - padding - (d.percent * (height - 2 * padding) / 100)
    return { x, y, date: d.date, count: d.count }
  })
})

const chartLinePath = computed(() => {
  const pts = chartPoints.value
  if (pts.length < 2) return ''
  return `M ${pts.map(p => `${p.x},${p.y}`).join(' L ')}`
})

const chartAreaPath = computed(() => {
  const pts = chartPoints.value
  if (pts.length < 2) return ''
  const first = pts[0]
  const last = pts[pts.length - 1]
  const height = 150
  return `${chartLinePath.value} L ${last.x},${height} L ${first.x},${height} Z`
})

const aggregatedTableData = computed(() => {
  if (!stats.value) return []

  // Choose source data: either details (if date selected or we need aggregation) or summary
  let rawData: (MarketplaceStat | SummaryStat)[] = []

  if (selectedDate.value) {
    rawData = stats.value.details.filter(d => d.date.startsWith(selectedDate.value!))
  } else {
    // If no date selected, we show summary for the whole week
    rawData = stats.value.summary
  }

  // Filter by source
  if (filterSource.value !== 'ALL') {
    rawData = rawData.filter(d => d.source === filterSource.value)
  }

  // Aggregate by ID (idName)
  const map = new Map<number, AggregatedStat>()
  rawData.forEach(item => {
    if (!map.has(item.idName)) {
      map.set(item.idName, {
        idName: item.idName,
        cName: item.cName,
        cArt: item.cArt,
        primaryImageURL: item.primaryImageURL,
        count: 0,
        sources: []
      })
    }
    const entry = map.get(item.idName)!
    entry.count += item.count
    if (!entry.sources.includes(item.source)) {
      entry.sources.push(item.source)
    }
  })

  return Array.from(map.values()).sort((a, b) => b.count - a.count)
})

const getDisplayDate = (dateStr: string) => {
  const d = new Date(dateStr)
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(d)
}

const fetchData = () => run(async () => {
  stats.value = await productService.getStats() as MarketplaceStatResponse
})

const exportToExcel = () => {
  if (!stats.value) return

  // Detailed export: all records from 'details' with dates, sources, items
  const data = stats.value.details
    .filter(d => filterSource.value === 'ALL' || d.source === filterSource.value)
    .map(d => ({
      'Дата': new Date(d.date).toLocaleDateString('ru-RU'),
      'Товар': d.cName,
      'Артикул': d.cArt,
      'ID WMS': d.idName,
      'Маркетплейс': d.source,
      'Количество': d.count
    }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Подробная статистика')

  const fileName = `Stats_Detailed_${new Date().toISOString().slice(0, 10)}.xlsx`
  XLSX.writeFile(wb, fileName)
}


watch(() => props.isOpen, (v) => { if (v) fetchData() })
</script>

<style scoped>
.text-wb { color: #7c3aed; }
.border-wb\/20 { border-color: rgba(124, 58, 237, 0.2); }
.bg-wb\/10 { background-color: rgba(124, 58, 237, 0.1); }

.text-ozon { color: #005bff; }
.border-ozon\/20 { border-color: rgba(0, 91, 255, 0.2); }
.bg-ozon\/10 { background-color: rgba(0, 91, 255, 0.1); }

.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

/* SVG Transition */
path { transition: d 0.5s ease-in-out; }
</style>



