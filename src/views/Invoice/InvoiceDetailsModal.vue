<template>
  <BaseModal :is-open="isOpen" variant="sheet" max-width="7xl" @update:is-open="close">
    <template #header>
      <div class="flex items-center gap-12">
        <AppBadge :variant="getStatusVariant(status)" :text="status || 'Спецификация'" />
        <h3 class="m-0 text-xl font-bold text-primary">Накладная #{{ documentId }}</h3>
      </div>
    </template>

    <div v-if="loading || headerLoading" class="flex flex-col items-center justify-center p-32 text-muted gap-12 py-40">
      <div class="modal-spin-loader" />
      <p class="text-sm font-medium">Загружаем данные документа...</p>
    </div>

    <div v-else class="flex flex-col gap-24 py-12">
      <section class="w-full">
        <InvoiceHeaderFields v-model="formHeader" :model-type="modelType" />
        <div class="flex justify-end border-t pt-12 mt-16">
          <button @click="saveHeaderChanges" :disabled="isSaving" class="btn btn-primary flex items-center gap-8">
            <span v-if="isSaving" class="btn-spinner" />
            {{ isSaving ? 'Сохранение...' : 'Сохранить изменения' }}
          </button>
        </div>
      </section>

      <section class="flex flex-col gap-16">
        <div class="pb-8 border-b"><h3 class="text-lg font-bold text-primary m-0">Состав позиций накладной</h3></div>
        <div class="card no-padding overflow-hidden">
          <SharedProductTable :items="documentDetails" :loading="loading" :hide-columns="modelType !== 'FBO' ? ['defectQuant', 'irQuant', 'iBronTask'] : ['irQuant', 'iBronTask']" :extra-columns="invoiceQtyColumns">
            <template #cell(expirationDate)="{ item }"><AppTableCell :value="formatDate(item.expirationDate)" mono bold bg="secondary" border :px="6" :py="4" align="center" /></template>
            <template #cell(qty)="{ item }"><div class="flex justify-center"><AppBadge variant="warning" :text="formatQuantity(item.qty)" /></div></template>
            <template #cell(qtyFact)="{ item }"><div class="flex justify-center"><AppBadge variant="success" :text="formatQuantity(item.qtyFact)" /></div></template>
            <template #cell(qtyDefect)="{ item }"><div class="flex justify-center"><AppBadge :variant="Number(item.qtyDefect) > 0 ? 'error' : 'neutral'" :text="formatQuantity(item.qtyDefect)" /></div></template>
          </SharedProductTable>
        </div>
      </section>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch, reactive, computed } from 'vue'
import { stockService, type StockDocumentDetailItem, type InvoiceHeaderData } from '@/api/InvoiceService'
import { useAsync } from '@/composables/useAsync'
import { useToast } from '@/composables/useToast'
import { formatDate, formatQuantity } from '@/utils/formatters'
import { getStatusVariant } from '@/utils/ui-helpers'
import InvoiceHeaderFields from '@/components/ui/InvoiceHeaderForm.vue'
import SharedProductTable from '@/components/ui/ProductTable.vue'
import { AppBadge, AppTableCell, type TableColumn } from '@/components/ui/BaseTable.vue'
import BaseModal from '@/components/ui/UnifiedUI.vue'

const props = defineProps<{ isOpen: boolean; documentId: number | null; modelType: 'FBO' | 'ORD' | 'DEF'; status: string | undefined }>()
const emit = defineEmits<{ 'update:isOpen': [value: boolean]; saved: [] }>()
const toast = useToast(), documentDetails = ref<StockDocumentDetailItem[]>([]), headerData = ref<InvoiceHeaderData | null>(null), formHeader = reactive({ eventDate: '', direction: '', comment: '' })
const { loading, run } = useAsync(), { loading: isSaving, run: runSaveHeader } = useAsync(), headerLoading = ref(false)

const invoiceQtyColumns = computed<TableColumn<StockDocumentDetailItem>[]>(() => {
  const cols: TableColumn<StockDocumentDetailItem>[] = []
  if (props.modelType === 'FBO') cols.push({ key: 'expirationDate', label: 'Срок годности', width: '120px' })
  cols.push({ key: 'qty', label: 'План', width: '100px' }, { key: 'qtyFact', label: 'Факт', width: '100px' })
  if (props.modelType === 'FBO') cols.push({ key: 'qtyDefect', label: 'Брак', width: '100px' })
  return cols
})

const loadDetails = async () => {
  if (!props.documentId) return
  headerLoading.value = true
  try {
    const h = await stockService.getInvoiceHeader(props.documentId)
    headerData.value = h; Object.assign(formHeader, { eventDate: h.eventDate?.split('T')[0] || '', direction: h.direction || '', comment: h.comment || '' })
  } catch { toast.error('Не удалось загрузить данные шапки документа') } finally { headerLoading.value = false }
  run(async () => documentDetails.value = await stockService.getDocumentDetails(props.documentId!))
}

const saveHeaderChanges = async () => {
  if (!props.documentId) return
  runSaveHeader(async () => {
    await stockService.updateInvoiceHeader({ idRSIncome: props.documentId!, direction: props.modelType !== 'FBO' ? formHeader.direction : null, eventDate: formHeader.eventDate || null, comment: formHeader.comment })
    if (headerData.value) Object.assign(headerData.value, formHeader)
    emit('saved')
  }, { toast, successMessage: 'Шапка документа успешно обновлена!' })
}

watch(() => props.isOpen, v => { if (v && props.documentId) loadDetails() })
const close = () => { emit('update:isOpen', false); documentDetails.value = []; headerData.value = null; Object.assign(formHeader, { eventDate: '', direction: '', comment: '' }) }
</script>
