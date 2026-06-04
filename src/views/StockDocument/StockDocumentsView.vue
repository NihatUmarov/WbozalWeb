<template>
  <MainLayout>
    <BaseDataPage
      title="Накладные"
      :items="documents"
      :columns="columns"
      :loading="isLoadingDocs"
      :tabs="tabs"
      :current-tab="currentModel"
      @tab-change="(v) => changeTab(v as DocModel)"
    >
      <template #header-actions>
        <div class="flex items-center gap-3">
          <BaseButton v-if="['FBO', 'ORD'].includes(currentModel)" @click="showCreatePanel = true">
            + Создать {{ currentModel === 'FBO' ? 'приход' : 'отгрузку' }}
          </BaseButton>

          <ToggleSwitch
            v-model="filterArchive"
            label="Архивные записи"
            @update:model-value="fetchDocuments"
          />
        </div>
      </template>

      <template #cell(id)="{ value }">
        <span class="text-primary font-semibold tabular-nums">#{{ value }}</span>
      </template>

      <template #cell(date)="{ value }">
        <span class="text-secondary text-sm tabular-nums">{{ formatDate(String(value)) }}</span>
      </template>

      <template #cell(status)="{ value }">
        <StatusBadge :variant="getStatusVariant(String(value))">
          {{ value || 'Нет статуса' }}
        </StatusBadge>
      </template>

      <template #cell(quantityFact)="{ value }">
        <span
          :class="Number(value) > 0 ? 'text-success font-semibold' : 'text-secondary tabular-nums'"
        >
          {{ Number(value) > 0 ? `${value} шт.` : '0' }}
        </span>
      </template>

      <template #cell(quantityDefect)="{ value }">
        <span
          :class="
            Number(value) > 0
              ? 'text-error font-semibold bg-error-subtle rounded px-2.5 py-1 text-xs tabular-nums'
              : 'text-secondary tabular-nums'
          "
        >
          {{ Number(value) > 0 ? `${value} шт.` : '0' }}
        </span>
      </template>

      <template #cell(actions)="{ item }">
        <button
          class="bg-secondary border border-border text-secondary px-3 py-1 rounded text-xs font-medium cursor-pointer transition-all hover:border-primary hover:text-primary"
          @click="openDetails(item.id)"
        >
          👁 Состав
        </button>
      </template>
    </BaseDataPage>

    <DocumentCreateModal
      v-model:is-open="showCreatePanel"
      :model-type="currentModel"
      :toast="toastRef"
      @saved="fetchDocuments"
    />

    <DocumentDetailsModal
      v-model:is-open="showDetailsPanel"
      :document-id="activeDocumentId"
      :model-type="currentModel"
      :status="documents.find((d) => d.id === activeDocumentId)?.status"
    />

    <TheToast ref="toastRef" />
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { stockService } from '@/api/stockService'
import { useAsync } from '@/composables/useAsync'
import type { StockDocument } from '@/api/types'

import MainLayout from '@/components/ui/MainLayout.vue'
import BaseDataPage, { type TabItem } from '@/components/ui/BaseDataPage.vue'
import { type TableColumn } from '@/components/ui/BaseTable.vue'
import ToggleSwitch from '@/components/ui/ToggleSwitch.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import TheToast from '@/components/ui/TheToast.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import DocumentCreateModal from './DocumentCreateModal.vue'
import DocumentDetailsModal from './DocumentDetailsModal.vue'

type DocModel = 'FBO' | 'ORD'

const currentModel = ref<DocModel>('FBO')
const filterArchive = ref(false)
const documents = ref<StockDocument[]>([])

const toastRef = ref<InstanceType<typeof TheToast> | null>(null)
const showCreatePanel = ref(false)
const showDetailsPanel = ref(false)
const activeDocumentId = ref<number | null>(null)

const { loading: isLoadingDocs, run: runLoadDocs } = useAsync()

const tabs: TabItem[] = [
  { label: 'Приходы', value: 'FBO' },
  { label: 'Отгрузки', value: 'ORD' },
]

const columns = computed<TableColumn<StockDocument & { actions?: unknown }>[]>(() => [
  { key: 'id', label: '№ документа', sortable: true, filterable: true },
  { key: 'date', label: 'Дата создания', sortable: true },
  { key: 'status', label: 'Статус', sortable: true, filterable: true },
  {
    key: 'quantity',
    label: currentModel.value === 'FBO' ? 'Ожидаемое кол-во' : 'Кол-во',
    sortable: true,
  },
  { key: 'quantityFact', label: 'Факт. принято', sortable: true },
  { key: 'quantityDefect', label: 'Брак', sortable: true },
  { key: 'actions', label: 'Спецификация', width: '120px' },
])

const fetchDocuments = () => {
  runLoadDocs(async () => {
    documents.value = await stockService.getDocuments({
      model: currentModel.value,
      archive: filterArchive.value,
    })
  })
}

const openDetails = (id: number) => {
  activeDocumentId.value = id
  showDetailsPanel.value = true
}

const changeTab = (model: DocModel) => {
  currentModel.value = model
  fetchDocuments()
}

const formatDate = (d: string) => {
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
