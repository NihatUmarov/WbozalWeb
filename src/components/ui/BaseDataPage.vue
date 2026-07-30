<template>
  <div class="data-page flex flex-col gap-20 h-full overflow-hidden pb-16">
    <div class="card page-header shrink-0" v-if="hasHeader">
      <div class="flex items-center justify-between flex-wrap gap-12">
        <h1>{{ title }}</h1>

        <div class="flex items-center gap-12">
          <button
            v-if="showExcelExport"
            type="button"
            class="btn btn-secondary flex items-center gap-8"
            :disabled="loading || !items.length"
            @click="handleExportClick"
          >
            <img src="@/components/icons/office-exel.svg" alt="Excel" class="excel-icon-img" />
            <span>Выгрузить в Excel</span>
          </button>
          <slot name="header-actions"></slot>
        </div>
      </div>
    </div>

    <div class="page-tabs shrink-0" v-if="tabs && tabs.length > 0">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        :class="['tab-btn', { 'tab-btn--active': currentTab === tab.value }]"
        @click="$emit('tabChange', tab.value)"
      >
        <span v-if="tab.icon" class="tab-icon">{{ tab.icon }}</span>
        <span>{{ tab.label }}</span>
      </button>
    </div>

    <div class="flex-1 min-h-0 w-full overflow-hidden">
      <slot :items="items" :columns="columns" :loading="loading" :register-table="registerExternalTable">
        <BaseTable
          ref="tableRef"
          :items="items"
          :columns="columns"
          :loading="loading"
          :loading-text="loadingText"
          :empty-text="emptyText"
          :empty-icon="emptyIcon"
          max-height="100%"
          :row-class="rowClass"
          :row-height="rowHeight"
          @rowClick="onRowClick"
        >
          <template v-for="(_, name) in $slots as Record<string, any>" :key="name" #[name]="slotData">
            <slot :name="name" v-bind="slotData || {}"></slot>
          </template>
        </BaseTable>
      </slot>
    </div>

    <!-- ВСТРОЕННЫЙ МЕХАНИЗМ ШТОРКИ ДЛЯ РЕДАКТИРОВАНИЯ/ПРОСМОТРА СТРОКИ -->
    <BaseDialog v-model:is-open="isRowModalOpen" variant="sheet" max-width="5xl">
      <template #header>
        <h2 class="text-xl font-bold m-0 flex items-center gap-12">Детали записи</h2>
      </template>

      <!-- Пробрасываем выбранный элемент и метод закрытия в родительский компонент -->
      <slot name="row-details" :item="selectedRowItem" :close="closeRowModal"></slot>
    </BaseDialog>
  </div>
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
import { ref, computed } from 'vue'
import BaseTable, { type TableColumn } from './BaseTable.vue'
import BaseDialog from './UnifiedUI.vue' // <-- Убедись, что путь к твоей модалке правильный

export interface TabItem {
  label: string
  value: string | number
  icon?: string
}

const props = withDefaults(
  defineProps<{
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
    rowHeight?: number
    hasHeader?: boolean
    showExcelExport?: boolean
  }>(),
  {
    loading: false,
    loadingText: 'Загрузка данных...',
    emptyText: 'Данные не найдены',
    emptyIcon: '📂',
    hasHeader: true,
    showExcelExport: true,
  },
)

const emit = defineEmits<{
  (e: 'tabChange', value: string | number): void
  (e: 'rowClick', item: T): void
}>()

interface TableInstance {
  triggerExcelExport: (fileName: string) => void
  filteredAndSortedItems?: unknown[]
  hasActiveFilters?: boolean
}

const tableRef = ref<TableInstance | null>(null)
const externalTableRef = ref<TableInstance | null>(null)

// Состояние встроенной шторки
const isRowModalOpen = ref(false)
const selectedRowItem = ref<T | null>(null)

const registerExternalTable = (instance: unknown) => {
  externalTableRef.value = instance as TableInstance
}

const handleExportClick = () => {
  const table = externalTableRef.value || tableRef.value
  if (table?.triggerExcelExport) {
    table.triggerExcelExport(props.title)
  }
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

const slots = defineSlots()
const hasHeader = computed(() => props.hasHeader || !!slots['header-actions'])

defineExpose({
  openRowDetails: onRowClick,
  closeRowDetails: closeRowModal,
  triggerExport: handleExportClick
})
</script>
