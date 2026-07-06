<template>
  <BaseBottomSheet :is-open="isOpen" max-width="7xl" @update:is-open="close">
    <template #header>
      <div class="flex items-center gap-12">
        <span :class="['badge', `badge--${getStatusVariant(status || '')}`]">
          {{ status || 'Спецификация' }}
        </span>
        <h3 class="m-0 text-xl font-bold text-primary">Накладная #{{ documentId }}</h3>
      </div>
    </template>

    <div
      v-if="loading || headerLoading"
      class="flex flex-col items-center justify-center p-32 text-muted gap-12 py-40"
    >
      <div class="modal-spin-loader"></div>
      <p class="text-sm font-medium">Загружаем данные документа...</p>
    </div>

    <div v-else class="flex flex-col gap-32 py-12">
      <section class="flex flex-col gap-16">
        <div class="pb-8 border-b flex items-center justify-between">
          <h3 class="text-lg font-bold text-primary m-0">Основная информация</h3>
          <span class="text-xs font-mono text-muted bg-secondary px-8 py-4 rounded-4">
            Дата и время создания: {{ formatDateTime(headerData?.ts) }}
          </span>
        </div>

        <div class="grid-3 gap-20">
          <div class="input-group">
            <label class="input-label text-muted font-medium text-xs mb-6 block">
              {{ modelType === 'FBO' ? 'Планируемая дата прихода' : 'Планируемая дата отгрузки' }}
            </label>
            <input v-model="formHeader.eventDate" type="date" class="input" />
          </div>

          <div v-if="modelType !== 'FBO'" class="input-group">
            <label class="input-label text-muted font-medium text-xs mb-6 block"
              >Направление (Куда / Откуда)</label
            >
            <input
              v-model="formHeader.direction"
              type="text"
              placeholder="Коледино, Озон, г. Москва..."
              class="input"
            />
          </div>

          <div class="input-group" :class="{ 'col-span-2': modelType === 'FBO' }">
            <label class="input-label text-muted font-medium text-xs mb-6 block"
              >Техническое задание</label
            >
            <input
              v-model="formHeader.comment"
              type="text"
              placeholder="Дополнительная информация для склада..."
              class="input"
            />
          </div>
        </div>

        <div class="flex justify-end border-t pt-12">
          <button
            @click="saveHeaderChanges"
            :disabled="isSaving"
            class="btn btn-primary flex items-center gap-8"
          >
            <span v-if="isSaving" class="btn-spinner"></span>
            {{ isSaving ? 'Сохранение...' : 'Сохранить' }}
          </button>
        </div>
      </section>

      <section class="flex flex-col gap-16">
        <div class="pb-8 border-b">
          <h3 class="text-lg font-bold text-primary m-0">Состав позиций накладной</h3>
        </div>

        <div class="card no-padding overflow-hidden">
          <SharedProductTable
            :items="documentDetails as any"
            :loading="loading"
            :hide-columns="
              modelType !== 'FBO'
                ? ['defectQuant', 'irQuant', 'iBronTask']
                : ['irQuant', 'iBronTask']
            "
            :extra-columns="invoiceQtyColumns"
          >
            <template #cell(qty)="{ item }: { item: any }">
              <span
                class="text-xs font-semibold text-warning bg-warning-subtle border-warning px-6 py-4 rounded-6 tabular-nums"
              >
                {{ item.qty }} шт.
              </span>
            </template>
            <template #cell(qtyFact)="{ item }: { item: any }">
              <span
                class="text-xs font-bold text-success bg-success-subtle border-success px-6 py-4 rounded-6 tabular-nums"
              >
                {{ item.qtyFact }} шт.
              </span>
            </template>
            <template #cell(qtyDefect)="{ item }: { item: any }">
              <span
                v-if="Number(item.qtyDefect) > 0"
                class="text-xs font-bold text-error bg-error-subtle border-error px-6 py-4 rounded-6 tabular-nums"
              >
                {{ item.qtyDefect }} шт.
              </span>
              <span v-else class="text-muted text-xs font-medium tabular-nums">0 шт.</span>
            </template>
          </SharedProductTable>
        </div>
      </section>
    </div>
  </BaseBottomSheet>
</template>

<script setup lang="ts">
import { ref, watch, reactive } from 'vue'
import {
  stockService,
  type StockDocumentDetailItem,
  type InvoiceHeaderData,
} from '@/api/InvoiceService'
import { useAsync } from '@/composables/useAsync'
import { useToast } from '@/composables/useToast'
import BaseBottomSheet from '@/components/ui/BaseBottomSheet.vue'
import SharedProductTable from '@/components/ui/SharedProductTable.vue'
import type { TableColumn } from '@/components/ui/BaseTable.vue'
import type { CatalogItem } from '@/api/catalogService'

const props = defineProps<{
  isOpen: boolean
  documentId: number | null
  modelType: 'FBO' | 'ORD' | 'DEF'
  status: string | undefined
}>()

const emit = defineEmits<{ 'update:isOpen': [value: boolean]; saved: [] }>()
const toast = useToast()

const documentDetails = ref<StockDocumentDetailItem[]>([])
const headerData = ref<InvoiceHeaderData | null>(null)
const formHeader = reactive({ eventDate: '', direction: '', comment: '' })

const { loading, run } = useAsync()
const { loading: isSaving, run: runSaveHeader } = useAsync()
const headerLoading = ref(false)

// Специфичные для накладной колонки количеств (План / Факт)
const invoiceQtyColumns: TableColumn<CatalogItem>[] = [
  { key: 'qty' as keyof CatalogItem, label: 'План', width: '100px' },
  { key: 'qtyFact' as keyof CatalogItem, label: 'Факт', width: '100px' },
]

if (props.modelType === 'FBO') {
  invoiceQtyColumns.push({ key: 'qtyDefect' as keyof CatalogItem, label: 'Брак', width: '100px' })
}

const getStatusVariant = (s: string): 'success' | 'info' | 'neutral' => {
  const l = (s || '').toLowerCase()
  if (l.includes('архив')) return 'neutral'
  if (l.includes('работе') || l.includes('готов')) return 'success'
  return 'info'
}

const formatDateForInput = (dateStr: string | null | undefined) =>
  dateStr ? dateStr.split('T')[0] : ''

const formatDateTime = (dateStr: string | null | undefined) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const loadDetails = async () => {
  if (!props.documentId) return
  headerLoading.value = true
  try {
    const header = await stockService.getInvoiceHeader(props.documentId)
    headerData.value = header
    formHeader.eventDate = formatDateForInput(header.eventDate)
    formHeader.direction = header.direction || ''
    formHeader.comment = header.comment || ''
  } catch {
    toast.error('Не удалось загрузить данные шапки документа')
  } finally {
    headerLoading.value = false
  }

  run(async () => {
    documentDetails.value = await stockService.getDocumentDetails(props.documentId!)
  })
}

const saveHeaderChanges = async () => {
  if (!props.documentId) return
  runSaveHeader(
    async () => {
      await stockService.updateInvoiceHeader({
        idRSIncome: props.documentId!,
        direction: props.modelType !== 'FBO' ? formHeader.direction : null,
        eventDate: formHeader.eventDate ? formHeader.eventDate : null,
        comment: formHeader.comment,
      })
      if (headerData.value) {
        headerData.value.direction = formHeader.direction
        headerData.value.eventDate = formHeader.eventDate
        headerData.value.comment = formHeader.comment
      }
      emit('saved')
    },
    { toast, successMessage: 'Шапка документа успешно обновлена!' },
  )
}

watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal && props.documentId) loadDetails()
  },
)

const close = () => {
  emit('update:isOpen', false)
  documentDetails.value = []
  headerData.value = null
  Object.assign(formHeader, { eventDate: '', direction: '', comment: '' })
}
</script>
