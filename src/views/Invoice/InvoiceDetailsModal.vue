<template>
  <BaseModal :is-open="isOpen" variant="sheet" max-width="5xl" @update:is-open="close">
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

    <div v-else class="flex flex-col gap-24 py-12">
      <section class="w-full">
        <div class="flex items-start gap-16 w-full">
          <div class="input-group flex-shrink-0" style="width: 200px">
            <label class="input-label text-muted font-medium text-xs mb-6 block">
              {{ modelType === 'FBO' ? 'Планируемая дата прихода' : 'Планируемая дата отгрузки' }}
            </label>
            <input v-model="formHeader.eventDate" type="date" class="input w-full" />
          </div>

          <div v-if="modelType !== 'FBO'" class="input-group flex-shrink-0" style="width: 260px">
            <label class="input-label text-muted font-medium text-xs mb-6 block">
              Направление (Куда / Откуда)
            </label>
            <input
              v-model="formHeader.direction"
              type="text"
              placeholder="Коледино, Озон, г. Москва..."
              class="input w-full"
            />
          </div>

          <div class="input-group flex-1 textarea-container-wrapper">
            <label class="input-label text-muted font-medium text-xs mb-6 block">
              Техническое задание
            </label>
            <div class="textarea-relative-box" style="height: 38px">
              <textarea
                v-model="formHeader.comment"
                placeholder="Дополнительная информация для склада..."
                class="input absolute top-0 left-0 w-full expanding-textarea"
                rows="1"
              ></textarea>
            </div>
          </div>
        </div>

        <div class="flex justify-end border-t pt-12 mt-16">
          <button
            @click="saveHeaderChanges"
            :disabled="isSaving"
            class="btn btn-primary flex items-center gap-8"
          >
            <span v-if="isSaving" class="btn-spinner"></span>
            {{ isSaving ? 'Сохранение...' : 'Сохранить изменения' }}
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
            <template #cell(expirationDate)="{ item }: { item: any }">
              <span
                class="font-mono text-xs font-semibold text-primary bg-secondary border border-dark px-6 py-4 rounded-6 block text-center truncate"
              >
                {{ formatDate(item.expirationDate) }}
              </span>
            </template>

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
  </BaseModal>
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
import SharedProductTable from '@/components/ui/CatalogTable.vue'
import type { TableColumn } from '@/components/ui/BaseTable.vue'
import type { CatalogItem } from '@/api/catalogService'
import BaseModal from '@/components/ui/UnifiedUI.vue'

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

const getStatusVariant = (s: string): 'success' | 'info' | 'neutral' => {
  const l = (s || '').toLowerCase()
  if (l.includes('архив')) return 'neutral'
  if (l.includes('работе') || l.includes('готов')) return 'success'
  return 'info'
}

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const invoiceQtyColumns: TableColumn<CatalogItem>[] = [
  { key: 'qty' as keyof CatalogItem, label: 'План', width: '100px' },
  { key: 'qtyFact' as keyof CatalogItem, label: 'Факт', width: '100px' },
]

if (props.modelType === 'FBO') {
  invoiceQtyColumns.unshift({
    key: 'expirationDate' as keyof CatalogItem,
    label: 'Срок годности',
    width: '120px',
  })
  invoiceQtyColumns.push({ key: 'qtyDefect' as keyof CatalogItem, label: 'Брак', width: '100px' })
}

const formatDateForInput = (dateStr: string | null | undefined) =>
  dateStr ? dateStr.split('T')[0] : ''

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

<style scoped>
/* Стили плавного раскрытия ТЗ из InvoiceCreateModal */
.textarea-container-wrapper {
  position: relative;
  z-index: 20;
}
.textarea-container-wrapper:hover,
.textarea-container-wrapper:focus-within {
  z-index: 50;
}

.textarea-relative-box {
  position: relative;
  width: 100%;
}

.expanding-textarea {
  height: 38px;
  line-height: 1.4;
  padding-top: 8px;
  padding-bottom: 8px;
  resize: none;
  transition:
    height 0.2s ease-in-out,
    box-shadow 0.2s ease;
  z-index: 10;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  background-color: #fff;
}

.textarea-container-wrapper:hover .expanding-textarea:not(:placeholder-shown),
.expanding-textarea:focus {
  height: 130px;
  overflow-y: auto;
  white-space: normal;
  box-shadow:
    0 10px 25px rgba(0, 0, 0, 0.15),
    0 3px 10px rgba(0, 0, 0, 0.1);
}

.expanding-textarea::-webkit-scrollbar {
  width: 6px;
}
.expanding-textarea::-webkit-scrollbar-track {
  background: transparent;
}
.expanding-textarea::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}
.expanding-textarea::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
