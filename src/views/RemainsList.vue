<template>
  <MainLayout>
    <BaseDataPage
      title="Остатки товаров"
      :items="remains"
      :columns="columns"
      :loading="loading"
      :row-class="(item) => (item.isDefect ? 'row-defect' : '')"
      empty-text="Остатков не найдено"
      empty-icon="📦"
    >
      <template #header-actions>
        <label class="toggle toggle-defect">
          <input type="checkbox" v-model="filterDefect" @change="fetchRemains" />
          <div class="toggle-track"></div>
          <span>Показать только брак</span>
        </label>
      </template>

      <template #cell(cArt)="{ value }">
        <span
          class="font-mono text-xs font-semibold text-primary bg-secondary border-dark px-6 py-4 rounded-6"
        >
          {{ value || '—' }}
        </span>
      </template>

      <template #cell(barcode)="{ value }">
        <span
          class="font-mono text-xs text-muted bg-secondary border-dark px-6 py-4 rounded-6 tracking-wide"
        >
          {{ value || '—' }}
        </span>
      </template>

      <template #cell(cName)="{ value }">
        <div
          class="text-sm font-semibold text-primary truncate max-w-md"
          :title="String(value || '')"
        >
          {{ value || 'Без названия' }}
        </div>
      </template>

      <template #cell(irQuant)="{ value }">
        <span
          v-if="Number(value) > 0"
          class="text-xs font-bold text-success bg-success-subtle border-success px-6 py-4 rounded-6 tabular-nums"
        >
          {{ value }} шт.
        </span>
        <span v-else class="text-muted text-xs font-medium tabular-nums">0 шт.</span>
      </template>

      <template #cell(iBronTask)="{ value }">
        <span
          v-if="Number(value) > 0"
          class="text-xs font-semibold text-warning bg-warning-subtle border-warning px-6 py-4 rounded-6 tabular-nums"
        >
          {{ value }} шт.
        </span>
        <span v-else class="text-muted text-xs font-medium tabular-nums">—</span>
      </template>

      <template #cell(isDefect)="{ value }">
        <span :class="['badge', value ? 'badge--error' : 'badge--success']">
          {{ value ? 'Брак' : 'Исправен' }}
        </span>
      </template>
    </BaseDataPage>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import MainLayout from '@/components/ui/MainLayout.vue'
import BaseDataPage from '@/components/ui/BaseDataPage.vue'
import type { TableColumn } from '@/components/ui/BaseTable.vue'
import { remainsService } from '@/api/remainsService'
import { useAsync } from '@/composables/useAsync'
import type { RemainItem } from '@/api/types'

const remains = ref<RemainItem[]>([])
const filterDefect = ref(false)
const { loading, run } = useAsync()

const columns: TableColumn<RemainItem>[] = [
  { key: 'cArt', label: 'Артикул', sortable: true, filterable: true, width: '140px' },
  { key: 'barcode', label: 'Штрихкод', sortable: true, filterable: true, width: '180px' },
  { key: 'cName', label: 'Название товара', sortable: true, filterable: true, minWidth: '300px' },
  { key: 'irQuant', label: 'Доступно', sortable: true, width: '130px' },
  { key: 'iBronTask', label: 'В резерве', sortable: true, width: '130px' },
  { key: 'isDefect', label: 'Состояние', sortable: true, width: '120px' },
]

const fetchRemains = () => {
  run(async () => {
    remains.value = await remainsService.getRemains(filterDefect.value)
  })
}

onMounted(fetchRemains)
</script>

<style scoped>
.border-dark {
  border: 1px solid var(--color-border-dark);
}
.border-success {
  border: 1px solid rgba(34, 197, 94, 0.1);
}
.border-warning {
  border: 1px solid rgba(245, 158, 11, 0.1);
}
.rounded-6 {
  border-radius: var(--radius-6);
}
.px-4 {
  padding-left: var(--spacing-4);
  padding-right: var(--spacing-4);
}
.py-4 {
  padding-top: var(--spacing-4);
  padding-bottom: var(--spacing-4);
}
.px-6 {
  padding-left: var(--spacing-6);
  padding-right: var(--spacing-6);
}
.row-defect :deep(td) {
  background-color: var(--color-error-subtle) !important;
  opacity: 0.9;
}
</style>
