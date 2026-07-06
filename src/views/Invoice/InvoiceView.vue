<template>
  <BaseDataPage
    title="Накладные"
    :items="documents"
    :columns="columns"
    :loading="isLoadingDocs"
    :tabs="tabs"
    :current-tab="currentModel"
    :row-class="(item) => (item.model === 'DEF' ? 'row-defect' : '')"
    @tab-change="handleTabChange"
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
        <span class="text-primary font-bold font-mono text-sm tabular-nums">#{{ value }}</span>
        <span
          v-if="item.model === 'DEF'"
          class="badge badge--error text-[10px] uppercase font-extrabold px-4 py-2"
          style="line-height: 1"
        >
          Брак
        </span>
      </div>
    </template>

    <template #cell(date)="{ value }">
      <span class="text-secondary font-mono text-xs tabular-nums">
        {{ formatDate(String(value)) }}
      </span>
    </template>

    <template #cell(workDay)="{ value }">
      <span v-if="value" class="text-main font-mono text-xs tabular-nums fw-semibold">
        {{ formatDate(String(value)) }}
      </span>
      <span v-else class="text-muted text-xs">—</span>
    </template>

    <template #cell(status)="{ value }">
      <span :class="['badge', `badge--${getStatusVariant(String(value))}`]">
        {{ value || 'Нет статуса' }}
      </span>
    </template>

    <template #cell(direction)="{ value }">
      <span :class="['badge', `badge--${getStatusVariant(String(value))}`]">
        {{ value || 'Нет направления' }}
      </span>
    </template>

    <template #cell(quantity)="{ value }">
      <span
        v-if="Number(value) > 0"
        class="text-xs font-semibold text-warning bg-warning-subtle border-warning px-6 py-4 rounded-6 tabular-nums"
      >
        {{ value }} шт.
      </span>
      <span v-else class="text-muted text-xs font-medium tabular-nums">0 шт.</span>
    </template>

    <template #cell(quantityFact)="{ value }">
      <span
        v-if="Number(value) > 0"
        class="text-xs font-bold text-success bg-success-subtle border-success px-6 py-4 rounded-6 tabular-nums"
      >
        {{ value }} шт.
      </span>
      <span v-else class="text-muted text-xs font-medium tabular-nums">0 шт.</span>
    </template>

    <template #cell(quantityDefect)="{ value }">
      <span
        v-if="Number(value) > 0"
        class="text-xs font-bold text-error bg-error-subtle border-error px-6 py-4 rounded-6 tabular-nums"
      >
        {{ value }} шт.
      </span>
      <span v-else class="text-muted text-xs font-medium tabular-nums">0 шт.</span>
    </template>

    <template #cell(model)="{ value }">
      <span :class="['badge', value === 'DEF' ? 'badge--error' : 'badge--success']">
        {{ value === 'DEF' ? 'Брак' : 'Стандартная' }}
      </span>
    </template>

    <template #cell(actions)="{ item }">
      <div class="flex items-center gap-6 justify-start">
        <button
          class="btn btn-secondary btn-xs h-32 px-12 flex items-center justify-center"
          @click="openDetails(item.id)"
        >
          👁 Состав
        </button>

        <button
          v-if="permissions.invoice"
          class="btn btn-secondary btn-xs flex items-center justify-center shrink-0"
          style="
            width: 32px;
            height: 32px;
            min-width: 32px;
            min-height: 32px;
            padding: 0 !important;
          "
          :disabled="exportingId === item.id || cancellingId === item.id"
          @click="exportDocumentToExcel(item.id, item.model)"
          title="Скачать спецификацию в Excel"
        >
          <span v-if="exportingId === item.id" class="mini-loader"></span>
          <img
            v-else
            src="@/components/icons/office-exel.svg"
            alt="Excel"
            style="width: 18px; height: 18px; display: block; margin: 0 auto"
          />
        </button>

        <button
          v-if="permissions.invoice && !filterArchive"
          class="btn btn-secondary btn-xs flex items-center justify-center shrink-0 hover:bg-error-subtle transition-colors"
          style="
            width: 32px;
            height: 32px;
            min-width: 32px;
            min-height: 32px;
            padding: 0 !important;
          "
          :disabled="cancellingId === item.id || exportingId === item.id"
          @click="openCancelConfirm(item.id)"
          title="Отменить документ и снять резерв с ячеек"
        >
          <span v-if="cancellingId === item.id" class="mini-loader"></span>
          <span v-else style="font-size: 13px; display: block; line-height: 1; color: #ef4444"
            >❌</span
          >
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
import type { StockDocument } from '@/api/InvoiceService'
import BaseDataPage, { type TabItem } from '@/components/ui/BaseDataPage.vue'
import type { TableColumn } from '@/components/ui/BaseTable.vue'
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
  if (modelFromServer === 'FBO' || modelFromServer === 'ORD' || modelFromServer === 'DEF') {
    return modelFromServer
  }
  return currentModel.value
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

  baseCols.push({ key: 'actions', label: 'Спецификация', width: '180px' })
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

const formatDate = (d: string): string => {
  if (!d || d === 'null') return ''
  return new Date(d).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const getStatusVariant = (s: string): 'success' | 'info' | 'neutral' => {
  const l = (s || '').toLowerCase()
  if (l.includes('архив')) return 'neutral'
  if (l.includes('работе') || l.includes('готов')) return 'success'
  return 'info'
}

onMounted(fetchDocuments)
</script>
