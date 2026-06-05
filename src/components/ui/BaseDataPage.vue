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
            <span>Экспорт</span>
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
        <template v-for="(_, name) in $slots" :key="name" v-slot:[name]="slotData">
          <slot :name="name" v-bind="slotData"></slot>
        </template>
      </BaseTable>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends Record<string, unknown>">
import { ref, computed } from 'vue'
import BaseTable, { type TableColumn } from './BaseTable.vue'

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

defineEmits<{
  tabChange: [value: string | number]
}>()

// Описываем форму экспортируемых методов таблицы
interface TableInstance {
  triggerExcelExport: (fileName: string) => void
  filteredAndSortedItems: unknown[]
  hasActiveFilters: boolean
}

// Переменная для хранения ссылки на дочерний компонент таблицы
const tableRef = ref<TableInstance | null>(null)

// Локальный метод для обработки клика
const handleExportClick = () => {
  console.log('Клик по кнопке экспорт зафиксирован!')
  console.log('Текущий инстанс таблицы в ref:', tableRef.value)

  if (tableRef.value && typeof tableRef.value.triggerExcelExport === 'function') {
    tableRef.value.triggerExcelExport(props.title)
  } else {
    console.error(
      'Критическая ошибка: метод triggerExcelExport не найден в tableRef! Проверь defineExpose в BaseTable.vue',
    )
    // Если по какой-то причине реф не связался, выведи нативный алерт, чтобы понять это сразу в браузере:
    alert('Ошибка инициализации таблицы. Открой консоль разработчика (F12)')
  }
}

const slots = defineSlots()
const hasHeader = computed(() => props.hasHeader || !!slots['header-actions'])
</script>

<style scoped>
.data-page {
  width: 100%;
}
.page-header {
  padding: var(--spacing-16) var(--spacing-24);
}

.excel-icon-img {
  width: 16px;
  height: 16px;
  object-fit: contain;
  display: block;
  margin-right: 6px;
}

.page-tabs {
  display: flex;
  gap: var(--spacing-16);
  border-bottom: 1px solid var(--color-border);
  overflow-x: auto;
}
.tab-btn {
  background: transparent;
  border: none;
  padding: var(--spacing-12) var(--spacing-4);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: color var(--transition-fast);
  position: relative;
  white-space: nowrap;
}
.tab-btn:hover {
  color: var(--color-text-primary);
}
.tab-btn--active {
  color: var(--color-primary);
  font-weight: 600;
}
.tab-btn--active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: var(--color-primary);
}
.tab-icon {
  margin-right: var(--spacing-8);
}
</style>
