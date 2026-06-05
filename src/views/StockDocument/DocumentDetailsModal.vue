<template>
  <BaseBottomSheet :is-open="isOpen" max-width="5xl" @update:is-open="close">
    <template #header>
      <div class="flex items-center gap-12">
        <span :class="['badge', `badge--${getStatusVariant(status || '')}`]">
          {{ status || 'Спецификация' }}
        </span>
        <h3 class="m-0 text-xl font-bold text-primary">Накладная #{{ documentId }}</h3>
      </div>
    </template>

    <div v-if="loading" class="flex flex-col items-center justify-center p-32 text-muted gap-12">
      <div class="modal-spin-loader"></div>
      <p class="text-sm font-medium">Загружаем состав позиций...</p>
    </div>

    <div v-else class="card no-padding overflow-hidden">
      <BaseTable :items="documentDetails" :columns="tableColumns">
        <template #cell(idName)="{ value }">
          <span class="font-mono text-xs text-muted font-semibold">#{{ value }}</span>
        </template>

        <template #cell(article)="{ value }">
          <span
            class="font-mono text-xs font-semibold text-primary bg-secondary border-dark px-6 py-4 rounded-6"
          >
            {{ value || '—' }}
          </span>
        </template>

        <template #cell(name)="{ value }">
          <div
            class="text-sm font-semibold text-primary truncate max-w-md"
            :title="value ? String(value) : undefined"
          >
            {{ value || 'Без названия' }}
          </div>
        </template>

        <template #cell(barcode)="{ value }">
          <span
            class="font-mono text-xs text-muted bg-secondary border-dark px-6 py-4 rounded-6 tracking-wide"
          >
            {{ value || '—' }}
          </span>
        </template>

        <template #cell(qty)="{ value }">
          <span
            class="text-xs font-semibold text-warning bg-warning-subtle border-warning px-6 py-4 rounded-6 tabular-nums"
          >
            {{ value }} шт.
          </span>
        </template>

        <template #cell(qtyFact)="{ value }">
          <span
            class="text-xs font-bold text-success bg-success-subtle border-success px-6 py-4 rounded-6 tabular-nums"
          >
            {{ value }} шт.
          </span>
        </template>

        <template #cell(qtyDefect)="{ value }">
          <span
            v-if="Number(value) > 0"
            class="text-xs font-bold text-error bg-error-subtle border-error px-6 py-4 rounded-6 tabular-nums"
          >
            {{ value }} шт.
          </span>
          <span v-else class="text-muted text-xs font-medium tabular-nums">0 шт.</span>
        </template>
      </BaseTable>
    </div>

    <template #footer>
      <button class="btn btn-secondary" @click="close">Закрыть окно</button>
    </template>
  </BaseBottomSheet>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { stockService, type StockDocumentDetailItem } from '@/api/stockService'
import { useAsync } from '@/composables/useAsync'
import BaseBottomSheet from '@/components/ui/BaseBottomSheet.vue'
import BaseTable, { type TableColumn } from '@/components/ui/BaseTable.vue'

const props = defineProps<{
  isOpen: boolean
  documentId: number | null
  modelType: 'FBO' | 'ORD'
  status: string | undefined
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

<style scoped>
.no-padding {
  padding: 0 !important;
}
.border-dark {
  border: 1px solid var(--color-border-dark);
}
.border-success {
  border: 1px solid rgba(34, 197, 94, 0.1);
}
.border-error {
  border: 1px solid rgba(239, 68, 68, 0.1);
}
.px-6 {
  padding-left: var(--spacing-6);
  padding-right: var(--spacing-6);
}
.py-4 {
  padding-top: var(--spacing-4);
  padding-bottom: var(--spacing-4);
}
.px-8 {
  padding-left: var(--spacing-8);
  padding-right: var(--spacing-8);
}
.p-32 {
  padding: var(--spacing-32);
}

.modal-spin-loader {
  width: 28px;
  height: 28px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: var(--radius-full);
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.badge--neutral {
  background: rgba(113, 113, 122, 0.06);
  color: var(--color-text-secondary);
  border: 1px solid rgba(113, 113, 122, 0.08);
}
.badge--neutral::before {
  background: #71717a;
}
.badge--info {
  background: var(--color-primary-subtle);
  color: var(--color-primary);
  border: 1px solid rgba(79, 70, 229, 0.1);
}
.badge--info::before {
  background: var(--color-primary);
}
</style>
