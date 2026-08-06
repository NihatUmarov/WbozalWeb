<template>
  <BaseDialog :is-open="isOpen" @update:is-open="$emit('update:isOpen', $event)" variant="modal" max-width="6xl">
    <template #header>
      <div class="flex items-center justify-between w-full pr-32">
        <h2 class="text-xl font-bold m-0 flex items-center gap-12">
          <img src="@/components/icons/office-exel.svg" alt="Stats" width="24" height="24" class="opacity-80" />
          Статистика продаж за неделю
        </h2>
        <div class="flex items-center gap-12">
          <div class="flex bg-secondary rounded-8 p-4 border-dark">
            <button
              v-for="m in marketplaceOptions"
              :key="m.value"
              class="px-12 py-4 rounded-6 text-xs font-bold transition-all"
              :class="filterMarketplace === m.value ? 'bg-surface text-primary shadow-sm' : 'text-muted hover:text-primary'"
              @click="filterMarketplace = m.value"
            >
              {{ m.label }}
            </button>
          </div>
          <button class="btn btn-secondary btn-sm flex items-center gap-8" :disabled="!filteredStats.length" @click="handleExport">
            <img src="@/components/icons/office-exel.svg" alt="Excel" width="16" height="16" />
            <span>Экспорт</span>
          </button>
        </div>
      </div>
    </template>

    <div class="stats-container flex flex-col gap-20 py-8 min-h-[500px]">
      <!-- Summary and Chart Row -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-20">
        <!-- Totals Cards -->
        <div class="lg:col-span-3 flex flex-col gap-12">
          <div class="stat-card p-16 rounded-12 bg-secondary border-dark flex flex-col gap-4">
            <span class="text-[10px] font-bold text-muted uppercase tracking-wider">Всего за неделю</span>
            <span class="text-3xl font-black text-primary">{{ weeklyTotal }} <small class="text-sm font-normal text-muted">шт.</small></span>
          </div>
          <div class="grid grid-cols-2 gap-12">
            <div class="stat-card p-12 rounded-12 bg-surface border-dark flex flex-col gap-2 border-l-4 border-l-brand">
              <span class="text-[10px] font-bold text-muted uppercase">Wildberries</span>
              <span class="text-xl font-bold text-primary">{{ weeklyWbTotal }}</span>
            </div>
            <div class="stat-card p-12 rounded-12 bg-surface border-dark flex flex-col gap-2 border-l-4 border-l-info">
              <span class="text-[10px] font-bold text-muted uppercase">Ozon</span>
              <span class="text-xl font-bold text-primary">{{ weeklyOzTotal }}</span>
            </div>
          </div>
          <div class="mt-auto p-12 bg-brand-soft rounded-8 text-xs text-brand-dark flex items-start gap-8">
            <span class="mt-2">ℹ️</span>
            <span>Статистика обновляется при каждой отгрузке и печати этикеток.</span>
          </div>
        </div>

        <!-- Chart Section -->
        <div class="lg:col-span-9 p-16 rounded-12 bg-surface border-dark flex flex-col gap-16">
          <div class="flex items-center justify-between">
            <span class="text-sm font-bold text-primary">Динамика отгрузок по дням</span>
            <div class="flex items-center gap-12 text-[10px] font-bold uppercase text-muted">
              <div class="flex items-center gap-4"><div class="w-8 h-8 rounded-full bg-brand" /> WB</div>
              <div class="flex items-center gap-4"><div class="w-8 h-8 rounded-full bg-info" /> OZON</div>
            </div>
          </div>

          <div class="chart-wrapper flex-1 min-h-[180px] flex items-end justify-between px-8 pb-24 relative pt-20">
            <!-- Y-axis helper lines -->
            <div class="absolute inset-x-0 bottom-24 h-[1px] bg-border-subtle" />
            <div class="absolute inset-x-0 top-1/2 h-[1px] bg-border-subtle opacity-50" />

            <div v-for="day in chartData" :key="day.date" class="flex-1 flex flex-col items-center gap-8 group">
              <div class="flex items-end gap-2 w-full justify-center px-4 max-w-[60px] h-[120px] relative">
                <!-- Tooltip on hover -->
                <div class="chart-tooltip opacity-0 group-hover:opacity-100 transition-opacity absolute -top-32 bg-primary text-surface px-8 py-4 rounded-4 text-[10px] whitespace-nowrap z-10 shadow-lg pointer-events-none">
                  {{ day.wb }} WB + {{ day.oz }} OZ
                </div>

                <div
                  class="w-1/2 bg-brand rounded-t-4 transition-all duration-500"
                  :style="{ height: `${(day.wb / maxDailyTotal) * 100}%` }"
                />
                <div
                  class="w-1/2 bg-info rounded-t-4 transition-all duration-500"
                  :style="{ height: `${(day.oz / maxDailyTotal) * 100}%` }"
                />
              </div>
              <div class="text-[10px] font-bold text-muted text-center leading-tight">
                {{ formatDay(day.date) }}<br/>
                <span class="font-normal">{{ formatDate(day.date) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Table Section -->
      <div class="flex flex-col gap-12 flex-1 min-h-0">
        <div class="flex items-center justify-between px-4">
          <div class="flex items-center gap-16">
            <span class="text-sm font-bold text-primary">Товары в заказах</span>
            <input
              v-model="searchQuery"
              type="text"
              class="input input-sm min-w-[240px]"
              placeholder="Поиск по артикулу или названию..."
            />
          </div>
          <span class="text-xs text-muted">Показано позиций: {{ productGroupedStats.length }}</span>
        </div>

        <div class="table-outer border-dark rounded-12 overflow-hidden bg-surface flex-1 min-h-[300px]">
          <BaseTable
            :items="productGroupedStats"
            :columns="columns"
            :loading="loading"
            :row-height="70"
            max-height="400px"
          >
            <template #cell(image)="{ item }">
              <div class="w-[40px] h-[50px] bg-secondary rounded-6 overflow-hidden flex items-center justify-center mx-auto border-dark">
                <img v-if="item.image" :src="item.image" class="w-full h-full object-contain" />
                <span v-else class="text-[8px] text-muted font-bold">N/A</span>
              </div>
            </template>

            <template #cell(product)="{ item }">
              <div class="flex flex-col gap-2">
                <AppTableCell :value="item.name" bold size="sm" />
                <AppTableCell :value="`Артикул: ${item.art} | ID: ${item.idName}`" mono size="xs" color="muted" />
              </div>
            </template>

            <template #cell(total)="{ item }">
              <div class="flex flex-col items-center">
                <span class="text-lg font-black text-primary">{{ item.total }}</span>
                <div class="flex items-center gap-6 text-[10px] font-bold">
                  <span class="text-brand">{{ item.wb }}</span>
                  <span class="text-muted">/</span>
                  <span class="text-info">{{ item.oz }}</span>
                </div>
              </div>
            </template>

            <template #cell(daily)="{ item }">
              <div class="flex items-center gap-4 justify-end h-full py-8">
                <div
                  v-for="d in last7Days" :key="d"
                  class="flex flex-col items-center gap-2 group/day min-w-[32px]"
                >
                  <div class="flex flex-col gap-1 w-full px-2 items-center">
                    <div
                      v-if="item.daily[d]?.wb"
                      class="w-full h-8 bg-brand rounded-2"
                      :title="`${item.daily[d].wb} шт (WB)`"
                    />
                    <div
                      v-if="item.daily[d]?.oz"
                      class="w-full h-8 bg-info rounded-2"
                      :title="`${item.daily[d].oz} шт (Ozon)`"
                    />
                    <div v-if="!item.daily[d]" class="w-full h-4 bg-secondary rounded-2 opacity-30" />
                  </div>
                  <span class="text-[9px] text-muted font-mono">{{ item.daily[d]?.total || '-' }}</span>
                </div>
              </div>
            </template>
          </BaseTable>
        </div>
      </div>
    </div>
  </BaseDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseDialog from '@/components/ui/UnifiedUI.vue'
import BaseTable, { AppTableCell, type TableColumn } from '@/components/ui/BaseTable.vue'
import { marketplaceService } from '@/api/marketplaceService'
import type { MarketplaceStat } from '@/api/types'
import { exportToExcel } from '@/utils/excelExporter'

const props = defineProps<{ isOpen: boolean }>()
defineEmits<{ (e: 'update:isOpen', val: boolean): void }>()

const loading = ref(false), stats = ref<MarketplaceStat[]>([]), searchQuery = ref(''), filterMarketplace = ref<'ALL' | 'WB' | 'OZON'>('ALL')

const marketplaceOptions = [
  { label: 'Все МП', value: 'ALL' },
  { label: 'WB', value: 'WB' },
  { label: 'Ozon', value: 'OZON' }
]

interface GroupedProductStat {
  idName: number
  name: string
  art: string
  image: string | null
  total: number
  wb: number
  oz: number
  daily: Record<string, { total: number; wb: number; oz: number }>
}

const columns: TableColumn<GroupedProductStat>[] = [
  { key: 'image', label: 'Фото', width: '60px' },
  { key: 'product', label: 'Товар', minWidth: '200px' },
  { key: 'total', label: 'Итого', width: '100px', align: 'center' },
  { key: 'daily', label: 'Динамика (7 дн.)', minWidth: '280px', align: 'right' }
]

const last7Days = computed(() => {
  const dates = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
})

const fetchData = async () => {
  if (!props.isOpen) return
  loading.value = true
  try { stats.value = await marketplaceService.getWeeklyStats() }
  catch (e) { console.error(e) }
  finally { loading.value = false }
}

watch(() => props.isOpen, (val) => { if (val) fetchData() })

const filteredStats = computed(() => {
  let list = stats.value
  if (filterMarketplace.value !== 'ALL') {
    list = list.filter(s => s.marketplace === filterMarketplace.value)
  }
  return list
})

const weeklyTotal = computed(() => filteredStats.value.reduce((acc, s) => acc + s.qty, 0))
const weeklyWbTotal = computed(() => stats.value.filter(s => s.marketplace === 'WB').reduce((acc, s) => acc + s.qty, 0))
const weeklyOzTotal = computed(() => stats.value.filter(s => s.marketplace === 'OZON').reduce((acc, s) => acc + s.qty, 0))

const chartData = computed(() => {
  return last7Days.value.map(date => {
    const dayStats = stats.value.filter(s => s.date.split('T')[0] === date)
    return {
      date,
      wb: dayStats.filter(s => s.marketplace === 'WB').reduce((acc, s) => acc + s.qty, 0),
      oz: dayStats.filter(s => s.marketplace === 'OZON').reduce((acc, s) => acc + s.qty, 0)
    }
  })
})

const maxDailyTotal = computed(() => {
  const max = Math.max(...chartData.value.map(d => d.wb + d.oz), 1)
  return max * 1.1 // 10% padding
})

const productGroupedStats = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  const groups: Record<number, GroupedProductStat> = {}

  filteredStats.value.forEach(s => {
    if (q && !s.name.toLowerCase().includes(q) && !s.art.toLowerCase().includes(q)) return

    if (!groups[s.idName]) {
      groups[s.idName] = {
        idName: s.idName,
        name: s.name,
        art: s.art,
        image: s.image,
        total: 0,
        wb: 0,
        oz: 0,
        daily: {}
      }
    }

    const g = groups[s.idName]
    g.total += s.qty
    if (s.marketplace === 'WB') g.wb += s.qty
    else g.oz += s.qty

    const d = s.date.split('T')[0]
    if (!g.daily[d]) g.daily[d] = { total: 0, wb: 0, oz: 0 }
    g.daily[d].total += s.qty
    if (s.marketplace === 'WB') g.daily[d].wb += s.qty
    else g.daily[d].oz += s.qty
  })

  return Object.values(groups).sort((a, b) => b.total - a.total)
})

const formatDay = (dateStr: string) => {
  const days = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ']
  return days[new Date(dateStr).getDay()]
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  return `${d.getDate()}.${d.getMonth() + 1}`
}

const handleExport = () => {
  const data = productGroupedStats.value.map(p => ({
    'ID Name': p.idName,
    'Артикул': p.art,
    'Название': p.name,
    'Итого шт.': p.total,
    'WB шт.': p.wb,
    'Ozon шт.': p.oz,
    ...last7Days.value.reduce((acc, d) => {
      acc[`Отгрузка ${d}`] = p.daily[d]?.total || 0
      return acc
    }, {} as Record<string, number>)
  }))
  exportToExcel(data, `Sales_Stats_${new Date().toISOString().split('T')[0]}`)
}
</script>

<style scoped>
.chart-wrapper {
  background-image: linear-gradient(to right, var(--color-border-subtle) 1px, transparent 1px);
  background-size: calc(100% / 7) 100%;
}

.chart-tooltip {
  left: 50%;
  transform: translateX(-50%);
}

.chart-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -4px;
  border-width: 4px;
  border-style: solid;
  border-color: var(--color-text-primary) transparent transparent transparent;
}

.stat-card {
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}
</style>
