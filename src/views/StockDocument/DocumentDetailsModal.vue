<template>
  <BaseBottomSheet :is-open="isOpen" max-width="5xl" @update:is-open="close">
    <template #header>
      <div class="flex items-center gap-3">
        <StatusBadge :variant="getStatusVariant(status || '')">
          {{ status || 'Спецификация' }}
        </StatusBadge>
        <h3 class="m-0 text-xl font-bold text-primary">Накладная #{{ documentId }}</h3>
      </div>
    </template>

    <div v-if="loading" class="flex flex-col items-center justify-center p-8 text-muted gap-3">
      <div class="w-7 h-7 border-2 border-border border-t-primary rounded-full animate-spin"></div>
      <p class="text-sm font-medium text-secondary">Загружаем состав позиций...</p>
    </div>

    <div v-else class="bg-surface border border-border rounded shadow-sm overflow-hidden">
      <BaseTable :items="documentDetails" :columns="tableColumns">
        <template #cell(idName)="{ value }">
          <span class="font-mono text-xs text-muted font-semibold">#{{ value }}</span>
        </template>

        <template #cell(article)="{ value }">
          <span
            class="font-mono text-xs bg-secondary text-primary font-semibold px-2 py-0.5 rounded border border-border"
          >
            {{ value || '—' }}
          </span>
        </template>

        <template #cell(name)="{ value }">
          <div
            class="truncate max-w-md text-sm font-medium text-primary py-1"
            :title="value ? String(value) : undefined"
          >
            {{ value || 'Без названия' }}
          </div>
        </template>

        <template #cell(barcode)="{ value }">
          <span
            class="font-mono text-secondary text-xs tracking-wider bg-surface px-1.5 py-0.5 rounded border border-border/40"
          >
            {{ value || '—' }}
          </span>
        </template>

        <template #cell(qty)="{ value }">
          <span class="text-secondary font-medium text-xs tabular-nums">{{ value }} шт.</span>
        </template>

        <template #cell(qtyFact)="{ value }">
          <span
            class="text-success font-bold bg-success-subtle rounded px-2.5 py-1 text-xs tabular-nums border border-success/10"
          >
            {{ value }} шт.
          </span>
        </template>

        <template #cell(qtyDefect)="{ value }">
          <span
            v-if="Number(value) > 0"
            class="text-error font-bold bg-error-subtle rounded px-2.5 py-1 text-xs tabular-nums border border-error/10"
          >
            {{ value }} шт.
          </span>
          <span v-else class="text-border text-xs font-medium tabular-nums">0 шт.</span>
        </template>
      </BaseTable>
    </div>

    <template #footer>
      <BaseButton variant="secondary" @click="close">Закрыть окно</BaseButton>
    </template>
  </BaseBottomSheet>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { stockService, type StockDocumentDetailItem } from '@/api/stockService'
import { useAsync } from '@/composables/useAsync'
import BaseBottomSheet from '@/components/ui/BaseBottomSheet.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseTable, { type TableColumn } from '@/components/ui/BaseTable.vue'

const props = defineProps<{
  isOpen: boolean
  documentId: number | null
  modelType: 'FBO' | 'ORD'
  status: string | undefined // НОВЫЙ ПРОП СТАТУСА
}>()

const emit = defineEmits<{
  'update:isOpen': [value: boolean]
}>()

const documentDetails = ref<StockDocumentDetailItem[]>([])
const { loading, run } = useAsync()

const tableColumns = computed<TableColumn<StockDocumentDetailItem>[]>(() => {
  const baseCols: TableColumn<StockDocumentDetailItem>[] = [
    { key: 'idName', label: 'ID', width: '80px' },
    { key: 'article', label: 'Артикул', width: '130px' },
    { key: 'name', label: 'Наименование товара' },
    { key: 'barcode', label: 'Штрихкод', width: '150px' },
    { key: 'qty', label: 'План', width: '100px' },
    { key: 'qtyFact', label: 'Факт', width: '100px' },
  ]

  if (props.modelType === 'FBO') {
    baseCols.push({ key: 'qtyDefect', label: 'Брак', width: '100px' })
  }
  return baseCols
})

// Хелпер подбора цветов бейджа в зависимости от текстового статуса накладной
const getStatusVariant = (s: string): 'success' | 'info' | 'neutral' => {
  const l = (s || '').toLowerCase()
  if (l.includes('архив')) return 'neutral'
  if (l.includes('работе') || l.includes('готов')) return 'success'
  return 'info'
}

const loadDetails = () => {
  if (!props.documentId) return
  run(async () => {
    documentDetails.value = await stockService.getDocumentDetails(props.documentId!)
  })
}

watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal && props.documentId) {
      loadDetails()
    }
  },
)

const close = () => {
  emit('update:isOpen', false)
  documentDetails.value = []
}
</script>
