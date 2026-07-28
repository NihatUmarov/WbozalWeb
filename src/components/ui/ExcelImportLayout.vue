<template>
  <div class="flex flex-col gap-24 py-12">
    <section class="flex items-center justify-between gap-12 flex-wrap pb-8 border-b">
      <div class="flex items-center gap-16">
        <h3 class="text-lg font-bold text-primary m-0">{{ title }}</h3>
        <AppBadge v-if="hasData" variant="success" :text="statusText" />
      </div>
      <input
        type="file"
        ref="fileInputRef"
        accept=".xlsx, .xls"
        class="hidden"
        @change="onFileChange"
      />
    </section>

    <!-- Инструкция / Зона загрузки -->
    <div
      v-if="!hasData && !hasErrors"
      class="flex flex-col items-center justify-center p-32 border-dark rounded-12 bg-secondary py-32 gap-20 border-dashed"
    >
      <div class="flex flex-col items-center text-center gap-4">
        <p class="text-primary font-semibold text-base m-0">{{ templateTitle }}</p>
        <p class="text-muted text-xs m-0">{{ templateDescription }}</p>
      </div>

      <div class="mock-excel-table rounded-6 overflow-hidden w-full max-w-[480px]">
        <div class="mock-row mock-header" :style="gridStyle">
          <div class="mock-cell cell-idx"></div>
          <div v-for="col in templateColumns" :key="col" class="mock-cell">{{ col }}</div>
        </div>
        <slot name="mock-rows"></slot>
      </div>

      <button class="btn btn-primary flex items-center gap-8 mt-4" @click="triggerInput">
        <span>Выбрать и загрузить Excel</span>
      </button>
    </div>

    <!-- Ошибки -->
    <div v-if="hasErrors" class="bg-error-subtle p-16 rounded-8 border-error border">
      <div class="flex justify-between items-center mb-12">
        <h4 class="text-error m-0 text-sm font-bold">Выявлены ошибки в файле:</h4>
        <button class="btn btn-secondary btn-xs border-error text-error bg-transparent" @click="reset">
          Попробовать снова
        </button>
      </div>
      <ul class="m-0 text-xs text-error pl-16 flex flex-col gap-4 max-h-[160px] overflow-y-auto font-medium">
        <li v-for="(err, i) in errors" :key="i">{{ err }}</li>
      </ul>
    </div>

    <!-- Контент после загрузки -->
    <slot v-if="hasData"></slot>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { AppBadge } from '@/components/ui/BaseTable.vue'

const props = defineProps<{
  title: string
  statusText: string
  hasData: boolean
  errors: string[]
  templateTitle: string
  templateDescription: string
  templateColumns: string[]
  gridColumns?: string // e.g. "32px 1fr 1fr 80px"
}>()

const emit = defineEmits<{
  (e: 'file-selected', file: File): void
  (e: 'reset'): void
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const hasErrors = computed(() => props.errors.length > 0)
const gridStyle = computed(() => ({
  gridTemplateColumns: props.gridColumns || `32px repeat(${props.templateColumns.length}, 1fr)`,
}))

const triggerInput = () => fileInputRef.value?.click()
const reset = () => {
  if (fileInputRef.value) fileInputRef.value.value = ''
  emit('reset')
}

const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files?.length) {
    emit('file-selected', target.files[0])
    target.value = ''
  }
}
</script>

<style>
.mock-excel-table {
  display: flex;
  flex-direction: column;
  width: 100%;
  border: 1px solid var(--color-border-dark);
  font-size: 11px;
  background: var(--color-surface);
  color: var(--color-text-primary);
}
.mock-row {
  display: grid;
  border-bottom: 1px solid var(--color-border-dark);
}
.mock-row:last-child {
  border-bottom: none;
}
.mock-cell {
  padding: 4px 8px;
  border-right: 1px solid var(--color-border-dark);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mock-cell:last-child {
  border-right: none;
}
.mock-cell.cell-idx {
  background-color: var(--color-background-secondary);
  text-align: center;
  font-weight: 600;
  color: var(--color-text-secondary);
}
.mock-header {
  background-color: var(--color-background-secondary);
  text-align: center;
  font-weight: 600;
  color: var(--color-text-secondary);
}
</style>
