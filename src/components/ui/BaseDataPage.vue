<template>
  <div class="data-page">
    <!-- Header Section -->
    <div class="data-page__header" v-if="hasHeader">
      <div class="data-page__header-content">
        <h1 class="data-page__title">{{ title }}</h1>

        <!-- Slot for custom header actions (toggles, buttons, etc.) -->
        <div class="data-page__header-actions">
          <slot name="header-actions"></slot>
        </div>
      </div>
    </div>

    <!-- Tabs Section -->
    <div class="data-page__tabs" v-if="tabs && tabs.length > 0">
      <BaseButton
        v-for="tab in tabs"
        :key="tab.value"
        :class="['data-page__tab', { 'data-page__tab--active': currentTab === tab.value }]"
        @click="$emit('tabChange', tab.value)"
      >
        <span class="data-page__tab-icon">{{ tab.icon }}</span>
        <span class="data-page__tab-label">{{ tab.label }}</span>
      </BaseButton>
    </div>

    <!-- Table Section -->
    <div class="data-page__table-wrapper">
      <BaseTable
        :items="items"
        :columns="columns"
        :loading="loading"
        :loading-text="loadingText"
        :empty-text="emptyText"
        :empty-icon="emptyIcon"
        :max-height="tableMaxHeight"
        :row-class="rowClass"
      >
        <!-- Forward all cell slots -->
        <template v-for="(_, name) in $slots" :key="name" v-slot:[name]="slotData">
          <slot :name="name" v-bind="slotData"></slot>
        </template>
      </BaseTable>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
import { computed } from 'vue'
import BaseTable, { type TableColumn } from './BaseTable.vue'
import BaseButton from './BaseButton.vue'

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
  }>(),
  {
    loading: false,
    loadingText: 'Загрузка данных...',
    emptyText: 'Данные не найдены',
    emptyIcon: '📂',
    hasHeader: true,
  },
)

defineEmits<{
  tabChange: [value: string | number]
}>()

// Check if header actions slot is provided
const slots = defineSlots()
const hasHeader = computed(() => props.hasHeader || !!slots['header-actions'])
</script>

<style scoped>
.data-page {
  padding: var(--spacing-24);
  padding-bottom: var(--spacing-64);
  min-height: 100vh;
  background: var(--color-background);
}

.data-page__header {
  background: var(--color-surface);
  border-radius: var(--border-radius-20);
  padding: var(--spacing-24);
  margin-bottom: var(--spacing-24);
  box-shadow: var(--shadow-card);
  border: 1px solid var(--color-border);
  transition: box-shadow var(--transition-base);
}

.data-page__header:hover {
  box-shadow: var(--shadow-card-hover);
}

.data-page__header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.data-page__title {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0;
  letter-spacing: var(--letter-spacing-tight);
}

.data-page__header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-12);
}

.data-page__tabs {
  display: flex;
  gap: var(--spacing-6);
  margin-bottom: var(--spacing-24);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: var(--spacing-4);
}

.data-page__tab {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  width: auto !important;
  padding: var(--spacing-10) var(--spacing-18) !important;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  border-radius: var(--border-radius-8);
  transition: all var(--transition-base);
  flex-shrink: 0;
}

.data-page__tab:hover {
  color: var(--color-text-primary);
  background: var(--color-background-secondary) !important;
}

.data-page__tab--active {
  background: var(--color-surface) !important;
  color: var(--color-primary) !important;
  font-weight: var(--font-weight-semibold);
  box-shadow: var(--shadow-md) !important;
  border: 1px solid var(--color-primary-muted) !important;
}

.data-page__tab-icon {
  font-size: var(--font-size-md);
  margin-right: var(--spacing-8);
}

/* ФИКС: Пустые CSS правила удалены */

@media (max-width: 768px) {
  .data-page {
    padding: var(--spacing-16);
  }

  .data-page__header {
    padding: var(--spacing-16);
  }

  .data-page__header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-16);
  }

  .data-page__header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .data-page__tab {
    padding: var(--spacing-8) var(--spacing-14) !important;
    font-size: var(--font-size-sm);
  }
}
</style>
