<template>
  <BaseTable
    ref="baseTableRef"
    :items="items"
    :columns="mergedColumns"
    :loading="loading"
    :max-height="maxHeight"
    :row-height="rowHeight"
    @row-click="(item) => $emit('rowClick', item as T)"
  >
    <!-- 1. Изображение -->
    <template #cell(primaryImageURL)="{ item }">
      <div
        class="w-full aspect-square max-w-[64px] max-h-[64px] flex items-center justify-center bg-secondary rounded-6 overflow-hidden mx-auto"
      >
        <img
          v-if="(item as any).primaryImageURL"
          :src="String((item as any).primaryImageURL)"
          alt="Товар"
          class="object-contain w-full h-full"
        />
        <span v-else class="text-[10px] text-muted">No px</span>
      </div>
    </template>

    <!-- 2. Артикул -->
    <template #cell(cArt)="{ item }">
      <AppTableCell :value="(item as any).cArt" mono bold align="center" bg="secondary" border :px="6" :py="4" />
    </template>

    <!-- 3. Артикул WB -->
    <template #cell(cArtWB)="{ item }">
      <AppTableCell
        :value="(item as any).cArtWB"
        mono
        bold
        align="center"
        bg="secondary"
        border
        :px="6"
        :py="4"
      />
    </template>

    <!-- 4. Название товара -->
    <template #cell(cName)="{ item }">
      <div class="flex flex-col min-w-0">
        <div class="flex items-center gap-6">
          <span
            class="text-sm font-semibold text-primary truncate"
            :title="String((item as any).cName || '')"
            >{{ (item as any).cName || 'Без названия' }}</span
          >
          <AppBadge v-if="(item as any).isKit" variant="info" text="📦 Комплект" />
        </div>
        <span class="text-xs text-muted font-mono mt-4">ID: {{ (item as any).idName }}</span>
      </div>
    </template>

    <!-- 5. Размер -->
    <template #cell(size)="{ item }">
      <AppTableCell :value="(item as any).size" bold align="center" />
    </template>

    <!-- 6. Штрихкоды -->
    <template #cell(barcodes)="{ item }">
      <div
        v-if="item.barcodes?.length"
        class="flex flex-wrap gap-4 min-w-0"
      >
        <AppTableCell
          v-for="bc in (item.barcodes as string[])"
          :key="String(bc)"
          :value="String(bc)"
          mono
          color="muted"
          bg="secondary"
          border
          :px="6"
          :py="4"
        />
      </div>
      <AppTableCell v-else value="—" color="muted" align="center" />
    </template>

    <!-- 7. Доступно (irQuant) -->
    <template #cell(irQuant)="{ item }">
      <div class="flex justify-center">
        <AppBadge
          :variant="Number((item as any).irQuant || 0) > 0 ? 'success' : 'neutral'"
          :text="formatQuantity((item as any).irQuant as number)"
        />
      </div>
    </template>

    <!-- 8. В резерве (iBronTask) -->
    <template #cell(iBronTask)="{ item }">
      <div class="flex justify-center">
        <AppBadge
          v-if="Number((item as any).iBronTask || 0) > 0"
          variant="warning"
          :text="formatQuantity((item as any).iBronTask as number)"
        />
        <AppTableCell v-else value="—" color="muted" align="center" />
      </div>
    </template>

    <!-- 9. Брак (defectQuant) -->
    <template #cell(defectQuant)="{ item }">
      <div class="flex justify-center">
        <AppBadge
          :variant="Number((item as any).defectQuant || 0) > 0 ? 'error' : 'neutral'"
          :text="formatQuantity((item as any).defectQuant as number)"
        />
      </div>
    </template>

    <!-- Динамический проброс внешних слотов -->
    <template
      v-for="(_, name) in $slots as Record<string, unknown>"
      :key="name"
      #[name]="slotProps"
    >
      <slot :name="name" v-bind="slotProps || {}"></slot>
    </template>
  </BaseTable>
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
import { ref, computed, type ComponentPublicInstance } from 'vue'
import BaseTable, { AppBadge, AppTableCell, type TableColumn } from './BaseTable.vue'
import { formatQuantity } from '@/utils/formatters'
import type { Product } from '@/api/types'

const props = withDefaults(
  defineProps<{
    items: T[]
    loading?: boolean
    maxHeight?: string
    rowHeight?: number
    extraColumns?: TableColumn<T>[]
    hideColumns?: string[]
  }>(),
  {
    loading: false,
    rowHeight: 90,
    extraColumns: () => [],
    hideColumns: () => [],
  },
)

defineEmits<{
  (e: 'rowClick', item: T): void
}>()

interface BaseTableExpose {
  triggerExcelExport: (fileName: string) => void
  getScrollTop: () => number
  setScrollTop: (top: number) => void
}

const baseTableRef = ref<(ComponentPublicInstance & BaseTableExpose) | null>(null)

const baseColumns: TableColumn<Product>[] = [
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

const mergedColumns = computed<TableColumn<T>[]>(() => {
  const filteredBase = baseColumns.filter((c) => !props.hideColumns.includes(String(c.key))) as unknown as TableColumn<T>[]
  return [...filteredBase, ...props.extraColumns]
})

defineExpose({
  triggerExcelExport: (fileName: string) => baseTableRef.value?.triggerExcelExport(fileName),
  getScrollTop: () => baseTableRef.value?.getScrollTop() ?? 0,
  setScrollTop: (top: number) => baseTableRef.value?.setScrollTop(top),
})
</script>
