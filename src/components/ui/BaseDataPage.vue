<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<template>
  <div class="data-page flex flex-col gap-12 h-full overflow-hidden pb-16">
    <div v-if="hasHeader" class="card page-header flex items-center justify-between flex-wrap gap-12 shrink-0">
      <h1>{{ title }}</h1>
      <div class="flex items-center gap-12">
        <button v-if="showExcelExport" type="button" class="btn btn-secondary flex items-center gap-8" :disabled="loading || !items.length" @click="handleExportClick">
          <img src="@/components/icons/office-exel.svg" alt="Excel" width="20" height="20" class="excel-icon-img" />
          <span>Выгрузить в Excel</span>
        </button>
        <slot name="header-actions" />
      </div>
    </div>

    <div v-if="tabs?.length" class="page-tabs flex gap-12 shrink-0">
      <button v-for="t in tabs" :key="t.value" :class="['tab-btn', { 'tab-btn--active': currentTab === t.value }]" @click="$emit('tabChange', t.value)">
        <span v-if="t.icon" class="tab-icon">{{ t.icon }}</span>
        <span class="text-sm font-semibold">{{ t.label }}</span>
      </button>
    </div>

    <div class="flex-1 min-h-0 w-full overflow-hidden">
      <slot :items="items" :columns="columns" :loading="loading" :register-table="registerExternalTable">
        <BaseTable ref="tableRef" :items="items" :columns="columns" :loading="loading" :loading-text="loadingText" :empty-text="emptyText" :empty-icon="emptyIcon" max-height="100%" :row-class="rowClass" @rowClick="onRowClick">
          <template v-for="(_, n) in $slots" :key="n" #[n]="d"><slot :name="n" v-bind="d || {}" /></template>
        </BaseTable>
      </slot>
    </div>

    <BaseDialog v-model:is-open="isRowModalOpen" variant="sheet" max-width="5xl">
      <template #header><h2 class="text-xl font-bold m-0 flex items-center gap-12">Детали записи</h2></template>
      <slot name="row-details" :item="selectedRowItem" :close="closeRowModal" />
    </BaseDialog>
  </div>
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
import { ref, computed, useSlots } from 'vue'
import BaseTable, { type TableColumn, type TableExposed } from './BaseTable.vue'
import BaseDialog from './UnifiedUI.vue'

export interface TabItem { label: string; value: string | number; icon?: string }
const props = withDefaults(defineProps<{
  title: string; items: T[]; columns: TableColumn<T>[]; loading?: boolean; tabs?: TabItem[]; currentTab?: string | number; loadingText?: string; emptyText?: string; emptyIcon?: string; tableMaxHeight?: string; rowClass?: (item: T) => string; hasHeader?: boolean; showExcelExport?: boolean
}>(), { loading: false, loadingText: 'Загрузка...', emptyText: 'Нет данных', emptyIcon: '📂', hasHeader: true, showExcelExport: true })

const emit = defineEmits<{ (e: 'tabChange', v: string | number): void; (e: 'rowClick', item: T): void }>()
const tableRef = ref<TableExposed | null>(null), externalTableRef = ref<TableExposed | null>(null)
const isRowModalOpen = ref(false), selectedRowItem = ref<T | null>(null), slots = useSlots()

const registerExternalTable = (i: unknown) => { externalTableRef.value = i as TableExposed }
const handleExportClick = () => (externalTableRef.value || tableRef.value)?.triggerExcelExport(props.title)
const onRowClick = (item: T) => { emit('rowClick', item); if (slots['row-details']) { selectedRowItem.value = item; isRowModalOpen.value = true } }
const closeRowModal = () => { isRowModalOpen.value = false; selectedRowItem.value = null }
const hasHeader = computed(() => props.hasHeader || !!slots['header-actions'])

defineExpose({ openRowDetails: onRowClick, closeRowDetails: closeRowModal, triggerExport: handleExportClick })
</script>
