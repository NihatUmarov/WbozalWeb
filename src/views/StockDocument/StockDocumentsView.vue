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
        <div class="flex items-center gap-12">
          <button
            v-if="['FBO', 'ORD'].includes(currentModel)"
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

      <template #cell(id)="{ value }">
        <span class="text-primary font-bold font-mono text-sm tabular-nums">#{{ value }}</span>
      </template>

      <template #cell(date)="{ value }">
        <span class="text-secondary font-mono text-xs tabular-nums">{{
          formatDate(String(value))
        }}</span>
      </template>

      <template #cell(status)="{ value }">
        <span :class="['badge', `badge--${getStatusVariant(String(value))}`]">
          {{ value || 'Нет статуса' }}
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

      <template #cell(actions)="{ item }">
        <button class="action-btn" @click="openDetails(item.id)">👁 Состав</button>
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
import type { TableColumn } from '@/components/ui/BaseTable.vue'
import TheToast from '@/components/ui/TheToast.vue'
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

<style scoped>
.action-btn {
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  padding: var(--spacing-4) var(--spacing-12);
  border-radius: var(--radius-6);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}
.action-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
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

/* Маппинг специфичных цветов баджей для текстовых статусов накладных */
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
