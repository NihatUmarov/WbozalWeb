<template>
  <BaseTable
    :items="items as unknown as Record<string, unknown>[]"
    :columns="mergedColumns as unknown as TableColumn<Record<string, unknown>>[]"
    :loading="loading"
    :max-height="maxHeight"
  >
    <template #cell(primaryImageURL)="{ item }: { item: any }">
      <div
        class="w-40 h-40 flex items-center justify-center bg-secondary rounded-6 overflow-hidden"
      >
        <img
          v-if="(item as CatalogItem).primaryImageURL"
          :src="(item as CatalogItem).primaryImageURL!"
          alt="Товар"
          class="object-contain w-full h-full"
        />
        <span v-else class="text-[10px] text-muted">No px</span>
      </div>
    </template>

    <template #cell(cArt)="{ item }: { item: any }">
      <span
        class="font-mono text-xs font-semibold text-primary bg-secondary border-dark px-6 py-4 rounded-6"
      >
        {{ (item as CatalogItem).cArt || '—' }}
      </span>
    </template>

    <template #cell(cArtWB)="{ item }: { item: any }">
      <span
        class="font-mono text-xs font-semibold text-primary bg-secondary border-dark px-6 py-4 rounded-6"
      >
        {{ (item as CatalogItem).cArtWB || '—' }}
      </span>
    </template>

    <template #cell(cName)="{ item }: { item: any }">
      <div class="flex flex-col min-w-0">
        <span
          class="text-sm font-semibold text-primary truncate max-w-md"
          :title="(item as CatalogItem).cName || ''"
        >
          {{ (item as CatalogItem).cName || 'Без названия' }}
        </span>
        <span class="text-xs text-muted font-mono mt-4"
          >ID: {{ (item as CatalogItem).idName }}</span
        >
      </div>
    </template>

    <template #cell(size)="{ item }: { item: any }">
      <span class="text-sm font-medium text-primary">{{ (item as CatalogItem).size || '—' }}</span>
    </template>

    <template #cell(barcodes)="{ item }: { item: any }">
      <div v-if="(item as CatalogItem).barcodes?.length" class="flex flex-wrap gap-4 max-w-xs">
        <span
          v-for="bc in (item as CatalogItem).barcodes"
          :key="bc"
          class="font-mono text-xs text-muted bg-secondary border-dark px-6 py-4 rounded-6 tracking-wide"
        >
          {{ bc }}
        </span>
      </div>
      <span
        v-else-if="(item as CatalogItem).barcode"
        class="font-mono text-xs text-muted bg-secondary border-dark px-6 py-4 rounded-6 tracking-wide"
      >
        {{ (item as CatalogItem).barcode }}
      </span>
      <span v-else class="text-muted text-xs font-medium font-mono">—</span>
    </template>

    <template #cell(irQuant)="{ item }: { item: any }">
      <span
        :class="[
          'text-xs font-bold px-6 py-4 rounded-6 tabular-nums',
          (item as CatalogItem).irQuant > 0
            ? 'text-success bg-success-subtle border-success'
            : 'text-muted',
        ]"
      >
        {{ (item as CatalogItem).irQuant > 0 ? `${(item as CatalogItem).irQuant} шт.` : '0 шт.' }}
      </span>
    </template>

    <template #cell(iBronTask)="{ item }: { item: any }">
      <span
        v-if="(item as CatalogItem).iBronTask > 0"
        class="text-xs font-semibold text-warning bg-warning-subtle border-warning px-6 py-4 rounded-6 tabular-nums"
      >
        {{ (item as CatalogItem).iBronTask }} шт.
      </span>
      <span v-else class="text-muted text-xs font-medium tabular-nums">—</span>
    </template>

    <template #cell(defectQuant)="{ item }: { item: any }">
      <span
        :class="[
          'text-xs font-bold px-6 py-4 rounded-6 tabular-nums',
          ((item as CatalogItem).defectQuant ?? 0) > 0
            ? 'text-error bg-error-subtle border-error'
            : 'text-muted',
        ]"
      >
        {{
          ((item as CatalogItem).defectQuant ?? 0) > 0
            ? `${(item as CatalogItem).defectQuant} шт.`
            : '0 шт.'
        }}
      </span>
    </template>

    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps || {}"></slot>
    </template>
  </BaseTable>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseTable from './BaseTable.vue' // <-- ИМПОРТ ИСПРАВЛЕН (компоненты в одной папке ui/)
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

const baseColumns: TableColumn<CatalogItem>[] = [
  { key: 'primaryImageURL' as keyof CatalogItem, label: 'Фото', width: '80px', minWidth: '80px' },
  {
    key: 'cArt' as keyof CatalogItem,
    label: 'Артикул',
    sortable: true,
    filterable: true,
    width: '115px',
  },
  {
    key: 'cArtWB' as keyof CatalogItem,
    label: 'Арт. WB',
    sortable: true,
    filterable: true,
    width: '110px',
  },
  {
    key: 'cName' as keyof CatalogItem,
    label: 'Название товара',
    sortable: true,
    filterable: true,
    minWidth: '220px',
  },
  {
    key: 'size' as keyof CatalogItem,
    label: 'Размер',
    sortable: true,
    filterable: true,
    width: '110px',
  },
  { key: 'barcodes' as keyof CatalogItem, label: 'Штрихкод(ы)', filterable: true, width: '130px' },
  { key: 'irQuant' as keyof CatalogItem, label: 'Доступно', sortable: true, width: '120px' },
  { key: 'iBronTask' as keyof CatalogItem, label: 'В резерве', sortable: true, width: '120px' },
  { key: 'defectQuant' as keyof CatalogItem, label: 'Брак', sortable: true, width: '110px' },
]

const mergedColumns = computed(() => {
  const filteredBase = baseColumns.filter((c) => !props.hideColumns.includes(String(c.key)))
  return [...filteredBase, ...props.extraColumns]
})
</script>
