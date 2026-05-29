<template>
  <MainLayout>
    <BaseDataPage
      title="Накладные"
      :items="documents"
      :columns="columns"
      :loading="loading"
      :tabs="tabs"
      :current-tab="currentModel"
      @tab-change="(v) => changeTab(v as DocModel)"
    >
      <template #header-actions>
        <ToggleSwitch
          v-model="filterArchive"
          label="Архивные записи"
          @update:model-value="fetchDocuments"
        />
      </template>

      <template #cell(id)="{ value }"
        ><span class="text-primary font-semibold tabular-nums">#{{ value }}</span></template
      >
      <template #cell(date)="{ value }"
        ><span class="text-secondary text-sm tabular-nums">{{
          formatDate(String(value))
        }}</span></template
      >
      <template #cell(status)="{ value }">
        <StatusBadge :variant="getStatusVariant(String(value))">{{
          value || 'Нет статуса'
        }}</StatusBadge>
      </template>
      <template #cell(quantityFact)="{ value }">
        <span v-if="currentModel === 'RET'" class="text-border text-xl tabular-nums">—</span>
        <span
          v-else
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
    </BaseDataPage>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import MainLayout from '@/components/ui/MainLayout.vue'
import BaseDataPage, { type TabItem } from '@/components/ui/BaseDataPage.vue'
import { type TableColumn } from '@/components/ui/BaseTable.vue'
import ToggleSwitch from '@/components/ui/ToggleSwitch.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { stockService } from '@/api/stockService'
import type { StockDocument } from '@/api/types'

type DocModel = 'FBO' | 'ORD' | 'DEF' | 'RET'

const currentModel = ref<DocModel>('FBO')
const filterArchive = ref(false)
const documents = ref<StockDocument[]>([])
const loading = ref(false)

const tabs: TabItem[] = [
  { label: 'Приходы', value: 'FBO' }, // Иконки удалены
  { label: 'Отгрузки', value: 'ORD' },
  { label: 'Брак', value: 'DEF' },
  { label: 'Возвраты', value: 'RET' },
]

const columns = computed<TableColumn<StockDocument>[]>(() => [
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
])

const fetchDocuments = async () => {
  loading.value = true
  try {
    documents.value = await stockService.getDocuments({
      model: currentModel.value,
      archive: filterArchive.value,
    })
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const changeTab = (model: DocModel) => {
  currentModel.value = model
  fetchDocuments()
}

const formatDate = (d: string) => {
  if (!d) return ''
  return new Date(d).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getStatusVariant = (s: string) => {
  const l = (s || '').toLowerCase()
  if (l.includes('архив')) return 'neutral'
  if (l.includes('работе') || l.includes('готов')) return 'success'
  if (l.includes('новы') || l.includes('создан')) return 'info'
  return 'neutral'
}

onMounted(fetchDocuments)
</script>

<style scoped>
/* Для активных табов (кнопок) */
.data-page__tab--active.data-page__tab--FBO {
  background: var(--color-success-subtle) !important;
  color: var(--color-success-text) !important;
  border-color: var(--color-success-muted) !important;
}

.data-page__tab--active.data-page__tab--ORD {
  background: var(--color-warning-subtle) !important;
  color: var(--color-warning-text) !important;
  border-color: var(--color-warning-muted) !important;
}

.data-page__tab--active.data-page__tab--DEF {
  background: var(--color-error-subtle) !important;
  color: var(--color-error-text) !important;
  border-color: var(--color-error-muted) !important;
}

.data-page__tab--active.data-page__tab--RET {
  background: var(--color-info-subtle) !important;
  color: var(--color-info-text) !important;
  border-color: var(--color-info-muted) !important;
}
</style>
