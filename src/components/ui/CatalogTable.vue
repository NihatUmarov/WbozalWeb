<template>
  <BaseTable :items="items" :columns="mergedColumns" :loading="loading" :max-height="maxHeight">
    <template #cell(primaryImageURL)="{ item }">
      <div
        class="w-full aspect-square max-w-[64px] max-h-[64px] flex items-center justify-center bg-secondary rounded-6 overflow-hidden mx-auto"
      >
        <img
          v-if="item.primaryImageURL"
          :src="item.primaryImageURL"
          alt="Товар"
          class="object-contain w-full h-full"
        />
        <span v-else class="text-[10px] text-muted">No px</span>
      </div>
    </template>

    <template #cell(cArt)="{ item }">
      <span
        class="font-mono text-xs font-semibold text-primary bg-secondary border-dark px-6 py-4 rounded-6 block text-center truncate"
        >{{ item.cArt || '—' }}</span
      >
    </template>

    <template #cell(cArtWB)="{ item }">
      <span
        class="font-mono text-xs font-semibold text-primary bg-secondary border-dark px-6 py-4 rounded-6 block text-center truncate"
        >{{ item.cArtWB || '—' }}</span
      >
    </template>

    <template #cell(cName)="{ item }">
      <div class="flex flex-col min-w-0">
        <span class="text-sm font-semibold text-primary truncate" :title="item.cName || ''">{{
          item.cName || 'Без названия'
        }}</span>
        <span class="text-xs text-muted font-mono mt-4">ID: {{ item.idName }}</span>
      </div>
    </template>

    <template #cell(size)="{ item }">
      <span class="text-sm font-medium text-primary block text-center truncate">{{
        item.size || '—'
      }}</span>
    </template>

    <template #cell(barcodes)="{ item }">
      <div v-if="item.barcodes?.length" class="flex flex-wrap gap-4 min-w-0">
        <span
          v-for="bc in item.barcodes"
          :key="bc"
          class="font-mono text-xs text-muted bg-secondary border-dark px-6 py-4 rounded-6 tracking-wide truncate"
          >{{ bc }}</span
        >
      </div>
      <span
        v-else-if="item.barcode"
        class="font-mono text-xs text-muted bg-secondary border-dark px-6 py-4 rounded-6 tracking-wide block text-center truncate"
        >{{ item.barcode }}</span
      >
      <span v-else class="text-muted text-xs font-medium font-mono block text-center">—</span>
    </template>

    <template #cell(irQuant)="{ item }">
      <span
        :class="[
          'text-xs font-bold px-6 py-4 rounded-6 tabular-nums block text-center truncate',
          item.irQuant > 0 ? 'text-success bg-success-subtle border-success' : 'text-muted',
        ]"
      >
        {{ item.irQuant > 0 ? `${item.irQuant} шт.` : '0 шт.' }}
      </span>
    </template>

    <template #cell(iBronTask)="{ item }">
      <span
        v-if="item.iBronTask > 0"
        class="text-xs font-semibold text-warning bg-warning-subtle border-warning px-6 py-4 rounded-6 tabular-nums block text-center truncate"
        >{{ item.iBronTask }} шт.</span
      >
      <span v-else class="text-muted text-xs font-medium tabular-nums block text-center">—</span>
    </template>

    <template #cell(defectQuant)="{ item }">
      <span
        :class="[
          'text-xs font-bold px-6 py-4 rounded-6 tabular-nums block text-center truncate',
          (item.defectQuant ?? 0) > 0 ? 'text-error bg-error-subtle border-error' : 'text-muted',
        ]"
      >
        {{ (item.defectQuant ?? 0) > 0 ? `${item.defectQuant} шт.` : '0 шт.' }}
      </span>
    </template>

    <template v-for="(_, name) in $slots as Record<string, any>" :key="name" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps || {}"></slot>
    </template>
  </BaseTable>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseTable from './BaseTable.vue'
import type { TableColumn } from './BaseTable.vue'
import type { CatalogItem } from '@/api/catalogService'

const props = withDefaults(
  defineProps<{
    items: CatalogItem[]
    loading?: boolean
    maxHeight?: string
    extraColumns?: TableColumn<CatalogItem>[]
    hideColumns?: string[]
  }>(),
  {
    loading: false,
    extraColumns: () => [],
    hideColumns: () => [],
  },
)

// Убрали жесткие width. Оставили только minWidth и ширину для Фото
const baseColumns: TableColumn<CatalogItem>[] = [
  { key: 'primaryImageURL', label: 'Фото', width: '70px', minWidth: '70px' },
  { key: 'cArt', label: 'Артикул', sortable: true, filterable: true, minWidth: '100px' },
  { key: 'cArtWB', label: 'Арт. WB', sortable: true, filterable: true, minWidth: '100px' },
  { key: 'cName', label: 'Название товара', sortable: true, filterable: true, minWidth: '180px' },
  { key: 'size', label: 'Размер', sortable: true, filterable: true, minWidth: '80px' },
  { key: 'barcodes', label: 'Штрихкод(ы)', filterable: true, minWidth: '130px' },
  { key: 'irQuant', label: 'Доступно', sortable: true, minWidth: '100px' },
  { key: 'iBronTask', label: 'В резерве', sortable: true, minWidth: '100px' },
  { key: 'defectQuant', label: 'Брак', sortable: true, minWidth: '90px' },
]

const mergedColumns = computed(() => {
  const filteredBase = baseColumns.filter((c) => !props.hideColumns.includes(String(c.key)))
  return [...filteredBase, ...props.extraColumns]
})
</script>
