<template>
  <BaseTable ref="baseTableRef" :items="items" :columns="mergedColumns" :loading="loading" :max-height="maxHeight" :row-height="rowHeight" @row-click="i => $emit('rowClick', i)">
    <template #cell(primaryImageURL)="{ item }">
      <div class="w-[20px] h-[30px] flex items-center justify-center bg-secondary rounded-4 overflow-hidden mx-auto">
        <img v-if="item.primaryImageURL" :src="String(item.primaryImageURL)" alt="Px" class="object-contain w-full h-full" />
        <span v-else class="text-[6px] text-muted">No</span>
      </div>
    </template>

    <template #cell(cArt)="{ item }"><AppTableCell :value="item.cArt" mono bold align="center" bg="secondary" border :px="6" :py="4" /></template>
    <template #cell(cArtWB)="{ item }"><AppTableCell :value="item.cArtWB" mono bold align="center" bg="secondary" border :px="6" :py="4" /></template>

    <template #cell(cName)="{ item }">
      <div class="flex flex-col min-w-0">
        <div class="flex items-center gap-6">
          <span class="text-sm font-semibold text-primary truncate" :title="String(item.cName || '')">{{ item.cName || '—' }}</span>
          <AppBadge v-if="item.isKit" variant="info" text="📦 Комплект" />
        </div>
        <span class="text-xs text-muted font-mono mt-4">ID: {{ item.idName }}</span>
      </div>
    </template>

    <template #cell(size)="{ item }"><AppTableCell :value="item.size" bold align="center" /></template>

    <template #cell(barcodes)="{ item }">
      <div v-if="item.barcodes?.length" class="flex flex-col gap-4 min-w-0 max-h-full overflow-hidden justify-center items-center py-4">
        <AppTableCell v-for="bc in item.barcodes" :key="String(bc)" :value="String(bc)" mono color="muted" bg="secondary" border :px="6" :py="2" />
      </div>
      <AppTableCell v-else value="—" color="muted" align="center" />
    </template>

    <template #cell(irQuant)="{ item }"><div class="flex justify-center"><AppBadge :variant="Number(item.irQuant || 0) > 0 ? 'success' : 'neutral'" :text="formatQuantity(Number(item.irQuant || 0))" /></div></template>
    <template #cell(iBronTask)="{ item }"><div class="flex justify-center"><AppBadge v-if="Number(item.iBronTask || 0) > 0" variant="warning" :text="formatQuantity(Number(item.iBronTask || 0))" /><AppTableCell v-else value="—" color="muted" align="center" /></div></template>
    <template #cell(defectQuant)="{ item }"><div class="flex justify-center"><AppBadge :variant="Number(item.defectQuant || 0) > 0 ? 'error' : 'neutral'" :text="formatQuantity(Number(item.defectQuant || 0))" /></div></template>

    <template v-for="(_, n) in $slots" :key="n" #[n]="d"><slot :name="n" v-bind="d || {}" /></template>
  </BaseTable>
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
import { ref, computed } from 'vue'
import BaseTable, { AppBadge, AppTableCell, type TableColumn, type TableExposed } from './BaseTable.vue'
import { formatQuantity } from '@/utils/formatters'

const props = withDefaults(defineProps<{
  items: T[]; loading?: boolean; maxHeight?: string; rowHeight?: number; extraColumns?: TableColumn<T>[]; hideColumns?: string[]
}>(), { loading: false, rowHeight: 65, extraColumns: () => [], hideColumns: () => [] })

defineEmits<{ (e: 'rowClick', item: T): void }>()
const baseTableRef = ref<TableExposed | null>(null)
const baseColumns: TableColumn<T>[] = [
  { key: 'primaryImageURL', label: 'Фото', width: '40px' },
  { key: 'cArt', label: 'Артикул', sortable: true, filterable: true, minWidth: '80px' },
  { key: 'cArtWB', label: 'Арт. WB', sortable: true, filterable: true, minWidth: '80px' },
  { key: 'cName', label: 'Название товара', sortable: true, filterable: true, minWidth: '150px' },
  { key: 'size', label: 'Размер', sortable: true, filterable: true, minWidth: '60px' },
  { key: 'barcodes', label: 'Штрихкод(ы)', filterable: true, minWidth: '110px' },
  { key: 'irQuant', label: 'Доступно', sortable: true, minWidth: '80px' },
  { key: 'iBronTask', label: 'В резерве', sortable: true, minWidth: '80px' },
  { key: 'defectQuant', label: 'Брак', sortable: true, minWidth: '70px' },
]

const mergedColumns = computed(() => [...baseColumns.filter(c => !props.hideColumns.includes(String(c.key))), ...props.extraColumns] as TableColumn<T>[])
defineExpose({ triggerExcelExport: (n: string) => baseTableRef.value?.triggerExcelExport(n), setScrollTop: (t: number) => baseTableRef.value?.setScrollTop(t) })
</script>
