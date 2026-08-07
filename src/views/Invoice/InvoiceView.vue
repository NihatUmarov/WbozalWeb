<template>
  <BaseDataPage
    title="Накладные" :items="documents" :columns="columns" :loading="isLoadingDocs" :tabs="tabs" :current-tab="currentModel"
    :row-class="i => i.model === 'DEF' ? 'row-defect' : ''"
    @tab-change="v => { currentModel = v as DocModel; fetchDocuments() }"
    @row-click="i => openDetails(i.id)"
  >
    <template #header-actions>
      <div class="flex items-center gap-12">
        <button v-if="['FBO', 'ORD'].includes(currentModel) && permissions.invoice" class="btn btn-primary" @click="showCreatePanel = true">
          + Создать {{ currentModel === 'FBO' ? 'приход' : 'отгрузку' }}
        </button>
        <label class="toggle"><input type="checkbox" v-model="filterArchive" @change="fetchDocuments" /><div class="toggle-track" /><span>Архив</span></label>
      </div>
    </template>

    <template #cell(id)="{ value, item }">
      <div class="flex items-center gap-6">
        <div class="flex items-center gap-2 bg-secondary border border-dark px-8 py-2 rounded-6 font-mono text-[11px]">
          <span class="text-muted">#</span>
          <span class="font-bold text-primary">{{ value }}</span>
        </div>
        <AppBadge v-if="item.model === 'DEF'" variant="error" text="Брак" />
      </div>
    </template>
    <template #cell(date)="{ value }"><AppTableCell :value="formatDate(String(value))" mono size="xs" color="secondary" /></template>
    <template #cell(workDay)="{ value }">
      <div class="flex flex-col">
        <span v-if="value" class="text-[13px] font-bold text-primary">{{ formatDate(String(value)) }}</span>
        <span v-else class="text-muted text-xs">—</span>
      </div>
    </template>
    <template #cell(status)="{ value }"><AppBadge :variant="getStatusVariant(String(value))" :text="String(value || '—')" /></template>
    <template #cell(direction)="{ value }"><AppBadge v-if="value" :variant="getStatusVariant(String(value))" :text="String(value)" /><AppTableCell v-else value="—" color="muted" /></template>
    <template #cell(quantity)="{ value }"><div class="flex justify-center"><AppBadge variant="warning" :text="formatQuantity(value)" /></div></template>
    <template #cell(quantityFact)="{ value }"><div class="flex justify-center"><AppBadge variant="success" :text="formatQuantity(value)" /></div></template>
    <template #cell(quantityDefect)="{ value }"><div class="flex justify-center"><AppBadge :variant="Number(value) > 0 ? 'error' : 'neutral'" :text="formatQuantity(value)" /></div></template>

    <template #cell(actions)="{ item }">
      <div class="flex items-center gap-8 justify-center">
        <button v-if="permissions.invoice" class="btn btn-secondary btn-icon-sm" :disabled="exportingId === item.id || cancellingId === item.id" @click="exportDocumentToExcel(item.id, item.model)">
          <span v-if="exportingId === item.id" class="mini-loader" />
          <img v-else src="@/components/icons/office-exel.svg" alt="XLS" style="width: 16px; height: 16px; object-fit: contain;" />
        </button>
        <button v-if="permissions.invoice && !filterArchive" class="btn btn-secondary btn-icon-sm text-error hover:bg-error-subtle" :disabled="cancellingId === item.id || exportingId === item.id" @click="openCancelConfirm(item.id)">
          <span v-if="cancellingId === item.id" class="mini-loader" />
          <span v-else class="text-lg">✕</span>
        </button>
      </div>
    </template>
  </BaseDataPage>

  <DocumentCreateModal v-model:is-open="showCreatePanel" :model-type="createModelProp" @saved="fetchDocuments" />
  <DocumentDetailsModal v-model:is-open="showDetailsPanel" :document-id="activeDocumentId" :model-type="activeDocumentModel" :status="activeDocumentStatus" @saved="fetchDocuments" />

  <BaseModal v-model:is-open="showCancelPanel" maxWidth="sm">
    <template #header><span class="text-error font-bold">⚠️ Отмена #{{ cancelDocumentId }}</span></template>
    <div class="flex flex-col gap-12 text-sm leading-relaxed">
      <p>Вы действительно хотите отменить накладную <strong>#{{ cancelDocumentId }}</strong>?</p>
      <p class="text-xs text-muted bg-error-subtle p-8 rounded-6">Товары будут автоматически сняты с брони ячеек WMS.</p>
    </div>
    <template #footer>
      <button class="btn btn-secondary" :disabled="cancellingId !== null" @click="showCancelPanel = false">Нет</button>
      <button class="btn btn-primary bg-error border-error text-white" :disabled="cancellingId !== null" @click="handleCancelConfirm">
        <span v-if="cancellingId !== null" class="mini-loader" />
        <span v-else>Да, отменить</span>
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { stockService, type StockDocument } from '@/api/InvoiceService'
import { useAsync } from '@/composables/useAsync'
import { useToast } from '@/composables/useToast'
import { ExcelDocumentExporter } from '@/composables/excelExporter'
import { formatDate, formatQuantity } from '@/utils/formatters'
import { getStatusVariant } from '@/utils/ui-helpers'
import BaseDataPage from '@/components/ui/BaseDataPage.vue'
import { AppBadge, AppTableCell, type TableColumn } from '@/components/ui/BaseTable.vue'
import BaseModal from '@/components/ui/UnifiedUI.vue'
import DocumentCreateModal from './InvoiceCreateModal.vue'
import DocumentDetailsModal from './InvoiceDetailsModal.vue'
import { adminService } from '@/api/adminService'

type DocModel = 'FBO' | 'ORD' | 'DEF'
const currentModel = ref<DocModel>('FBO'), filterArchive = ref(false), documents = ref<StockDocument[]>([])
const showCreatePanel = ref(false), showDetailsPanel = ref(false), showCancelPanel = ref(false)
const activeDocumentId = ref<number | null>(null), cancelDocumentId = ref<number | null>(null), exportingId = ref<number | null>(null), cancellingId = ref<number | null>(null)

const toast = useToast(), { loading: isLoadingDocs, run: runLoadDocs } = useAsync(), permissions = computed(() => adminService.permissions.value)
const tabs = [{ label: 'Приходы', value: 'FBO' }, { label: 'Отгрузки', value: 'ORD' }]
const activeDocument = computed(() => documents.value.find(d => d.id === activeDocumentId.value))
const activeDocumentModel = computed(() => activeDocument.value?.model as DocModel || currentModel.value)
const activeDocumentStatus = computed(() => activeDocument.value?.status)
const createModelProp = computed(() => currentModel.value === 'DEF' ? 'ORD' : currentModel.value as 'FBO' | 'ORD')

const columns = computed<TableColumn<StockDocument>[]>(() => [
  { key: 'id', label: '№', sortable: true, filterable: true, width: '100px' },
  { key: 'workDay', label: currentModel.value === 'FBO' ? 'Дата прихода' : 'Дата отгрузки', sortable: true, minWidth: '200px' },
  ...(currentModel.value !== 'FBO' ? [{ key: 'direction', label: 'Направление', sortable: true, minWidth: '160px' }] : []),
  { key: 'status', label: 'Статус', sortable: true, filterable: true, minWidth: '220px' },
  ...(currentModel.value === 'FBO'
    ? [{ key: 'quantity', label: 'Ожидаемое', sortable: true }, { key: 'quantityFact', label: 'Факт', sortable: true }, { key: 'quantityDefect', label: 'Брак', sortable: true }]
    : [{ key: 'quantity', label: 'Кол-во', sortable: true }, { key: 'quantityFact', label: 'Факт', sortable: true }]),
  { key: 'actions', label: '#', width: '140px' }
])

const fetchDocuments = () => runLoadDocs(async () => documents.value = await stockService.getDocuments(currentModel.value, filterArchive.value))
const exportDocumentToExcel = async (id: number, m: string) => {
  if (exportingId.value || cancellingId.value) return
  exportingId.value = id
  try { ExcelDocumentExporter.exportDetails(await stockService.getDocumentDetails(id), id, m as DocModel); toast.success(`Спецификация #${id} скачана!`) }
  catch { toast.error('Ошибка экспорта') } finally { exportingId.value = null }
}

const openCancelConfirm = (id: number) => { if (!cancellingId.value && !exportingId.value) { cancelDocumentId.value = id; showCancelPanel.value = true } }
const handleCancelConfirm = async () => {
  if (!cancelDocumentId.value) return
  cancellingId.value = cancelDocumentId.value
  try {
    const res = await stockService.cancelDocument(cancelDocumentId.value)
    toast.success(res.message || `Накладная #${cancelDocumentId.value} отменена`); showCancelPanel.value = false; fetchDocuments()
  } catch { toast.error('Ошибка отмены') } finally { cancellingId.value = null }
}

const openDetails = (id: number) => { activeDocumentId.value = id; showDetailsPanel.value = true }
onMounted(fetchDocuments)
</script>
