<template>
  <div class="data-page flex flex-col gap-12 h-full overflow-hidden pb-16">
    <!-- Header Section -->
    <header v-if="hasHeader" class="card page-header flex items-center justify-between flex-wrap gap-12 shrink-0">
      <h1 class="m-0 text-2xl font-bold">{{ title }}</h1>
      <div class="flex items-center gap-12">
        <button
          v-if="showExcelExport"
          type="button"
          class="btn btn-secondary flex items-center gap-8"
          :disabled="loading || !items.length"
          @click="handleExportClick"
        >
          <img src="@/components/icons/office-exel.svg" alt="Excel" width="20" height="20" class="excel-icon-img" />
          <span>Выгрузить в Excel</span>
        </button>
        <slot name="header-actions" />
      </div>
    </header>

    <!-- Tabs Section -->
    <nav v-if="tabs?.length" class="page-tabs flex gap-12 shrink-0">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        :class="['tab-btn', { 'tab-btn--active': currentTab === tab.value }]"
        @click="$emit('tabChange', tab.value)"
      >
        <span v-if="tab.icon" class="tab-icon">{{ tab.icon }}</span>
        <span class="text-sm font-semibold">{{ tab.label }}</span>
      </button>
    </nav>

    <!-- Content Section -->
    <main class="flex-1 min-h-0 w-full overflow-hidden">
      <slot :items="items" :columns="columns" :loading="loading" :register-table="registerExternalTable">
        <!-- Default Table if no slot provided -->
        <BaseTable
          ref="tableRef"
          :items="items"
          :columns="columns"
          :loading="loading"
          :loading-text="loadingText"
          :empty-text="emptyText"
          :empty-icon="emptyIcon"
          :max-height="tableMaxHeight"
          :row-class="rowClass"
          @row-click="onRowClick"
        >
          <!-- Forward all table slots -->
          <template v-for="(_, name) in $slots" :key="name" #[name]="slotData">
            <slot :name="name" v-bind="slotData || {}" />
          </template>
        </BaseTable>
      </slot>
    </main>

    <!-- Details Modal (Sheet) -->
    <BaseDialog v-model:is-open="isRowModalOpen" variant="sheet" max-width="5xl">
      <template #header>
        <h2 class="text-xl font-bold m-0 flex items-center gap-12">Детали записи</h2>
      </template>
      <slot name="row-details" :item="selectedRowItem" :close="closeRowModal" />
    </BaseDialog>
  </div>
</template>

<script setup lang="ts" generic="T extends Record<string, unknown>">
import { ref, computed, useSlots } from 'vue'
import BaseTable, { type TableColumn, type TableExposed } from './BaseTable.vue'
import BaseDialog from './UnifiedUI.vue'

export interface TabItem {
  label: string
  value: string | number
  icon?: string
}

export interface DataPageExposed<T = Record<string, unknown>> {
  openRowDetails: (item: T) => void
  closeRowDetails: () => void
  triggerExport: () => void
  clearFilters: () => void
}

interface Props {
  title: string
  items: T[]
  columns: TableColumn<T>[]
  loading?: boolean
  tabs?: TabItem[]
  currentTab?: string | number
  loadingText?: string
  emptyText?: string
  emptyIcon?: string
  tableMaxHeight?: string
  rowClass?: (item: T) => string
  hasHeader?: boolean
  showExcelExport?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  loadingText: 'Загрузка...',
  emptyText: 'Нет данных',
  emptyIcon: '📂',
  hasHeader: true,
  showExcelExport: true,
  tableMaxHeight: 'calc(100vh - 220px)'
})

const emit = defineEmits<{
  (e: 'tabChange', value: string | number): void
  (e: 'rowClick', item: T): void
}>()

const tableRef = ref<TableExposed | null>(null)
const externalTableRef = ref<TableExposed | null>(null)
const isRowModalOpen = ref(false)
const selectedRowItem = ref<T | null>(null)
const slots = useSlots()

const registerExternalTable = (instance: unknown) => {
  externalTableRef.value = instance as TableExposed
}

const handleExportClick = () => {
  const table = externalTableRef.value || tableRef.value
  if (table) table.triggerExcelExport(props.title)
}

const onRowClick = (item: T) => {
  emit('rowClick', item)
  if (slots['row-details']) {
    selectedRowItem.value = item
    isRowModalOpen.value = true
  }
}

const closeRowModal = () => {
  isRowModalOpen.value = false
  selectedRowItem.value = null
}

const hasHeader = computed(() => props.hasHeader || !!slots['header-actions'])

defineExpose({
  openRowDetails: onRowClick,
  closeRowDetails: closeRowModal,
  triggerExport: handleExportClick,
  clearFilters: () => (externalTableRef.value || tableRef.value)?.clearFilters()
})
</script>
