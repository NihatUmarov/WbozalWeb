<template>
  <BaseDataPage
    title="Накладные"
    :items="documents"
    :columns="columns"
    :loading="isLoadingDocs"
    :tabs="tabs"
    :current-tab="currentModel"
    :row-class="(item) => (item.model === 'DEF' ? 'row-defect' : '')"
    :row-height="72"
    @tab-change="handleTabChange"
    @row-click="item => openDetails(item.id)"
  >
    <template #header-actions>
      <div class="flex items-center gap-12">
        <button
          v-if="['FBO', 'ORD'].includes(currentModel) && permissions.invoice"
          class="btn btn-primary"
          @click="showCreatePanel = true"
        >
          + Создать {{ currentModel === 'FBO' ? 'приход' : 'отгрузку' }}
        </button>

        <label class="toggle">
          <input type="checkbox" v-model="filterArchive" @change="fetchDocuments" />
          <div class="toggle-track"></div>
          <span>Архивные записи</span>
        </label>
      </div>
    </template>

    <template #cell(id)="{ value, item }">
      <div class="flex items-center gap-6">
        <AppTableCell :value="`#${value}`" mono bold color="brand" />
        <AppBadge v-if="item.model === 'DEF'" variant="error" text="Брак" size="xs" />
      </div>
    </template>

    <template #cell(date)="{ value }">
      <AppTableCell :value="formatDate(String(value))" mono size="xs" color="secondary" />
    </template>

    <template #cell(workDay)="{ value }">
      <AppTableCell
        v-if="value"
        :value="formatDate(String(value))"
        mono
        size="xs"
        bold
        color="primary"
      />
      <AppTableCell v-else value="—" color="muted" size="xs" />
    </template>

    <template #cell(status)="{ value }">
      <AppBadge :variant="getStatusVariant(String(value))" :text="String(value || 'Нет статуса')" />
    </template>

    <template #cell(direction)="{ value }">
      <AppBadge
        v-if="value"
        :variant="getStatusVariant(String(value))"
        :text="String(value || 'Нет направления')"
      />
      <AppTableCell v-else value="—" color="muted" />
    </template>

    <template #cell(quantity)="{ value }">
      <AppBadge variant="warning" :text="formatQuantity(value)" />
    </template>

    <template #cell(quantityFact)="{ value }">
      <AppBadge variant="success" :text="formatQuantity(value)" />
    </template>

    <template #cell(quantityDefect)="{ value }">
      <AppBadge variant="error" :text="formatQuantity(value)" />
    </template>

    <template #cell(actions)="{ item }">
      <div class="flex items-center gap-6 justify-center">
        <button
          v-if="permissions.invoice"
          class="btn btn-secondary btn-xs flex items-center justify-center shrink-0"
          style="width: 32px; height: 32px; min-width: 32px; min-height: 32px; padding: 0"
          :disabled="exportingId === item.id || cancellingId === item.id"
          @click="exportDocumentToExcel(item.id, item.model)"
          title="Скачать спецификацию в Excel"
        >
          <span v-if="exportingId === item.id" class="mini-loader"></span>
          <img
            v-else
            src="@/components/icons/office-exel.svg"
            alt="Excel"
            style="width: 18px; height: 18px"
          />
        </button>

        <button
          v-if="permissions.invoice && !filterArchive"
          class="btn btn-secondary btn-xs flex items-center justify-center shrink-0 hover:bg-error-subtle transition-colors"
          style="width: 32px; height: 32px; min-width: 32px; min-height: 32px; padding: 0"
          :disabled="cancellingId === item.id || exportingId === item.id"
          @click="openCancelConfirm(item.id)"
          title="Отменить документ и снять резерв с ячеек"
        >
          <span v-if="cancellingId === item.id" class="mini-loader"></span>
          <span v-else style="font-size: 13px; color: #ef4444">❌</span>
        </button>
      </div>
    </template>
  </BaseDataPage>

  <DocumentCreateModal
    v-model:is-open="showCreatePanel"
    :model-type="createModelProp"
    @saved="fetchDocuments"
  />

  <DocumentDetailsModal
    v-model:is-open="showDetailsPanel"
    :document-id="activeDocumentId"
    :model-type="activeDocumentModel"
    :status="activeDocumentStatus"
    @saved="fetchDocuments"
  />

  <BaseModal v-model:is-open="showCancelPanel" maxWidth="sm">
    <template #header>
      <span class="text-error font-bold">⚠️ Отмена накладной #{{ cancelDocumentId }}</span>
    </template>

    <div class="flex flex-col gap-12 text-sm text-main leading-relaxed">
      <p>
        Вы действительно хотите отменить накладную <strong>#{{ cancelDocumentId }}</strong
        >?
      </p>
      <p class="text-xs text-muted bg-error-subtle p-8 rounded-4">
        Все зарезервированные под этот документ товары будут автоматически сняты с брони ячеек
        хранения WMS.
      </p>
    </div>

    <template #footer>
      <button
        class="btn btn-secondary btn-xs h-32 px-16"
        :disabled="cancellingId !== null"
        @click="showCancelPanel = false"
      >
        Нет
      </button>
      <button
        class="btn btn-primary btn-xs h-32 px-16 bg-error border-error text-white hover:bg-error-dark"
        :disabled="cancellingId !== null"
        @click="handleCancelConfirm"
      >
        <span v-if="cancellingId !== null" class="mini-loader"></span>
        <span v-else>Да, отменить</span>
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { stockService } from '@/api/InvoiceService'
import { useAsync } from '@/composables/useAsync'
import { useToast } from '@/composables/useToast'
import { ExcelDocumentExporter } from '@/composables/excelExporter'
import { formatDate, formatQuantity } from '@/utils/formatters'
import { getStatusVariant } from '@/utils/ui-helpers'
import type { StockDocument } from '@/api/InvoiceService'
import BaseDataPage, { type TabItem } from '@/components/ui/BaseDataPage.vue'
import { AppBadge, AppTableCell, type TableColumn } from '@/components/ui/BaseTable.vue'
import BaseModal from '@/components/ui/UnifiedUI.vue'
import DocumentCreateModal from './InvoiceCreateModal.vue'
import DocumentDetailsModal from './InvoiceDetailsModal.vue'
import { adminService } from '@/api/adminService'

type DocModel = 'FBO' | 'ORD' | 'DEF'

const currentModel = ref<DocModel>('FBO')
const filterArchive = ref<boolean>(false)
const documents = ref<StockDocument[]>([])

const showCreatePanel = ref<boolean>(false)
const showDetailsPanel = ref<boolean>(false)
const showCancelPanel = ref<boolean>(false)

const activeDocumentId = ref<number | null>(null)
const cancelDocumentId = ref<number | null>(null)
const exportingId = ref<number | null>(null)
const cancellingId = ref<number | null>(null)

const toast = useToast()
const { loading: isLoadingDocs, run: runLoadDocs } = useAsync()
const permissions = computed(() => adminService.permissions.value)

const tabs: TabItem[] = [
  { label: 'Приходы', value: 'FBO' },
  { label: 'Отгрузки', value: 'ORD' },
]

const activeDocument = computed(() => documents.value.find((d) => d.id === activeDocumentId.value))

const activeDocumentModel = computed<DocModel>(() => {
  const modelFromServer = activeDocument.value?.model as DocModel | undefined
  return (modelFromServer as DocModel) || currentModel.value
})

const activeDocumentStatus = computed(() => activeDocument.value?.status)

const createModelProp = computed<'FBO' | 'ORD'>(() =>
  currentModel.value === 'DEF' ? 'ORD' : (currentModel.value as 'FBO' | 'ORD'),
)

const columns = computed<TableColumn<StockDocument & { actions?: unknown }>[]>(() => {
  const baseCols: TableColumn<StockDocument & { actions?: unknown }>[] = [
    { key: 'id', label: '№', sortable: true, filterable: true, width: '80px' },
    {
      key: 'workDay',
      label: currentModel.value === 'FBO' ? 'Дата прихода' : 'Дата отгрузки',
      sortable: true,
    },
  ]

  if (currentModel.value !== 'FBO') {
    baseCols.push({
      key: 'direction',
      label: 'Направление',
      sortable: true,
      minWidth: '160px',
    })
  }

  baseCols.push({ key: 'status', label: 'Статус', sortable: true, filterable: true })

  if (currentModel.value === 'FBO') {
    baseCols.push(
      { key: 'quantity', label: 'Ожидаемое кол-во', sortable: true },
      { key: 'quantityFact', label: 'Факт. кол-во', sortable: true },
      { key: 'quantityDefect', label: 'Брак', sortable: true },
    )
  } else {
    baseCols.push(
      { key: 'quantity', label: 'Кол-во', sortable: true },
      { key: 'quantityFact', label: 'Факт. кол-во', sortable: true },
    )
  }

  baseCols.push({ key: 'actions', label: '#', width: '100px' })
  return baseCols
})

const fetchDocuments = (): void => {
  runLoadDocs(async () => {
    documents.value = await stockService.getDocuments(currentModel.value, filterArchive.value)
  })
}

const exportDocumentToExcel = async (id: number, docModel: string): Promise<void> => {
  if (exportingId.value !== null || cancellingId.value !== null) return
  exportingId.value = id
  try {
    const details = await stockService.getDocumentDetails(id)
    ExcelDocumentExporter.exportDetails(details, id, docModel as DocModel)
    toast.success(`Спецификация накладной #${id} успешно скачана!`)
  } catch (error) {
    console.error('[Excel Row Export Error]:', error)
    toast.error('Не удалось экспортировать файл спецификации')
  } finally {
    exportingId.value = null
  }
}

const openCancelConfirm = (id: number): void => {
  if (cancellingId.value !== null || exportingId.value !== null) return
  cancelDocumentId.value = id
  showCancelPanel.value = true
}

const handleCancelConfirm = async (): Promise<void> => {
  if (cancelDocumentId.value === null) return
  cancellingId.value = cancelDocumentId.value
  try {
    const res = await stockService.cancelDocument(cancelDocumentId.value)
    toast.success(res.message || `Документ #${cancelDocumentId.value} успешно отменен`)
    showCancelPanel.value = false
    fetchDocuments()
  } catch (error) {
    console.error('[Cancel Document Error]:', error)
    toast.error('Не удалось отменить документ. Возможно, сборка уже началась.')
  } finally {
    cancellingId.value = null
  }
}

const openDetails = (id: number): void => {
  activeDocumentId.value = id
  showDetailsPanel.value = true
}

const handleTabChange = (value: unknown): void => {
  currentModel.value = value as DocModel
  fetchDocuments()
}

onMounted(fetchDocuments)
</script>
