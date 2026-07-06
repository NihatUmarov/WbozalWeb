<!-- BaseDataPage.vue -->
<template>
  <div class="data-page flex flex-col gap-20">
    <div class="card page-header" v-if="hasHeader">
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

    <div class="page-tabs" v-if="tabs && tabs.length > 0">
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

    <div class="w-full">
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
      >
        <template v-for="(_, name) in $slots as Record<string, any>" :key="name" #[name]="slotData">
          <slot :name="name" v-bind="slotData || {}"></slot>
        </template>
      </BaseTable>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends Record<string, unknown>">
import { ref, computed } from 'vue'
import BaseTable from './BaseTable.vue'
import type { TableColumn } from './BaseTable.vue'

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

defineEmits<{ tabChange: [value: string | number] }>()

interface TableInstance {
  triggerExcelExport: (fileName: string) => void
  filteredAndSortedItems: unknown[]
  hasActiveFilters: boolean
}

const tableRef = ref<TableInstance | null>(null)

const handleExportClick = () => {
  if (tableRef.value?.triggerExcelExport) {
    tableRef.value.triggerExcelExport(props.title)
  }
}

const slots = defineSlots()
const hasHeader = computed(() => props.hasHeader || !!slots['header-actions'])
</script>
